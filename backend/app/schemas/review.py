from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreateIn(BaseModel):
    guardian_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    guardian_id: str
    traveler_id: str
    rating: int
    comment: str | None
    created_at: datetime

