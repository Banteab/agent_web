import { SESSION_TTL_SECONDS, STORAGE_KEYS } from "./constants";
import type { BookingSession, SearchResult } from "./types";

const browser = () => typeof window !== "undefined";

/** Shared across tabs in the same browser (localStorage). */
export const AUTH_STORAGE_KEYS = [
  STORAGE_KEYS.token,
  STORAGE_KEYS.sessionExpiresAt,
  STORAGE_KEYS.imageUrl,
  STORAGE_KEYS.themeColor,
  STORAGE_KEYS.busAssociationName,
] as const;

function clearLegacySessionStorageAuth() {
  if (!browser()) return;
  for (const key of AUTH_STORAGE_KEYS) {
    window.sessionStorage.removeItem(key);
  }
}

function migrateSessionStorageAuthToLocalStorage() {
  if (!browser()) return;
  if (storage.get(STORAGE_KEYS.token)) return;
  const token = window.sessionStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;
  for (const key of AUTH_STORAGE_KEYS) {
    const value = window.sessionStorage.getItem(key);
    if (value != null) storage.set(key, value);
  }
  clearLegacySessionStorageAuth();
}

export const storage = {
  get(key: string) {
    if (!browser()) return null;
    return window.localStorage.getItem(key);
  },
  set(key: string, value: string) {
    if (!browser()) return;
    window.localStorage.setItem(key, value);
  },
  remove(key: string) {
    if (!browser()) return;
    window.localStorage.removeItem(key);
  },
};

export function getToken() {
  migrateSessionStorageAuthToLocalStorage();
  if (isSessionExpired()) return null;
  return storage.get(STORAGE_KEYS.token);
}

export function getSessionExpiresAt(): number | null {
  migrateSessionStorageAuthToLocalStorage();
  const raw = storage.get(STORAGE_KEYS.sessionExpiresAt);
  if (!raw) return null;
  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function isSessionExpired(): boolean {
  migrateSessionStorageAuthToLocalStorage();
  const token = storage.get(STORAGE_KEYS.token);
  if (!token) return false;
  const expiresAt = getSessionExpiresAt();
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

export function setAuthSession(data: {
  token: string;
  imageUrl?: string;
  themeColor?: string;
  busAssociationName?: string;
}) {
  clearLegacySessionStorageAuth();
  storage.set(STORAGE_KEYS.token, data.token);
  storage.set(
    STORAGE_KEYS.sessionExpiresAt,
    String(Date.now() + SESSION_TTL_SECONDS * 1000),
  );
  if (data.imageUrl) storage.set(STORAGE_KEYS.imageUrl, data.imageUrl);
  if (data.themeColor) storage.set(STORAGE_KEYS.themeColor, data.themeColor);
  if (data.busAssociationName) {
    storage.set(STORAGE_KEYS.busAssociationName, data.busAssociationName);
  }
}

export function clearAuthSession() {
  for (const key of AUTH_STORAGE_KEYS) {
    storage.remove(key);
  }
  clearLegacySessionStorageAuth();
}

export function isAuthStorageKey(key: string | null) {
  if (!key) return false;
  return (AUTH_STORAGE_KEYS as readonly string[]).includes(key);
}

export function getRecentHistory(): string[] {
  try {
    return JSON.parse(storage.get(STORAGE_KEYS.recentHistories) || "[]");
  } catch {
    return [];
  }
}

export function parseRecentHistory() {
  return getRecentHistory()
    .map((item) => {
      const idx = item.indexOf("}-{");
      if (idx === -1) return null;
      try {
        return {
          from: JSON.parse(item.slice(0, idx + 1)) as { name: string; sys: string },
          to: JSON.parse(item.slice(idx + 2)) as { name: string; sys: string },
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { from: { name: string; sys: string }; to: { name: string; sys: string } }[];
}

export function addRecentHistory(from: { name: string; sys: string }, to: { name: string; sys: string }) {
  const item = `${JSON.stringify(from)}-${JSON.stringify(to)}`;
  const next = [item, ...getRecentHistory().filter((h) => h !== item)].slice(0, 8);
  storage.set(STORAGE_KEYS.recentHistories, JSON.stringify(next));
}

export function getSearchedBus(): SearchResult[] {
  try {
    return JSON.parse(storage.get(STORAGE_KEYS.searchedBus) || "[]");
  } catch {
    return [];
  }
}

export function setSearchedBus(trips: SearchResult[]) {
  storage.set(STORAGE_KEYS.searchedBus, JSON.stringify(trips));
}

export function getBookingSession(): BookingSession | null {
  if (!browser()) return null;
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.bookingSession) || "null");
  } catch {
    return null;
  }
}

export function setBookingSession(session: BookingSession) {
  if (!browser()) return;
  sessionStorage.setItem(STORAGE_KEYS.bookingSession, JSON.stringify(session));
}

export function clearBookingSession() {
  if (!browser()) return;
  sessionStorage.removeItem(STORAGE_KEYS.bookingSession);
}

function readCancellationReasons(): Record<string, string> {
  try {
    const raw = JSON.parse(storage.get(STORAGE_KEYS.cancellationReasons) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

/** Records why an agent cancelled a ticket, kept client-side for the cancelled-ticket detail view. */
export function setCancellationReason(ticketId: number, reason: string) {
  if (!browser()) return;
  const map = readCancellationReasons();
  map[String(ticketId)] = reason;
  storage.set(STORAGE_KEYS.cancellationReasons, JSON.stringify(map));
}

export function getCancellationReason(ticketId?: number | null): string {
  if (!browser() || !ticketId) return "";
  return readCancellationReasons()[String(ticketId)] || "";
}
