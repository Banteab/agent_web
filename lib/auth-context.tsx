"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "./api";
import { ApiError } from "./api/client";
import { BRAND_LOGO, BRAND_NAME, STORAGE_KEYS } from "./constants";
import { useI18n } from "./i18n";
import { registerSessionInvalidHandler } from "./session-guard";
import {
  clearAuthSession,
  getSessionExpiresAt,
  getToken,
  isAuthStorageKey,
  isSessionExpired,
  setAuthSession,
  storage,
} from "./storage";
import { useToast } from "./toast-context";
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

type LogoutReason = "expired" | "unauthorized" | "manual" | "sync";

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
  const toast = useToast();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logo, setLogo] = useState(BRAND_LOGO);
  const [associationName, setAssociationName] = useState(BRAND_NAME);
  const logoutRef = useRef<(reason?: LogoutReason) => void>(() => {});

  const logout = useCallback(
    (reason: LogoutReason = "manual") => {
      if (reason === "sync") {
        setToken(null);
        setProfile(null);
        router.replace("/");
        return;
      }
      clearAuthSession();
      setToken(null);
      setProfile(null);
      if (reason === "expired" || reason === "unauthorized") {
        toast.error(t("session_expired"));
      }
      router.replace("/");
    },
    [router, t, toast],
  );

  logoutRef.current = logout;

  const applyAuthFromStorage = useCallback((): boolean => {
    if (isSessionExpired()) {
      clearAuthSession();
      setToken(null);
      setProfile(null);
      return false;
    }
    const saved = getToken();
    if (saved && !isJwtExpired(saved)) {
      setToken(saved);
      setLogo(BRAND_LOGO);
      setAssociationName(BRAND_NAME);
      return true;
    }
    if (saved) clearAuthSession();
    setToken(null);
    setProfile(null);
    return false;
  }, []);

  const hydrate = useCallback(() => {
    applyAuthFromStorage();
    setReady(true);
  }, [applyAuthFromStorage]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    registerSessionInvalidHandler((reason) => {
      logoutRef.current(reason);
    });
  }, []);

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
    const onStorage = (event: StorageEvent) => {
      if (!isAuthStorageKey(event.key)) return;
      const active = applyAuthFromStorage();
      if (!active) {
        logoutRef.current("sync");
        return;
      }
      if (event.key === STORAGE_KEYS.token && event.newValue) {
        void refreshProfile();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applyAuthFromStorage, refreshProfile]);

  useEffect(() => {
    if (!token) return;

    const syncExpiry = () => {
      if (!isSessionExpired()) return;
      if (storage.get(STORAGE_KEYS.token)) {
        logoutRef.current("expired");
      } else {
        logoutRef.current("sync");
      }
    };

    syncExpiry();
    const expiresAt = getSessionExpiresAt();
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (expiresAt) {
      const remaining = expiresAt - Date.now();
      if (remaining > 0) {
        timer = setTimeout(syncExpiry, remaining);
      }
    }

    const onFocus = () => syncExpiry();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [token]);

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

  const logoutManual = useCallback(() => {
    logout("manual");
  }, [logout]);

  const value = useMemo(
    () => ({
      ready,
      token,
      profile,
      logo,
      associationName,
      login,
      logout: logoutManual,
      refreshProfile,
    }),
    [ready, token, profile, logo, associationName, login, logoutManual, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
