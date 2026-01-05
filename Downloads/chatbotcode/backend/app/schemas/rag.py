from typing import Literal, Optional

from pydantic import BaseModel, Field


class Chat(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class RAGRequest(BaseModel):
    query: str = Field(..., description="question/query from the user")
    chat_history: list[Chat] = Field(
        description="List of conversations between user and bot"
    )
    ticket_id: Optional[int] = Field(
        default=None,
        description="Autotask ticket's id that the user wants to chat with",
    )
    session_id: Optional[str] = Field(
        default=None, description="Frontend session id for analytics attribution"
    )


class RAGResponse(BaseModel):
    answer: str = Field(..., description="Generated answer")
    top_sops: list[str] = Field(
        description="List of names of the most relevant retrieved SOPs"
    )
