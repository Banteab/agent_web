import type { Booking, TicketListItem } from "./types";
import { parsePassengerNames, parseSelectedRoute } from "./utils";

/**
 * Manage Bookings merges three different API shapes (a booked ticket, a
 * cancelled ticket, a pending-bank-payment booking, and — once the backend
 * ships it — a cross-agent search result) into one row shape so the list and
 * detail views don't need to know which source a row came from.
 */
export type BookingRow = {
  key: string;
  kind: "ticket" | "pending";
  ticketNo?: string;
  ticketId?: number;
  bookingId?: number;
  refNumber?: string;
  passenger: string;
  phone?: string;
  from?: string;
  to?: string;
  travelDate?: string;
  status?: string;
  price?: number;
  bookingDate?: string;
  agentId?: number;
  agentName?: string;
  isOwn: boolean;
  // True only for rows sourced from the proposed cross-agent search endpoint.
  // Those never deep-link to a real detail route (no guaranteed ticket
  // number on that response shape) — they open a read-only modal instead,
  // regardless of `isOwn`. Genuinely-own bookings surfaced by a search are
  // deduped against the agent's own booked/cancelled/pending rows before
  // this ever matters in practice.
  viaSearch?: boolean;
};

export const CLOSED_STATUSES = new Set(["CANCELLED", "CANCELED", "REJECTED", "EXPIRED"]);

export function isPendingStatus(status?: string) {
  return (status || "").toUpperCase().includes("PENDING");
}

export function isClosedStatus(status?: string) {
  return CLOSED_STATUSES.has((status || "").toUpperCase());
}

function agentNameFrom(agent?: { firstName?: string; lastName?: string }) {
  return `${agent?.firstName || ""} ${agent?.lastName || ""}`.trim() || undefined;
}

export function fromTicket(ticket: TicketListItem): BookingRow {
  const booking = ticket.booking;
  const route = booking?.parseSelectedRoute || parseSelectedRoute(booking?.selectedRoute);
  return {
    key: ticket.ticketNo || `ticket-${ticket.id}`,
    kind: "ticket",
    ticketNo: ticket.ticketNo,
    ticketId: ticket.id,
    bookingId: booking?.id,
    refNumber: booking?.refNumber,
    passenger: ticket.passenger || parsePassengerNames(booking?.passengers).join(", ") || "-",
    phone: booking?.phoneNumber,
    from: route?.from || booking?.trip?.from,
    to: route?.to || booking?.trip?.to,
    travelDate: booking?.trip?.travelDate,
    status: ticket.status,
    price: booking?.trip?.price ?? route?.price,
    bookingDate: booking?.firstSeatReserved || ticket.date || ticket.createdAt,
    agentId: booking?.agent?.id,
    agentName: agentNameFrom(booking?.agent),
    isOwn: true,
  };
}

export function fromPendingBooking(booking: Booking): BookingRow {
  return {
    key: `pending-${booking.id}`,
    kind: "pending",
    bookingId: booking.id,
    refNumber: booking.refNumber,
    passenger: parsePassengerNames(booking.passengers).join(", ") || "-",
    phone: booking.phoneNumber,
    from: booking.trip?.from,
    to: booking.trip?.to,
    travelDate: booking.trip?.travelDate,
    status: booking.status || "PENDING_PAYMENT",
    price: booking.price,
    bookingDate: booking.firstSeatReserved,
    agentId: booking.agent?.id,
    agentName: agentNameFrom(booking.agent),
    isOwn: true,
  };
}

export function fromSearchBooking(booking: Booking, myAgentId?: number): BookingRow {
  return {
    key: `search-${booking.id}`,
    kind: isPendingStatus(booking.status) ? "pending" : "ticket",
    ticketNo: booking.ticketNumbers?.[0],
    bookingId: booking.id,
    refNumber: booking.refNumber,
    passenger: parsePassengerNames(booking.passengers).join(", ") || "-",
    phone: booking.phoneNumber,
    from: booking.trip?.from,
    to: booking.trip?.to,
    travelDate: booking.trip?.travelDate,
    status: booking.status,
    price: booking.price,
    bookingDate: booking.firstSeatReserved,
    agentId: booking.agent?.id,
    agentName: agentNameFrom(booking.agent),
    isOwn: myAgentId != null && booking.agent?.id === myAgentId,
    viaSearch: true,
  };
}
