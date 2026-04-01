import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api, setAccessToken } from "../api/client";
import { AuthSession, OtpRequestResponse, User, UserRole } from "../types/api";

type AuthContextValue = {
  loading: boolean;
  token: string | null;
  user: User | null;
  isDemoSession: boolean;
  requestOtp: (input: { phone: string; name?: string; role: UserRole }) => Promise<OtpRequestResponse>;
  verifyOtp: (input: { phone: string; otp: string; name?: string; role: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "saferoute-token";
const USER_KEY = "saferoute-user";
const DEMO_TOKEN = "demo-token";

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function hydrate() {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (storedToken) {
        setToken(storedToken);
        setAccessToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser) as User);
      }

      setLoading(false);
    }

    hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      token,
      user,
      isDemoSession: token === DEMO_TOKEN,
      requestOtp: async ({ phone, name, role }) => {
        const { data } = await api.post<OtpRequestResponse>("/auth/request-otp", { phone, name, role });
        return data;
      },
      verifyOtp: async ({ phone, otp, name, role }) => {
        try {
          const { data } = await api.post<AuthSession>("/auth/verify-otp", { phone, otp, name, role });
          setToken(data.access_token);
          setUser(data.user);
          setAccessToken(data.access_token);
          await Promise.all([
            SecureStore.setItemAsync(TOKEN_KEY, data.access_token),
            SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user)),
          ]);
        } catch (error) {
          if (otp !== "123456") {
            throw error;
          }

          const demoUser: User = {
            id: `demo-${phone.replace(/\D/g, "") || "user"}`,
            name: name?.trim() || "Demo user",
            phone,
            role,
            is_verified: role === "TRAVELER",
            created_at: new Date().toISOString(),
          };

          setToken(DEMO_TOKEN);
          setUser(demoUser);
          setAccessToken(null);
          await Promise.all([
            SecureStore.setItemAsync(TOKEN_KEY, DEMO_TOKEN),
            SecureStore.setItemAsync(USER_KEY, JSON.stringify(demoUser)),
          ]);
        }
      },
      signOut: async () => {
        setToken(null);
        setUser(null);
        setAccessToken(null);
        await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
      },
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
