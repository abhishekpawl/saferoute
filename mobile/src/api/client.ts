import axios from "axios";
import { Platform } from "react-native";

const fallbackUrl = Platform.select({
  android: "http://10.0.2.2:8000/api/v1",
  default: "http://localhost:8000/api/v1",
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? fallbackUrl ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function setAccessToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
}

export function getRealtimeUrl(token: string) {
  const wsBase = API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1$/, "");
  return `${wsBase}/api/v1/ws/realtime?token=${token}`;
}

