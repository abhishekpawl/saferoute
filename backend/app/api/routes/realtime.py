from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import decode_access_token
from app.schemas.location import LocationUpdateIn
from app.services.location_service import set_live_location
from app.services.websocket_manager import websocket_manager


router = APIRouter()


@router.websocket("/realtime")
async def realtime_socket(websocket: WebSocket, token: str = Query(...)) -> None:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("missing subject")
    except (JWTError, ValueError):
        await websocket.close(code=1008)
        return

    await websocket_manager.connect(user_id, websocket)
    await websocket.send_json({"type": "connection:ready", "payload": {"user_id": user_id}})

    try:
        while True:
            message = await websocket.receive_json()
            event_type = message.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if event_type == "location:update":
                payload = LocationUpdateIn.model_validate(message.get("payload", {}))
                location = await set_live_location(websocket.app.state.redis, user_id, payload)
                await websocket.send_json({"type": "location:ack", "payload": location.model_dump(mode="json")})
                continue

            await websocket.send_json({"type": "error", "payload": {"message": "Unsupported event"}})
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id, websocket)

