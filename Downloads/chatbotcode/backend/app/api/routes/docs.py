import os
import shutil
from pathlib import Path
from typing import Annotated
from urllib.parse import quote

from app.api.deps import get_current_user
from app.core.config import settings
from app.schemas.docs import DocOperationResponse
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_pinecone.vectorstores import PineconeVectorStore
from langchain_text_splitters.character import RecursiveCharacterTextSplitter
from pinecone.grpc import PineconeGRPC

# document loader
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP
)

# embedding function
oai_embedding = OpenAIEmbeddings(
    model=settings.OPENAI_EMBEDDING_MODEL,
    dimensions=settings.OPENAI_EMBEDDING_DIMENSION,
    api_key=settings.OPENAI_API_KEY,
)

# vector store setup
# https://docs.pinecone.io/guides/index-data/upsert-data#python-sdk-with-grpc
pc = PineconeGRPC(api_key=settings.PINECONE_API_KEY)
pc_index = pc.Index(settings.PINECONE_INDEX_NAME, host=settings.PINECONE_INDEX_HOST_URL)
vector_store = PineconeVectorStore(
    index=pc_index,
    embedding=oai_embedding,
    namespace=settings.PINECONE_INDEX_DOCUMENT_NAMESPACE,
)

router = APIRouter(
    prefix="/docs", tags=["Documents"], dependencies=[Depends(get_current_user)]
)


@router.post("/upload", response_model=DocOperationResponse)
async def upload_doc(
    file: Annotated[UploadFile, File(...)],
    folder_name: str | None = Form(None),
) -> DocOperationResponse:
    """
    Upload a document to the application, optionally create a folder and upload the document within it.
    """

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Prevent nested 'documents/documents' folder
    if folder_name and folder_name.strip() == Path(settings.PDF_FOLDER).name:
        folder_name = None

    if folder_name:
        safe_folder_name = quote(folder_name.strip())
        folder_path = os.path.join(settings.PDF_FOLDER, safe_folder_name)

        # created if not already
        os.makedirs(folder_path, exist_ok=True)

        file_path = os.path.join(folder_path, file.filename)
    else:
        file_path = os.path.join(settings.PDF_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ingest the doc
    loader = PyPDFLoader(file_path, mode="page")
    docs = await loader.aload()
    split_docs = text_splitter.split_documents(docs)
    _ = await vector_store.aadd_documents(split_docs)

    return {
        "message": f"File '{file.filename}' uploaded successfully",
    }


@router.get("/download")
async def download_doc(file_name: str, folder_name: str | None = None) -> FileResponse:
    """
    Download an uploaded document, optionally from within a specific folder
    """

    # If folder_name is the same as the base PDF folder name, treat it as root level
    if folder_name and folder_name.strip() == Path(settings.PDF_FOLDER).name:
        folder_name = None

    file_path = (
        os.path.join(settings.PDF_FOLDER, folder_name, file_name)
        if folder_name
        else os.path.join(settings.PDF_FOLDER, file_name)
    )

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=file_name,
        headers={"Content-Disposition": f'inline; filename="{file_name}"'},
    )


@router.post("/delete", response_model=DocOperationResponse)
async def delete_doc(
    file_name: str = Query(..., description="Name of the file to delete"),
    folder_name: str | None = Query(None, description="Optional folder name"),
) -> DocOperationResponse:
    """
    Delete an uploaded document, optionally from within a specific folder
    """

    # If folder_name is the same as the base PDF folder name, treat it as root level
    if folder_name and folder_name.strip() == Path(settings.PDF_FOLDER).name:
        folder_name = None

    file_path = (
        os.path.join(settings.PDF_FOLDER, folder_name, file_name)
        if folder_name
        else os.path.join(settings.PDF_FOLDER, file_name)
    )

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(file_path)
        return {
            "message": f"File '{file_path}' deleted succesfully",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting document: {str(e)}"
        )


@router.get("/list-folders")
async def list_folders() -> list[str]:
    """
    List all the created folders, or the documents folder itself if empty.
    """
    folders = [f.name for f in Path(settings.PDF_FOLDER).iterdir() if f.is_dir()]
    # Always include the root documents folder itself
    documents_folder = Path(settings.PDF_FOLDER).name
    if not folders:
        return [documents_folder]
    return [documents_folder] + folders


@router.get("/list-files")
async def list_files(folder: str | None = None) -> list[str]:
    """
    List all the uploaded files, optionally from a specific existing folder.
    """

    # If folder is the same as the base PDF folder name, treat it as root level
    if folder and folder.strip() == Path(settings.PDF_FOLDER).name:
        folder = None

    folder_path = (
        os.path.join(settings.PDF_FOLDER, folder) if folder else settings.PDF_FOLDER
    )
    if not os.path.isdir(folder_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    return [f.name for f in Path(folder_path).glob("*.pdf")]
