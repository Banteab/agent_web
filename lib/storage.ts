import { PENDING_BANK_PAYMENT_TTL_MS, STORAGE_KEYS } from "./constants";
import type { BookingSession, SearchResult } from "./types";

const browser = () => typeof window !== "undefined";

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
  return storage.get(STORAGE_KEYS.token);
}

export function setAuthSession(data: {
  token: string;
  imageUrl?: string;
  themeColor?: string;
  busAssociationName?: string;
}) {
  storage.set(STORAGE_KEYS.token, data.token);
  if (data.imageUrl) storage.set(STORAGE_KEYS.imageUrl, data.imageUrl);
  if (data.themeColor) storage.set(STORAGE_KEYS.themeColor, data.themeColor);
  if (data.busAssociationName) {
    storage.set(STORAGE_KEYS.busAssociationName, data.busAssociationName);
  }
}

export function clearAuthSession() {
  storage.remove(STORAGE_KEYS.token);
  storage.remove(STORAGE_KEYS.imageUrl);
  storage.remove(STORAGE_KEYS.themeColor);
  storage.remove(STORAGE_KEYS.busAssociationName);
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

export type PendingBankPayment = {
  bookingId: number;
  addedAt: string;
  fromCity?: string;
  toCity?: string;
  phoneNumber?: string;
  passengers?: string;
  price?: number;
  travelDate?: string;
  /** Which bank the customer was told to pay into (e.g. "Awash Bank"). */
  bank?: string;
};

/** Bank payments are only confirmable for PENDING_BANK_PAYMENT_TTL_MS after being added. */
export function pendingBankPaymentExpiresAt(entry: Pick<PendingBankPayment, "addedAt">) {
  return new Date(entry.addedAt).getTime() + PENDING_BANK_PAYMENT_TTL_MS;
}

export function isPendingBankPaymentExpired(entry: Pick<PendingBankPayment, "addedAt">, now = Date.now()) {
  return now >= pendingBankPaymentExpiresAt(entry);
}

function readPendingBankPayments(): PendingBankPayment[] {
  try {
    const raw = JSON.parse(storage.get(STORAGE_KEYS.pendingBankPayments) || "[]");
    return Array.isArray(raw) ? (raw as PendingBankPayment[]) : [];
  } catch {
    return [];
  }
}

export const PENDING_BANK_PAYMENTS_EVENT = "pending-bank-payments-changed";

function writePendingBankPayments(list: PendingBankPayment[]) {
  storage.set(STORAGE_KEYS.pendingBankPayments, JSON.stringify(list));
  if (browser()) window.dispatchEvent(new Event(PENDING_BANK_PAYMENTS_EVENT));
}

export function getPendingBankPayments(): PendingBankPayment[] {
  if (!browser()) return [];
  return readPendingBankPayments();
}

export function addPendingBankPayment(entry: Omit<PendingBankPayment, "addedAt">) {
  if (!browser()) return;
  const list = readPendingBankPayments().filter((item) => item.bookingId !== entry.bookingId);
  list.unshift({ ...entry, addedAt: new Date().toISOString() });
  writePendingBankPayments(list);
}

export function removePendingBankPayment(bookingId: number) {
  if (!browser()) return;
  writePendingBankPayments(readPendingBankPayments().filter((item) => item.bookingId !== bookingId));
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
