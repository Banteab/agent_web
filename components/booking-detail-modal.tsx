"use client";

import { Badge, Button, DetailRow, Modal, SectionLabel, StatusBadge } from "@/components/ui";
import { isClosedStatus, isPendingStatus } from "@/lib/booking-rows";
import type { Booking } from "@/lib/types";
import { formatDisplayDateValue, formatMoney, parsePassengerNames } from "@/lib/utils";

function passengerLabel(booking: Booking) {
  return parsePassengerNames(booking.passengers).join(", ") || "-";
}

function routeLabel(booking: Booking) {
  const from = booking.trip?.from;
  const to = booking.trip?.to;
  if (!from && !to) return "-";
  return `${from || "-"} → ${to || "-"}`;
}

function agentLabel(booking: Booking) {
  const name = `${booking.agent?.firstName || ""} ${booking.agent?.lastName || ""}`.trim();
  return name || "-";
}

/**
 * Read-only detail view for a cross-agent search result — there is no
 * stable "detail" endpoint to deep-link to for a proposed-endpoint row, so
 * this stays a modal over data already in hand, not a route. Own rows use
 * the real Booking Detail routes instead (see booking-detail-panel.tsx).
 */
export function BookingDetailModal({
  booking,
  onClose,
  t,
  locale,
  own,
  onCancelTicket,
  onViewPendingPayment,
}: {
  booking: Booking | null;
  onClose: () => void;
  t: (key: string) => string;
  locale?: string;
  own: boolean;
  onCancelTicket: (ticketNo?: string) => void;
  onViewPendingPayment: () => void;
}) {
  if (!booking) return null;

  const isCancellable = own && !isClosedStatus(booking.status);
  const isPendingPayment = own && isPendingStatus(booking.status);

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title={t("reservation_detail")}
      subtitle={`${t("pnr")} ${booking.refNumber || `#${booking.id}`}`}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {t("close")}
          </Button>
          {isPendingPayment ? (
            <Button variant="secondary" className="flex-1" onClick={onViewPendingPayment}>
              {t("pending_payments")}
            </Button>
          ) : null}
          {isCancellable ? (
            <Button variant="danger" className="flex-1" onClick={() => onCancelTicket(booking.ticketNumbers?.[0])}>
              {t("cancele_ticket")}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-faint">{t("status")}</span>
          <StatusBadge status={booking.status} />
        </div>

        {own ? (
          <p className="rounded-lg bg-primary-soft/60 px-3.5 py-2.5 text-xs font-medium text-primary">
            {t("your_booking_hint")}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3.5 py-2.5">
            <p className="text-xs font-medium text-text-muted">{t("other_agent_booking_hint")}</p>
            <Badge tone="neutral">{t("view_only")}</Badge>
          </div>
        )}

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <SectionLabel>{t("journey_detail")}</SectionLabel>
          <DetailRow label={t("passenger")} value={passengerLabel(booking)} />
          <DetailRow label={t("phone")} value={booking.phoneNumber} />
          <DetailRow label={`${t("from")}/${t("to")}`} value={routeLabel(booking)} />
          <DetailRow label={t("pickup")} value={booking.pickup} />
          <DetailRow label={t("dropoff")} value={booking.dropoff} />
          <DetailRow label={t("seat_no")} value={booking.seat} />
          <DetailRow label={t("travel_date")} value={formatDisplayDateValue(booking.trip?.travelDate, locale)} />
          <div className="my-1 border-t border-border" />
          <DetailRow label={t("price")} value={formatMoney(booking.price)} strong={false} />
        </div>

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <SectionLabel>{t("booking_date")}</SectionLabel>
          <DetailRow label={t("booking_date")} value={formatDisplayDateValue(booking.firstSeatReserved, locale)} />
          {booking.bank ? <DetailRow label={t("bank")} value={booking.bank} /> : null}
          {booking.bankReferenceNumber ? (
            <DetailRow label={t("bank_transaction_number")} value={booking.bankReferenceNumber} />
          ) : null}
        </div>

        <div className="space-y-1 rounded-lg border border-primary/20 bg-primary-soft/50 p-3.5">
          <SectionLabel>{t("agent")}</SectionLabel>
          <DetailRow label={t("name")} value={agentLabel(booking)} />
          <DetailRow label={t("phone")} value={booking.agent?.phoneNo} />
        </div>
      </div>
    </Modal>
  );
}
