from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import mask_phone
from app.models import GuardianProfile, RoleEnum, User
from app.schemas.guardian import GuardianNearbyItem
from app.services.location_service import get_live_location, haversine_km


async def get_nearby_guardians(
    session: AsyncSession,
    redis,
    lat: float,
    lng: float,
    radius_km: float,
) -> list[GuardianNearbyItem]:
    statement = (
        select(GuardianProfile)
        .join(GuardianProfile.user)
        .options(selectinload(GuardianProfile.user))
        .where(
            GuardianProfile.is_active.is_(True),
            User.role == RoleEnum.GUARDIAN,
            User.is_verified.is_(True),
        )
    )
    result = await session.execute(statement)
    guardians = result.scalars().all()

    nearby: list[GuardianNearbyItem] = []
    for guardian in guardians:
        location = await get_live_location(redis, guardian.user_id)
        if not location:
            continue
        distance_km = haversine_km(lat, lng, location.lat, location.lng)
        if distance_km > radius_km:
            continue

        nearby.append(
            GuardianNearbyItem(
                id=guardian.id,
                user_id=guardian.user_id,
                name=guardian.user.name,
                phone_masked=mask_phone(guardian.user.phone),
                rating_average=round(guardian.rating_average, 2),
                rating_count=guardian.rating_count,
                is_verified=guardian.user.is_verified,
                is_active=guardian.is_active,
                lat=location.lat,
                lng=location.lng,
                distance_km=round(distance_km, 2),
            )
        )

    nearby.sort(key=lambda item: item.distance_km)
    return nearby

