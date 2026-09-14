"use client";

import { CancelReasonPanel } from "@/components/cancel-reason-panel";
import { ConfirmPaymentModal } from "@/components/confirm-payment-modal";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Card, DetailRow, Field, Input, PageHeader, SectionLabel, StatusBadge } from "@/components/ui";
import { isClosedStatus, isPendingStatus } from "@/lib/booking-rows";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getCancellationReason, setCancellationReason } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { Booking, Ticket } from "@/lib/types";
import { formatDisplayDateValue, formatMoney, parsePassengerNames, parseSelectedRoute, qrSrc } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props =
  | { mode: "ticket"; ticket: Ticket; onRefresh: () => void }
  | { mode: "pending"; booking: Booking; onRefresh: () => void };

export function BookingDetailPanel(props: Props) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isTicket = props.mode === "ticket";
  const booking = isTicket ? props.ticket.booking : props.booking;
  const status = isTicket ? props.ticket.status : props.booking.status;
  const route = isTicket ? props.ticket.booking?.parseSelectedRoute || parseSelectedRoute(props.ticket.booking?.selectedRoute) : undefined;

  const passenger = isTicket ? props.ticket.passenger : parsePassengerNames(props.booking.passengers).join(", ");
  const phone = booking?.phoneNumber;
  const from = route?.from || booking?.trip?.from;
  const to = route?.to || booking?.trip?.to;
  const seat = isTicket ? props.ticket.seat : props.booking.seat;
  const price = isTicket ? props.ticket.booking?.trip?.price ?? route?.price : props.booking.price;
  const reservationLabel = isTicket ? props.ticket.ticketNo : `#${props.booking.id}`;
  const pnr = booking?.refNumber || reservationLabel;

  const closed = isClosedStatus(status);
  const isPending = props.mode === "pending" && isPendingStatus(status);
  const canEdit = isTicket && !closed;
  const canCancel = isTicket && !closed;
  const canActivate = isTicket && !closed;

  const [editPassenger, setEditPassenger] = useState(passenger || "");
  const [editPhone, setEditPhone] = useState(phone || "");

  async function saveEdit() {
    if (!isTicket) return;
    if (!editPassenger.trim() || !editPhone.trim()) {
      toast.error(t("can_not_be_empty"));
      return;
    }
    setSaving(true);
    try {
      await api.updateTicket(props.ticket.id, editPassenger.trim(), editPhone.trim());
      toast.success(t("booking_added"));
      setEditing(false);
      props.onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel(reason: string) {
    if (!isTicket) return;
    setSaving(true);
    try {
      const res = await api.cancelTicket(props.ticket.id);
      setCancellationReason(props.ticket.id, reason);
      toast.success(res.message || t("ticket_cancelled"));
      setCancelOpen(false);
      props.onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("ticket_not_cancelled"));
    } finally {
      setSaving(false);
    }
  }

  async function activate() {
    if (!isTicket) return;
    setSaving(true);
    try {
      const res = await api.activateTicket(props.ticket.id);
      toast.success(res.message || t("active"));
      props.onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmPayment(bookingId: number, transactionNumber: string) {
    const trimmed = transactionNumber.trim();
    if (!trimmed) {
      toast.error(t("bank_transaction_number_required"));
      return;
    }
    try {
      const res = await api.confirmBankPayment(bookingId, trimmed, props.mode === "pending" ? props.booking.bank : undefined);
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      toast.success(res.message || t("payment_confirmed"));
      setConfirmOpen(false);
      const ticketNo = Array.isArray(res.data) ? res.data[0] : undefined;
      router.push(ticketNo ? `/bookings/ticket/${ticketNo}` : "/bookings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={pnr || t("reservation_detail")} subtitle={t("reservation_detail")} backHref="/bookings" action={<StatusBadge status={status} />} />

      <Card className="space-y-1 rounded-lg">
        <SectionLabel>{t("journey_detail")}</SectionLabel>
        {editing ? (
          <div className="space-y-3 py-2">
            <Field label={t("passenger")}>
              <Input value={editPassenger} onChange={(e) => setEditPassenger(e.target.value)} />
            </Field>
            <Field label={t("phone")}>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
                {t("cancel_button")}
              </Button>
              <Button className="flex-1" loading={saving} onClick={saveEdit}>
                {t("save")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DetailRow label={t("passenger")} value={passenger} />
            <DetailRow label={t("phone")} value={phone} />
          </>
        )}
        <DetailRow label={`${t("from")}/${t("to")}`} value={from || to ? `${from || "-"} → ${to || "-"}` : undefined} />
        <DetailRow label={t("pickup")} value={booking?.pickup} />
        <DetailRow label={t("dropoff")} value={booking?.dropoff} />
        <DetailRow label={t("seat_no")} value={seat} />
        <DetailRow label={t("travel_date")} value={formatDisplayDateValue(booking?.trip?.travelDate, locale)} />
        <div className="my-1 border-t border-border" />
        <DetailRow label={t("price")} value={formatMoney(price)} strong={false} />
      </Card>

      <Card className="mt-4 space-y-1">
        <SectionLabel>{t("booking_date")}</SectionLabel>
        <DetailRow label={t("booking_date")} value={formatDisplayDateValue(booking?.firstSeatReserved, locale)} />
        {booking?.bank ? <DetailRow label={t("bank")} value={booking.bank} /> : null}
        {booking?.bankReferenceNumber ? (
          <DetailRow label={t("bank_transaction_number")} value={booking.bankReferenceNumber} />
        ) : null}
        {isTicket && closed ? (
          <DetailRow label={t("cancellation_reason")} value={getCancellationReason(props.ticket.id)} />
        ) : null}
      </Card>

      {isTicket && (
        <Card className="mt-4 flex items-center gap-3">
          <img src={qrSrc(props.ticket.ticketNo || String(props.ticket.id))} alt="QR" className="h-16 w-16 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-navy">{props.ticket.ticketNo}</p>
            <BrandLogo compact imgClassName="mt-1 h-5 w-5" />
          </div>
        </Card>
      )}

      <Card className="mt-4 space-y-3">
        <SectionLabel>{t("booking_detail_actions")}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {canEdit && !editing ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t("edit_passenger")}
            </Button>
          ) : null}
          {canActivate ? (
            <Button variant="secondary" loading={saving} onClick={activate}>
              {t("activate_checkin")}
            </Button>
          ) : null}
          {isTicket ? (
            <Button variant="ghost" onClick={() => window.print()}>
              {t("print")}
            </Button>
          ) : null}
          {isPending ? (
            <Button onClick={() => setConfirmOpen(true)}>{t("confirm_payment")}</Button>
          ) : null}
          {canCancel ? (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              {t("request_cancellation")}
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 opacity-60">
          <Button variant="ghost" disabled title={t("requires_backend_update")}>
            {t("reschedule_travel_date")}
          </Button>
          <Button variant="ghost" disabled title={t("requires_backend_update")}>
            {t("change_seat")}
          </Button>
          <Button variant="ghost" disabled title={t("requires_backend_update")}>
            {t("change_pickup_dropoff")}
          </Button>
          <Button variant="ghost" disabled title={t("requires_backend_update")}>
            {t("resend_ticket_sms")}
          </Button>
        </div>
        <p className="text-xs text-text-faint">{t("actions_unlock_hint")}</p>
      </Card>

      {isTicket ? (
        <CancelReasonPanel
          open={cancelOpen}
          ticketNo={props.ticket.ticketNo}
          status={status}
          cancelling={saving}
          onCancel={confirmCancel}
          onClose={() => setCancelOpen(false)}
          t={t}
        />
      ) : null}

      {props.mode === "pending" ? (
        <ConfirmPaymentModal
          key={confirmOpen ? props.booking.id : "closed"}
          booking={confirmOpen ? props.booking : null}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmPayment}
          t={t}
          locale={locale}
        />
      ) : null}
    </div>
  );
}
