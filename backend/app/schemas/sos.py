from datetime import datetime

from pydantic import BaseModel, Field

from app.models import SOSStatus


class SOSCreateIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    message: str | None = Field(default=None, max_length=500)


class SOSRead(BaseModel):
    id: str
    traveler_id: str
    lat: float
    lng: float
    message: str | None
    status: SOSStatus
    created_at: datetime
    notified_guardians: int = 0

