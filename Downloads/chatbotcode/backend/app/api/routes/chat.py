import time
from typing import Annotated

from app.api.deps import get_analytics_db, get_current_user
from app.schemas.rag import RAGRequest, RAGResponse
from app.services.rag import query
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(
    prefix="/chat", tags=["ChatBot"], dependencies=[Depends(get_current_user)]
)


@router.post("/rag", response_model=RAGResponse)
async def chat(
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
    request: RAGRequest,
) -> RAGResponse:
    """
    Return the generated answer based on the user's query and chat history
    """

    conversations = []
    for chat in request.chat_history[:-1]:  # except user query
        # langchain chat history spec
        conversations.append(("human" if chat.role == "user" else "ai", chat.content))

    start_time = time.perf_counter()
    rag_answer, top_docs, meta = await query(
        user_question=request.query.replace("\n", " ").strip(),
        chat_history=conversations,
    )
    latency_ms = (time.perf_counter() - start_time) * 1000

    # Log analytics
    now_ts = int(time.time())
    # compute first response time per ticket, if ticket_id present
    first_response_ms = None
    if request.ticket_id is not None:
        # if no prior rag event for this ticket, check ticket_start and compute delta
        existing = await db_analytics["rag_events"].find_one(
            {"ticket_id": request.ticket_id}
        )
        if existing is None:
            start_event = await db_analytics["ticket_events"].find_one(
                {"type": "ticket_start", "ticket_id": request.ticket_id},
                sort=[("timestamp", -1)],
            )
            if start_event:
                first_response_ms = (now_ts - start_event["timestamp"]) * 1000

    await db_analytics["rag_events"].insert_one(
        {
            "type": "rag_response",
            "query": request.query,
            "top_sops": top_docs,
            "latency_ms": latency_ms,
            "ticket_id": request.ticket_id,
            "session_id": request.session_id,
            "top_score": meta.get("top_score"),
            "serp_fallback": meta.get("serp_fallback"),
            "pinecone_latency_ms": meta.get("pinecone_latency_ms"),
            "openai_calls": meta.get("openai_calls"),
            "prompt_tokens": meta.get("prompt_tokens"),
            "completion_tokens": meta.get("completion_tokens"),
            "est_cost_usd": meta.get("total_cost"),  # estimated on the service
            "first_response_ms": first_response_ms,
            "timestamp": now_ts,
        }
    )

    return RAGResponse(answer=rag_answer, top_sops=top_docs)
