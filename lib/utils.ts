import { formatEthiopianDate } from "./ethiopian-calendar";
import type { ReportPassenger } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(date: Date, locale?: string) {
  if (locale?.startsWith("am")) {
    return formatEthiopianDate(date);
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a raw date string from the API (a plain "YYYY-MM-DD" or a full
 * timestamp) for display, switching to the Ethiopian calendar when the
 * active locale is Amharic. Only the date part is used — parsing it at
 * local midnight keeps the calendar day stable regardless of the API's
 * time-of-day or timezone suffix.
 */
export function formatDisplayDateValue(value?: string | null, locale?: string) {
  if (!value) return "-";
  const ymd = value.slice(0, 10);
  const parsed = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return formatDisplayDate(parsed, locale);
}

export function formatMoney(value?: number | string | null) {
  const n = Number(value ?? 0);
  return `${n.toLocaleString()} ETB`;
}

export function parseSeats(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parsePassengerNames(value?: string | null) {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function asNumberList(value?: unknown[] | null) {
  if (!value) return [] as number[];
  return value
    .map((item) => Number(item))
    .filter((n) => !Number.isNaN(n));
}

export { cityApiName, citySearchName } from "./cities";

export function selectedRoutePayload(trip?: {
  selectedRoute?: unknown;
  route?: unknown;
  routeObject?: unknown;
} | null) {
  if (!trip) return "";
  if (typeof trip.selectedRoute === "string" && trip.selectedRoute.trim()) {
    return trip.selectedRoute;
  }
  const route =
    (trip.selectedRoute && typeof trip.selectedRoute === "object" ? trip.selectedRoute : null) ||
    trip.route ||
    trip.routeObject;
  return route ? JSON.stringify(route) : "";
}

export function parseSelectedRoute(route?: string | { from?: string; to?: string; price?: number } | null) {
  if (!route) return null;
  if (typeof route === "object") return route;
  try {
    return JSON.parse(route) as {
      id?: number;
      from?: string;
      to?: string;
      price?: number;
      departureTime?: string;
      arrivalTime?: string;
    };
  } catch {
    return null;
  }
}

export function remainingLabel(endTime?: number) {
  if (!endTime) return "00:00";
  const left = Math.max(0, endTime - Date.now());
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function capitalize(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function qrSrc(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;
}

/**
 * Report endpoints label the same per-ticket fields slightly differently
 * (e.g. "ticketNo" vs "ticket_no", "reference" vs "bankReferenceNumber"),
 * so read every known alias rather than assuming one exact shape.
 */
export function reportPassengerFields(row: ReportPassenger) {
  return {
    name: row.passenger || row.name || "",
    seat: row.seat || "",
    ticketNo: row.ticketNo || row.ticket_no || "",
    price: row.price ?? row.amount,
    phone: row.phoneNumber || row.phone || "",
    bank: row.bank || row.paymentMethod || "",
    transactionNumber:
      row.bankReferenceNumber ||
      row.transactionNumber ||
      row.reference ||
      row.refNumber ||
      row.referenceNumber ||
      "",
  };
}
