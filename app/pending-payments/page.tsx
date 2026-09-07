"use client";

import { Badge, Button, Card, DetailRow, EmptyState, Input, Modal, PageHeader, Spinner, TableFrame } from "@/components/ui";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import { PENDING_PAYMENTS_REFRESH_EVENT } from "@/lib/constants";
import { notifyPendingPaymentsRefresh } from "@/lib/use-pending-bank-payments-count";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { formatMoney, parsePassengerNames } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function PendingPaymentsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      setLoading(true);
      api
        .getPendingBankPayments()
        .then((list) => {
          if (!cancelled) setBookings(list);
        })
        .catch((err) => {
          if (!cancelled) {
            toast.error(err instanceof Error ? err.message : t("error_occured"));
            setBookings([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const timer = window.setInterval(load, 60_000);
    window.addEventListener(PENDING_PAYMENTS_REFRESH_EVENT, load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(PENDING_PAYMENTS_REFRESH_EVENT, load);
    };
  }, [t, toast]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (travelDate) {
        const rowDate = (booking.trip?.travelDate || "").slice(0, 10);
        if (rowDate !== travelDate) return false;
      }
      if (!needle) return true;
      const haystack = [
        booking.refNumber,
        String(booking.id),
        booking.passengers,
        booking.phoneNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [bookings, query, travelDate]);

  async function confirmPayment(bookingId: number, transactionNumber: string) {
    const trimmed = transactionNumber.trim();
    if (!trimmed) {
      toast.error(t("bank_transaction_number_required"));
      return;
    }
    const booking = bookings.find((item) => item.id === bookingId);
    try {
      const res = await api.confirmBankPayment(bookingId, trimmed, booking?.bank);
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      toast.success(res.message || t("payment_confirmed"));
      setBookings((prev) => prev.filter((item) => item.id !== bookingId));
      setConfirmBooking(null);
      notifyPendingPaymentsRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setBookings((prev) => prev.filter((item) => item.id !== bookingId));
        setConfirmBooking(null);
        notifyPendingPaymentsRefresh();
        toast.error(t("booking_expired_or_not_found"));
        return;
      }
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    }
  }

  return (
    <Protected>
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={t("pending_payments")}
          subtitle={t("pending_payments_subtitle")}
          action={
            !loading && bookings.length ? (
              <Badge tone="pending" className="hidden sm:inline-flex">
                {bookings.length} {t("pending_payment")}
              </Badge>
            ) : undefined
          }
        />

        <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              placeholder={t("search_pending_payments")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            aria-label={t("travel_date")}
            className="sm:w-48"
          />
        </Card>

        {loading ? <Spinner label={t("pending_payments")} /> : null}

        {!loading && !filtered.length ? (
          <EmptyState title={t("no_pending_payments")} hint={t("no_pending_payments_hint")} />
        ) : null}

        {!loading && filtered.length ? (
          <>
            <TableFrame className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
                  <tr>
                    <th className="px-4 py-3">{t("pnr")}</th>
                    <th className="px-4 py-3">{t("reservation_no")}</th>
                    <th className="px-4 py-3">{t("passenger")}</th>
                    <th className="px-4 py-3">{t("phone")}</th>
                    <th className="px-4 py-3">{t("from")}/{t("to")}</th>
                    <th className="px-4 py-3">{t("travel_date")}</th>
                    <th className="px-4 py-3 text-right">{t("amount")}</th>
                    <th className="px-4 py-3">{t("booking_date")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((booking) => (
                    <PendingRow
                      key={booking.id}
                      booking={booking}
                      onConfirm={setConfirmBooking}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </TableFrame>

            <div className="space-y-3 md:hidden">
              {filtered.map((booking) => (
                <PendingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={setConfirmBooking}
                  t={t}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <ConfirmPaymentModal
        key={confirmBooking?.id ?? "closed"}
        booking={confirmBooking}
        onClose={() => setConfirmBooking(null)}
        onConfirm={confirmPayment}
        t={t}
      />
    </Protected>
  );
}

function passengerLabel(booking: Booking) {
  return parsePassengerNames(booking.passengers).join(", ") || "-";
}

function routeLabel(booking: Booking) {
  const from = booking.trip?.from;
  const to = booking.trip?.to;
  if (!from && !to) return "-";
  return `${from || "-"} → ${to || "-"}`;
}

function amountLabel(booking: Booking) {
  if (booking.price == null) return "-";
  const passengers = Math.max(parsePassengerNames(booking.passengers).length, 1);
  return formatMoney(booking.price * passengers);
}

function travelDateLabel(booking: Booking) {
  const value = booking.trip?.travelDate;
  return value ? value.slice(0, 10) : "-";
}

function bookingDateLabel(booking: Booking) {
  return booking.firstSeatReserved ? booking.firstSeatReserved.slice(0, 10) : "-";
}

function PendingRow({
  booking,
  onConfirm,
  t,
}: {
  booking: Booking;
  onConfirm: (booking: Booking) => void;
  t: (key: string) => string;
}) {
  return (
    <tr className="align-middle text-text transition hover:bg-surface-muted/60">
      <td className="px-4 py-3 font-semibold text-navy">{booking.refNumber || "-"}</td>
      <td className="px-4 py-3 text-text-muted">{booking.id}</td>
      <td className="px-4 py-3">{passengerLabel(booking)}</td>
      <td className="px-4 py-3 text-text-muted">{booking.phoneNumber || "-"}</td>
      <td className="px-4 py-3">
        <p>{routeLabel(booking)}</p>
        {booking.bank ? <p className="text-xs text-text-faint">{booking.bank}</p> : null}
      </td>
      <td className="px-4 py-3 text-text-muted">{travelDateLabel(booking)}</td>
      <td className="px-4 py-3 text-right font-semibold text-navy">{amountLabel(booking)}</td>
      <td className="px-4 py-3 text-text-muted">{bookingDateLabel(booking)}</td>
      <td className="px-4 py-3">
        <Badge tone="pending">{t("pending_payment")}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" onClick={() => onConfirm(booking)}>
          {t("confirm_payment")}
        </Button>
      </td>
    </tr>
  );
}

function PendingCard({
  booking,
  onConfirm,
  t,
}: {
  booking: Booking;
  onConfirm: (booking: Booking) => void;
  t: (key: string) => string;
}) {
  return (
    <Card className="space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-navy">{booking.refNumber || `#${booking.id}`}</p>
          <p className="text-text-muted">{passengerLabel(booking)}</p>
        </div>
        <Badge tone="pending">{t("pending_payment")}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-text-muted">
        <span>{t("from")}/{t("to")}</span>
        <span className="text-right font-semibold text-navy">{routeLabel(booking)}</span>
        {booking.bank ? (
          <>
            <span>{t("select_bank")}</span>
            <span className="text-right font-semibold text-navy">{booking.bank}</span>
          </>
        ) : null}
        <span>{t("travel_date")}</span>
        <span className="text-right font-semibold text-navy">{travelDateLabel(booking)}</span>
        <span>{t("phone")}</span>
        <span className="text-right font-semibold text-navy">{booking.phoneNumber || "-"}</span>
        <span>{t("amount")}</span>
        <span className="text-right font-semibold text-navy">{amountLabel(booking)}</span>
        <span>{t("booking_date")}</span>
        <span className="text-right font-semibold text-navy">{bookingDateLabel(booking)}</span>
      </div>
      <Button className="w-full" onClick={() => onConfirm(booking)}>
        {t("confirm_payment")}
      </Button>
    </Card>
  );
}

function ConfirmPaymentModal({
  booking,
  onClose,
  onConfirm,
  t,
}: {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (bookingId: number, transactionNumber: string) => Promise<void>;
  t: (key: string) => string;
}) {
  const [transactionNumber, setTransactionNumber] = useState("");
  const [saving, setSaving] = useState(false);

  if (!booking) return null;

  async function submit() {
    if (!booking || !transactionNumber.trim()) return;
    setSaving(true);
    try {
      await onConfirm(booking.id, transactionNumber);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title={t("confirm_payment")}
      subtitle={`${t("pnr")} ${booking.refNumber || `#${booking.id}`}`}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            {t("cancel_button")}
          </Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={!transactionNumber.trim()}
            onClick={submit}
          >
            {t("confirm_payment")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-warning-soft px-3.5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-warning">{t("pending_payment")}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <DetailRow label={t("reservation_no")} value={String(booking.id)} />
          <DetailRow label={t("passenger")} value={passengerLabel(booking)} />
          <DetailRow label={`${t("from")}/${t("to")}`} value={routeLabel(booking)} />
          {booking.bank ? <DetailRow label={t("select_bank")} value={booking.bank} /> : null}
          <DetailRow label={t("travel_date")} value={travelDateLabel(booking)} />
          <div className="my-1 border-t border-border" />
          <DetailRow label={t("amount")} value={<span className="text-base text-primary">{amountLabel(booking)}</span>} />
        </div>

        <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary-soft/50 p-3.5">
          <label className="block space-y-1.5">
            <span className="text-[13px] font-semibold text-navy">
              {t("bank_transaction_number")} <span className="text-danger">*</span>
            </span>
            <Input
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              placeholder={t("bank_transaction_number_placeholder")}
              autoFocus
            />
          </label>
          <p className="text-xs text-text-muted">{t("bank_transaction_number_hint")}</p>
        </div>
      </div>
    </Modal>
  );
}
