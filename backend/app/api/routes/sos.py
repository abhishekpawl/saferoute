from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db_session
from app.deps import get_current_user, get_redis
from app.models import RoleEnum, User
from app.schemas.sos import SOSCreateIn, SOSRead
from app.services.sos_service import trigger_sos


router = APIRouter()


@router.post("/trigger", response_model=SOSRead)
async def trigger_sos_alert(
    payload: SOSCreateIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    redis: Redis = Depends(get_redis),
) -> SOSRead:
    if current_user.role != RoleEnum.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can trigger SOS alerts",
        )

    event, _ = await trigger_sos(
        session=session,
        redis=redis,
        traveler=current_user,
        payload=payload,
        radius_km=get_settings().guardian_discovery_radius_km,
    )
    return event

