from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.session import get_db_session
from app.deps import get_redis
from app.models import GuardianProfile, RoleEnum, User
from app.schemas.auth import AuthSessionOut, OTPRequestIn, OTPRequestOut, OTPVerifyIn
from app.schemas.user import UserRead
from app.services.otp_service import create_otp, verify_otp


router = APIRouter()


@router.post("/request-otp", response_model=OTPRequestOut)
async def request_otp(payload: OTPRequestIn, redis: Redis = Depends(get_redis)) -> OTPRequestOut:
    settings = get_settings()
    code = await create_otp(redis, payload.phone)
    return OTPRequestOut(
        message="OTP generated successfully",
        expires_in_seconds=settings.otp_expiry_seconds,
        dev_otp=code if settings.is_development else None,
    )


@router.post("/verify-otp", response_model=AuthSessionOut)
async def verify_otp_route(
    payload: OTPVerifyIn,
    redis: Redis = Depends(get_redis),
    session: AsyncSession = Depends(get_db_session),
) -> AuthSessionOut:
    is_valid = await verify_otp(redis, payload.phone, payload.otp)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    result = await session.execute(select(User).where(User.phone == payload.phone))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            phone=payload.phone,
            name=payload.name or "New user",
            role=payload.role,
            is_verified=payload.role != RoleEnum.GUARDIAN,
        )
        session.add(user)
        await session.flush()

        if payload.role == RoleEnum.GUARDIAN:
            session.add(GuardianProfile(user_id=user.id, is_active=True))
        await session.commit()
        await session.refresh(user)

    token = create_access_token(user.id, expires_delta=timedelta(minutes=get_settings().access_token_expire_minutes))
    return AuthSessionOut(access_token=token, user=UserRead.model_validate(user))
