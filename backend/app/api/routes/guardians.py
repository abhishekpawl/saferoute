from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db_session
from app.deps import get_redis
from app.schemas.guardian import GuardianNearbyItem
from app.services.guardian_service import get_nearby_guardians


router = APIRouter()


@router.get("/nearby", response_model=list[GuardianNearbyItem])
async def nearby_guardians(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float | None = Query(default=None, gt=0),
    session: AsyncSession = Depends(get_db_session),
    redis: Redis = Depends(get_redis),
) -> list[GuardianNearbyItem]:
    settings = get_settings()
    return await get_nearby_guardians(
        session=session,
        redis=redis,
        lat=lat,
        lng=lng,
        radius_km=radius_km or settings.guardian_discovery_radius_km,
    )

