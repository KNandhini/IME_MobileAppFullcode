import time

from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.api.deps import get_analytics_db
from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.components import router as component_router
from app.api.routes.docs import router as doc_router
from app.api.routes.tickets import router as ticket_router
from app.api.routes.users import router as users_router
from app.core.config import settings


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    # global http client
    autotask_request_headers = {
        "Content-Type": "application/json",
        "Secret": settings.AUTOTASK_SECRET,
        "UserName": settings.AUTOTASK_USERNAME,
        "ApiIntegrationCode": settings.AUTOTASK_API_INTEGRATION_CODE,
    }
    app.state.http_client = httpx.AsyncClient(headers=autotask_request_headers)

    try:
        # mongo db client
        app.state.mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = app.state.mongo_client
        app.state.db_logs = db.get_database("db_logs")
        app.state.db_analytics = db.get_database("analytics")
        app.state.db_chats = db.get_database("chats")
        app.state.db_users = db.get_database("users")
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Analytics database not configured. {str(e)}"
        )

    app.state.started_at = time.time()

    # app runs
    yield

    await app.state.http_client.aclose()
    app.state.mongo_client.close()  # no await needed AFAIK


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags}-{route.name}"


app = FastAPI(
    title="API Backend",
    summary="Backend API for TechAnts's Ticket Resolution AI Application",
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "Endpoints for authentication operations.",
        },
        {
            "name": "Documents",
            "description": "Endpoints for documents upload (ingestion pipeline), download, delete and list files & folders.",
        },
        {
            "name": "Tickets",
            "description": "Endpoint for all autotask ticket related functionalities.",
        },
        {
            "name": "Components",
            "description": "Endpoints for operations regarding components.",
        },
        {
            "name": "ChatBot",
            "description": "Endpoint for the core RAG chat function.",
        },
        {
            "name": "Users",
            "description": "Endpoints for user management.",
        },
        {
            "name": "Analytics",
            "description": "Endpoints for analytics and metrics.",
        },
    ],
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=app_lifespan,
)

# mounting all routers
app.include_router(auth_router)
app.include_router(ticket_router)
app.include_router(doc_router)
app.include_router(component_router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(users_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # only the frontend running on port 8080 can call the backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the PDF folder for direct static access.
app.mount("/pdfs", StaticFiles(directory=settings.PDF_FOLDER), name="PDFs")


@app.get("/")
async def home():
    return {"message": "Welcome!"}


# check the connection establishment
@app.get("/health")
async def app_health_check():
    content = {"message": "Sucessfully connected!", "status": "ok"}
    return JSONResponse(content, status_code=200)


@app.get("/uptime")
async def uptime():
    return JSONResponse(
        content={"uptime_seconds": int(time.time() - app.state.started_at)},
        status_code=200,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
    analytics_db: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
):
    await analytics_db["parameter_errors"].insert_one(
        {
            "path": request.url.path,
            "errors": exc.errors(),
            "timestamp": int(time.time()),
        }
    )
    # Return default FastAPI validation response
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )
