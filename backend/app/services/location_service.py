import json
from datetime import UTC, datetime
from math import asin, cos, radians, sin, sqrt

from redis.asyncio import Redis

from app.schemas.location import LocationRead, LocationUpdateIn


def _location_key(user_id: str) -> str:
    return f"user:{user_id}:location"


async def set_live_location(redis: Redis, user_id: str, payload: LocationUpdateIn) -> LocationRead:
    location = LocationRead(user_id=user_id, timestamp=datetime.now(UTC), **payload.model_dump())
    await redis.set(_location_key(user_id), location.model_dump_json(), ex=60 * 15)
    return location


async def get_live_location(redis: Redis, user_id: str) -> LocationRead | None:
    raw = await redis.get(_location_key(user_id))
    if not raw:
        return None
    parsed = json.loads(raw)
    return LocationRead.model_validate(parsed)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    earth_radius_km = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    a = sin(d_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(d_lng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return earth_radius_km * c

