from datetime import datetime

from pydantic import BaseModel, Field


class LocationUpdateIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    accuracy_meters: float | None = Field(default=None, ge=0)
    heading: float | None = Field(default=None)
    speed_mps: float | None = Field(default=None)


class LocationRead(LocationUpdateIn):
    user_id: str
    timestamp: datetime

