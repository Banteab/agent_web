"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
import { ApiError } from "./api/client";
import { BRAND_LOGO, BRAND_NAME } from "./constants";
import { clearAuthSession, getToken, setAuthSession, storage } from "./storage";
import type { Profile } from "./types";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  profile: Profile | null;
  logo: string;
  associationName: string;
  login: (phone: string, password: string) => Promise<string>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isJwtExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    if (!payload?.exp) return false;
    return Date.now() / 1000 > Number(payload.exp);
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logo, setLogo] = useState(BRAND_LOGO);
  const [associationName, setAssociationName] = useState(BRAND_NAME);

  const hydrate = useCallback(() => {
    const saved = getToken();
    if (saved && !isJwtExpired(saved)) {
      setToken(saved);
      setLogo(BRAND_LOGO);
      setAssociationName(BRAND_NAME);
    } else {
      clearAuthSession();
      setToken(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch {
      // Keep the session; profile can retry from screens.
    }
  }, []);

  useEffect(() => {
    if (token) void refreshProfile();
  }, [token, refreshProfile]);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await api.login(phone, password);
    const token = res.data?.access_token || (res.data as { accessToken?: string } | undefined)?.accessToken;
    if (!res?.success || !token) {
      throw new ApiError(res?.message || "Login failed", res?.status || 400, res);
    }
    setAuthSession({
      token,
      imageUrl: res.data?.image_url,
      themeColor: res.data?.theme_color,
      busAssociationName: res.data?.bus_association_name,
    });
    setToken(token);
    setLogo(BRAND_LOGO);
    setAssociationName(BRAND_NAME);
    return res.message || "Logged in";
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setProfile(null);
    router.replace("/");
  }, [router]);

  const value = useMemo(
    () => ({
      ready,
      token,
      profile,
      logo,
      associationName,
      login,
      logout,
      refreshProfile,
    }),
    [ready, token, profile, logo, associationName, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
