import { useEffect, useRef, useState } from "react";

import { getRealtimeUrl } from "../api/client";
import { RealtimeEvent } from "../types/api";

export function useRealtime(token: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || token === "demo-token") {
      setConnected(false);
      return;
    }

    const socket = new WebSocket(getRealtimeUrl(token));
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as RealtimeEvent;
        setEvents((current) => [parsed, ...current].slice(0, 20));
      } catch {
        setEvents((current) => [{ type: "error", payload: { message: "Malformed realtime event" } }, ...current]);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const send = (event: RealtimeEvent) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    }
  };

  return { connected, events, send };
}
