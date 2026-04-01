export type UserRole = "TRAVELER" | "GUARDIAN";

export type User = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
};

export type OtpRequestResponse = {
  message: string;
  expires_in_seconds: number;
  dev_otp?: string | null;
};

export type AuthSession = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type Guardian = {
  id: string;
  user_id: string;
  name: string;
  phone_masked: string;
  rating_average: number;
  rating_count: number;
  is_verified: boolean;
  is_active: boolean;
  lat: number;
  lng: number;
  distance_km: number;
};

export type LocationPayload = {
  lat: number;
  lng: number;
  accuracy_meters?: number | null;
  heading?: number | null;
  speed_mps?: number | null;
};

export type SOSResponse = {
  id: string;
  traveler_id: string;
  lat: number;
  lng: number;
  message?: string | null;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  created_at: string;
  notified_guardians: number;
};

export type RealtimeEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

