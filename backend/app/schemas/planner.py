from datetime import datetime

from pydantic import BaseModel, Field


class PlannerMode(str):
    SAFE = "SAFE"
    GENERAL = "GENERAL"


class PlannerChatMessageIn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=12000)


class PlannerChatRequest(BaseModel):
    mode: str = Field(pattern="^(SAFE|GENERAL)$")
    destination_context: str | None = Field(default=None, max_length=400)
    messages: list[PlannerChatMessageIn] = Field(min_length=1, max_length=30)


class PlannerChatResponse(BaseModel):
    mode: str
    reply: str
    model: str
    created_at: datetime
    fallback_used: bool = False
    diagnostic: str | None = None
