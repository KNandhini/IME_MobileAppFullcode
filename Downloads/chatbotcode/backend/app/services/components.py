import json
import time

import httpx
from app.core.config import settings
from langchain_openai import OpenAIEmbeddings

# https://docs.pinecone.io/guides/index-data/upsert-data#python-sdk-with-grpc
from pinecone.grpc import PineconeGRPC
from tqdm import tqdm

pc = PineconeGRPC(api_key=settings.PINECONE_API_KEY)
pc_index = pc.Index(host=settings.PINECONE_INDEX_HOST_URL)

oai_embedder = OpenAIEmbeddings(
    model=settings.OPENAI_EMBEDDING_MODEL,
    dimensions=settings.OPENAI_EMBEDDING_DIMENSION,
    api_key=settings.OPENAI_API_KEY,
)


def load_json_file(file_path):
    with open(file_path, "r") as f:
        return json.load(f)


def safe_metadata_value(value):
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return [str(v) for v in value if v is not None]
    return str(value)


def upload_components_to_pineconedb(components_file_path: str) -> None:
    # delete namespace before upserting
    pc_index.delete_namespace(namespace=settings.PINECONE_INDEX_COMPONENTS_NAMESPACE)
    components: list[dict] = load_json_file(components_file_path)
    vector_records = []

    for id, comp in tqdm(
        enumerate(components, 1), desc="creating records", total=len(components)
    ):
        # metadata
        uid = safe_metadata_value(
            comp.get(settings.SCRIPT_ID_KEY)
        )  # script UID key can be defined in config
        name = safe_metadata_value(comp.get("name"))
        description = safe_metadata_value(comp.get("description"))

        content = f"{name}: {description}"
        content_vector = oai_embedder.embed_query(content)
        record = {
            "id": f"id-{id}",
            "values": content_vector,
            "metadata": {"uid": uid, "name": name, "description": description},
        }
        vector_records.append(record)

    print("Upserting documents in batches...")
    response = pc_index.upsert(
        vectors=vector_records,
        namespace=settings.PINECONE_INDEX_COMPONENTS_NAMESPACE,
        batch_size=100,
        show_progress=True,
    )
    print(response)

    # wait for the upserted vectors to be index on DB
    time.sleep(20)

    # View stats for the index
    print("Index stats:")
    stats = pc_index.describe_index_stats()
    print(stats)


def retrieve_components(query: str) -> list[dict]:
    query_vector = oai_embedder.embed_query(query)
    results = pc_index.query(
        vector=query_vector,
        top_k=settings.PINECONE_RETREIVAL_TOPK_SCRIPTS,
        namespace=settings.PINECONE_INDEX_COMPONENTS_NAMESPACE,
        include_metadata=True,
    )

    retreived_components = [
        match["metadata"] for match in results["matches"]
    ]  # list of uid, name, desc

    return retreived_components


async def get_datto_access_token(httpx_client: httpx.AsyncClient) -> str:
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "password",
        "username": settings.DATTO_API_KEY,
        "password": settings.DATTO_API_SECRET_KEY,
    }
    response = await httpx_client.post(
        f"{settings.DATTO_BASE_URL}/auth/oauth/token",
        headers=headers,
        data=data,
        auth=("public-client", "public"),  # Basic Auth
    )
    response.raise_for_status()
    return response.json().get("access_token")


if __name__ == "__main__":
    # ingest components to vectordb
    upload_components_to_pineconedb("assets/components/components.json")

    # components_lookup = load_json_file("components_index.json")
    # query = "I'm having issue with setting up a VPN"

    # retrived_components = retrieve_components(query, components_lookup, top_k=10)
    # for id, component in enumerate(retrived_components, 1):
    #     print(f"Script #{id}")
    #     print(f"Component Name: {component['name']}")
    #     print(f"Component Description: {component['description']}")
    #     # print(f"Relevancy Score: {score}")
    #     print()

    # test retrieval augementation
    # scripts = get_relevant_scripts(query, components_lookup, n_retrievd_componenets=15)
    # for id, script in enumerate(scripts, 1):
    #     component = components_lookup.get(script.uid)
    #     print(f"Script #{id}")
    #     print(f"Script UID: {component['uid']}")
    #     print(f"Script Name: {component['name']}")
    #     print(f"Script Description: {component['description']}")
    #     print(f"Relevancy Reason: {script.reason}")
    #     print()
