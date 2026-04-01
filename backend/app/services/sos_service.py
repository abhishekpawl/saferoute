import json

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SOSEvent, User
from app.schemas.guardian import GuardianNearbyItem
from app.schemas.sos import SOSCreateIn, SOSRead
from app.services.guardian_service import get_nearby_guardians
from app.services.websocket_manager import websocket_manager


async def trigger_sos(
    session: AsyncSession,
    redis: Redis,
    traveler: User,
    payload: SOSCreateIn,
    radius_km: float,
) -> tuple[SOSRead, list[GuardianNearbyItem]]:
    event = SOSEvent(
        traveler_id=traveler.id,
        lat=payload.lat,
        lng=payload.lng,
        message=payload.message,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)

    nearby_guardians = await get_nearby_guardians(
        session=session,
        redis=redis,
        lat=payload.lat,
        lng=payload.lng,
        radius_km=radius_km,
    )

    message = {
        "type": "sos:trigger",
        "payload": {
            "event_id": event.id,
            "traveler_id": traveler.id,
            "traveler_name": traveler.name,
            "lat": payload.lat,
            "lng": payload.lng,
            "message": payload.message,
            "status": event.status.value,
        },
    }

    await redis.publish("sos_events", json.dumps(message))
    for guardian in nearby_guardians:
        await websocket_manager.send_to_user(guardian.user_id, message)

    await websocket_manager.send_to_user(
        traveler.id,
        {
            "type": "sos:accepted",
            "payload": {"event_id": event.id, "notified_guardians": len(nearby_guardians)},
        },
    )

    return (
        SOSRead(
            id=event.id,
            traveler_id=event.traveler_id,
            lat=event.lat,
            lng=event.lng,
            message=event.message,
            status=event.status,
            created_at=event.created_at,
            notified_guardians=len(nearby_guardians),
        ),
        nearby_guardians,
    )
