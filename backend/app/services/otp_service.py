import secrets

from redis.asyncio import Redis

from app.core.config import get_settings


def _otp_key(phone: str) -> str:
    return f"otp:{phone}"


async def create_otp(redis: Redis, phone: str) -> str:
    settings = get_settings()
    code = settings.default_otp_code or f"{secrets.randbelow(1_000_000):06d}"
    await redis.set(_otp_key(phone), code, ex=settings.otp_expiry_seconds)
    return code


async def verify_otp(redis: Redis, phone: str, code: str) -> bool:
    settings = get_settings()
    if settings.default_otp_code and code == settings.default_otp_code:
        return True

    saved = await redis.get(_otp_key(phone))
    if saved is None or saved != code:
        return False
    await redis.delete(_otp_key(phone))
    return True
