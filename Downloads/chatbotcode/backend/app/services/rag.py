import time

from app.core.config import settings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.callbacks import get_openai_callback
from langchain_community.utilities import SerpAPIWrapper
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import chain
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone.vectorstores import PineconeVectorStore
from pinecone.grpc import PineconeGRPC

llm = ChatOpenAI(
    api_key=settings.OPENAI_API_KEY,
    model=settings.OPENAI_CHAT_MODEL,
    temperature=settings.OPENAI_CHAT_MODEL_TEMPERATURE,
    timeout=None,
    max_retries=2,
)

embedding = OpenAIEmbeddings(
    model=settings.OPENAI_EMBEDDING_MODEL,
    dimensions=settings.OPENAI_EMBEDDING_DIMENSION,
    api_key=settings.OPENAI_API_KEY,
)

pc = PineconeGRPC(api_key=settings.PINECONE_API_KEY)
pc_index = pc.Index(settings.PINECONE_INDEX_NAME, host=settings.PINECONE_INDEX_HOST_URL)
vector_store = PineconeVectorStore(index=pc_index, embedding=embedding, text_key="text")

web_search = SerpAPIWrapper(serpapi_api_key=settings.SERP_API_KEY)


async def do_web_search(query: str) -> Document:
    results = await web_search.arun(query)
    if results:
        return Document(page_content=results)
    else:
        return Document(page_content="No web results found")


# retriever setup to return documents with their score as metadata
@chain
async def retriever(query: str) -> tuple[list[Document], float]:
    pinecone_start = time.perf_counter()
    retrieved_docs = await vector_store.asimilarity_search_with_relevance_scores(
        query,
        k=settings.PINECONE_RETREIVAL_TOPK_DOCUMENTS,
        namespace=settings.PINECONE_INDEX_DOCUMENT_NAMESPACE,
    )
    pinecone_latency_ms = (time.perf_counter() - pinecone_start) * 1000
    if retrieved_docs:
        docs, scores = zip(*retrieved_docs)
        for doc, score in zip(docs, scores):
            doc.metadata["score"] = score
        return docs, pinecone_latency_ms  # TODO: handling could be better
    return retrieved_docs, pinecone_latency_ms


# Contextualize question
contextualize_q_system_prompt = (
    "Given a chat history and the latest user question "
    "which might reference context in the chat history, "
    "formulate a standalone question which can be understood "
    "without the chat history. Do NOT answer the question, just "
    "reformulate it if needed and otherwise return it as is."
)
contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

qa_system_prompt = """You are a highly intelligent assistant helping users by answering their question/query based on the provided content.

Use only the information available in the given context to answer the user's question clearly and accurately.
Respond with natural tone and provide them step-by-step instruction to solve their query.
Do not guess or make assumptions. If the context does not contain relevant information, respond exactly with:

"The provided context does not contain sufficient information to answer the question."

Context:
{context}
"""
qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "User Question:\n{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)


async def query(
    user_question: str, chat_history: list[tuple[str, str]]
) -> tuple[str, list[str], dict]:
    # Offline stub
    if settings.DISABLE_EXTERNAL_SERVICES:
        answer = f"[stubbed] Answer for: {user_question}"
        top_docs = ["stub_sop.pdf"]
        meta = {
            "top_score": 0.95,
            "serp_fallback": False,
            "pinecone_latency_ms": 5.0,
            "openai_calls": 1,
            "prompt_tokens": 100,
            "completion_tokens": 200,
            "total_cost": 0.0,
        }
        return answer, top_docs, meta

    with get_openai_callback() as cb:
        # history aware retrieval, if there is no chat history, the input is as it is.
        openai_calls = 0
        if chat_history:
            history_aware_prompt = await contextualize_q_prompt.ainvoke(
                {"chat_history": chat_history, "input": user_question}
            )
            llm_response = await llm.ainvoke(history_aware_prompt)
            openai_calls += 1
            user_query = llm_response.content.strip()
        else:
            user_query = user_question

        retrieved_documents, pinecone_latency_ms = await retriever.ainvoke(user_query)

        # get unique relevant sop documents
        top_documents = list(
            set(
                [
                    (doc.metadata.get("source") or "").split("/")[-1]
                    for doc in retrieved_documents
                    if doc.metadata.get("source")
                ]
            )
        )

        # extract the score of the top retrived document from its metadata where we stored. on retriever chain func
        top_score = 0.0
        if retrieved_documents:
            top_score = retrieved_documents[0].metadata["score"]

        used_web_search = False
        # if score is above the defined threshold, pass the retrieved content as context, else we pass web search response as context
        if top_score >= settings.RAG_WEB_SEARCH_THRESHOLD:
            # context is retrieved contents, RAG
            response = await question_answer_chain.ainvoke(
                {
                    "context": retrieved_documents,
                    "chat_history": chat_history,
                    "input": user_question,
                }
            )
            openai_calls += 1

            # if any uncertainities in response, do web search
            uncertainity_phrases = [
                "provided context does not contain",
                "no relevant information was found",
                "not enough information",
                "based on the context, it's unclear",
                "i could not find",
            ]
            if any(phrase in response.lower() for phrase in uncertainity_phrases):
                web_search_result = await do_web_search(user_query)
                used_web_search = True
                top_documents = []
                response = await question_answer_chain.ainvoke(
                    {
                        "context": list(retrieved_documents)
                        + [Document(page_content="## Web Search Result:")]
                        + [web_search_result],
                        "chat_history": chat_history,
                        "input": user_question,
                    }
                )
                openai_calls += 1

        else:
            # context is web search results, Web search
            web_search_result = await do_web_search(user_query)
            used_web_search = True
            top_documents = []
            response = await question_answer_chain.ainvoke(
                {
                    "context": list(retrieved_documents)
                    + [Document(page_content="## Web Search Result:")]
                    + [web_search_result],
                    "chat_history": chat_history,
                    "input": user_question,
                }
            )
            openai_calls += 1

        meta = {
            "top_score": top_score,
            "serp_fallback": used_web_search,
            "pinecone_latency_ms": pinecone_latency_ms,
            "openai_calls": openai_calls,
            "prompt_tokens": cb.prompt_tokens,
            "completion_tokens": cb.completion_tokens,
            "total_cost": cb.total_cost,
        }

    return response, top_documents, meta


if __name__ == "__main__":
    # print(
    #     pc_index.describe_namespace(
    #         namespace=settings.PINECONE_INDEX_DOCUMENT_NAMESPACE
    #     )
    # )
    import asyncio

    question = "Log in with the user’s VPN login credentials"
    answer, top_sops, meta = asyncio.run(query(question, chat_history=[]))
    print(answer)
    print(top_sops)
    print(meta)
