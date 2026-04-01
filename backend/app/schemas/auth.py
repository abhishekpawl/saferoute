from pydantic import BaseModel, Field

from app.models import RoleEnum
from app.schemas.user import UserRead


class OTPRequestIn(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    name: str | None = Field(default=None, max_length=120)
    role: RoleEnum = RoleEnum.TRAVELER


class OTPRequestOut(BaseModel):
    message: str
    expires_in_seconds: int
    dev_otp: str | None = None


class OTPVerifyIn(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    otp: str = Field(min_length=4, max_length=8)
    name: str | None = Field(default=None, max_length=120)
    role: RoleEnum = RoleEnum.TRAVELER


class AuthSessionOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

