from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from app.core.config import get_settings


ALGORITHM = "HS256"


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])


def mask_phone(phone: str) -> str:
    if len(phone) <= 4:
        return "*" * len(phone)
    return f"{phone[:2]}{'*' * max(len(phone) - 4, 1)}{phone[-2:]}"


def is_token_valid(token: str) -> bool:
    try:
        decode_access_token(token)
        return True
    except JWTError:
        return False

