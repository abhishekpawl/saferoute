from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import RoleEnum


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone: str
    role: RoleEnum
    is_verified: bool
    created_at: datetime

