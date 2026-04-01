from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, event: dict) -> None:
        for socket in list(self._connections.get(user_id, set())):
            await socket.send_json(event)

    async def broadcast(self, event: dict, exclude_user_ids: set[str] | None = None) -> None:
        excluded = exclude_user_ids or set()
        for user_id, sockets in list(self._connections.items()):
            if user_id in excluded:
                continue
            for socket in list(sockets):
                await socket.send_json(event)


websocket_manager = WebSocketManager()

