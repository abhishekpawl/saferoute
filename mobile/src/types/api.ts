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

export type TicketMode = "AIR" | "TRAIN" | "BUS";
export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export type TicketSearchPayload = {
  mode: TicketMode;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  adults: number;
  children: number;
  infants: number;
  cabin_class?: CabinClass | null;
};

export type TicketProviderResult = {
  provider_id: string;
  provider_name: string;
  mode: TicketMode;
  deeplink_url: string;
  source_home_url: string;
  live_price_supported: boolean;
  fare_display?: string | null;
  currency?: string | null;
  search_hint: string;
  redirect_label: string;
  notes: string[];
};

export type TicketSearchResponse = {
  mode: TicketMode;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  live_prices_available: boolean;
  providers: TicketProviderResult[];
  message: string;
};

export type PlannerMode = "SAFE" | "GENERAL";

export type PlannerMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PlannerChatRequest = {
  mode: PlannerMode;
  destination_context?: string | null;
  messages: PlannerMessage[];
};

export type PlannerChatResponse = {
  mode: PlannerMode;
  reply: string;
  model: string;
  created_at: string;
  fallback_used: boolean;
  diagnostic?: string | null;
};
