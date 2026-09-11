from pydantic import BaseModel
from typing import Literal, Optional


class ChatMessageItem(BaseModel):
    id: int
    role: Literal["user", "assistant"]
    content: str
    createdAt: str


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageItem]


class CompanionChatResponse(BaseModel):
    reply: str
    is_crisis_intervention: bool = False
    createdAt: str
