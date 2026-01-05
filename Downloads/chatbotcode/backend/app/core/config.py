import os

from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    env_file: str = ".env"  # running the app from Backend/ resolves relative to the current working directory, which would be Backend/.
    model_config = SettingsConfigDict(
        env_ignore_empty=True, env_file=env_file, extra="ignore"
    )

    SERP_API_KEY: str

    # Pinecone vectorstore configs
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    PINECONE_INDEX_HOST_URL: str
    PINECONE_INDEX_DOCUMENT_NAMESPACE: str
    PINECONE_INDEX_COMPONENTS_NAMESPACE: str
    PINECONE_RETREIVAL_TOPK_DOCUMENTS: int
    PINECONE_RETREIVAL_TOPK_SCRIPTS: int

    # OpenAI configs
    OPENAI_API_KEY: str
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    OPENAI_EMBEDDING_DIMENSION: int = 1024
    OPENAI_CHAT_MODEL: str = "gpt-4-turbo"
    OPENAI_CHAT_MODEL_TEMPERATURE: float

    # Datto credentials
    AUTOTASK_SECRET: str
    AUTOTASK_USERNAME: str
    AUTOTASK_API_INTEGRATION_CODE: str
    AUTOTASK_ZONE_NUMBER: int

    @computed_field
    @property
    def AUTOTASK_BASE_URL(self) -> str:
        return f"https://webservices{self.AUTOTASK_ZONE_NUMBER}.autotask.net/atservicesrest/v1.0/"

    @computed_field
    @property
    def AUTOTASK_WEB_URL(self) -> str:
        return f"https://ww{self.AUTOTASK_ZONE_NUMBER}.autotask.net"

    DATTO_BASE_URL: str
    DATTO_API_KEY: str
    DATTO_API_SECRET_KEY: str

    @computed_field
    @property
    def DATTO_API_URL(self) -> str:
        return self.DATTO_BASE_URL + "/api/v2"

    PDF_FOLDER: str

    # document splitter config
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int

    # scripts config
    SCRIPT_ID_KEY: str = "uid"

    RAG_WEB_SEARCH_THRESHOLD: float = 0.4

    # Auth
    TENANT_ID: str
    AUDIENCE: str

    # MongoDB
    MONGO_URI: str | None = None

    # Dev/testing
    DISABLE_EXTERNAL_SERVICES: bool = False

    @model_validator(mode="after")
    def validation(self) -> "AppSettings":
        os.makedirs(self.PDF_FOLDER, exist_ok=True)
        return self


settings = AppSettings()
