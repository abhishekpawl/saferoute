from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.deps import get_current_user, get_redis
from app.models import User
from app.schemas.location import LocationRead, LocationUpdateIn
from app.services.location_service import set_live_location


router = APIRouter()


@router.post("/me", response_model=LocationRead)
async def update_my_location(
    payload: LocationUpdateIn,
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> LocationRead:
    return await set_live_location(redis, current_user.id, payload)

