"use client";

import { Badge, Button, Card, DetailRow, EmptyState, Input, Modal, PageHeader, Spinner, TableFrame } from "@/components/ui";
import { Countdown } from "@/components/countdown";
import { DateTriggerBox, EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { PENDING_BANK_PAYMENT_TTL_MS, PENDING_PAYMENTS_REFRESH_EVENT } from "@/lib/constants";
import { formatEthiopianDate } from "@/lib/ethiopian-calendar";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { notifyPendingPaymentsRefresh } from "@/lib/use-pending-bank-payments-count";
import { formatDateISO, formatDisplayDateValue, formatMoney, parsePassengerNames } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

function expiresAtFor(booking: Booking) {
  if (!booking.firstSeatReserved) return undefined;
  return new Date(booking.firstSeatReserved).getTime() + PENDING_BANK_PAYMENT_TTL_MS;
}

function isExpired(booking: Booking, now = Date.now()) {
  const at = expiresAtFor(booking);
  return at != null && now >= at;
}

export default function PendingPaymentsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (travelDate) {
        const rowDate = (booking.trip?.travelDate || "").slice(0, 10);
        if (rowDate !== travelDate) return false;
      }
      if (!needle) return true;
      const haystack = [booking.refNumber, String(booking.id), booking.passengers, booking.phoneNumber]
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
          {locale?.startsWith("am") ? (
            <div className="flex items-center gap-1.5 sm:w-56">
              <EthiopianDatePicker value={travelDate || formatDateISO(new Date())} onChange={setTravelDate}>
                <DateTriggerBox
                  label={travelDate ? formatEthiopianDate(new Date(`${travelDate}T00:00:00`)) : t("travel_date")}
                />
              </EthiopianDatePicker>
              {travelDate ? (
                <button
                  type="button"
                  onClick={() => setTravelDate("")}
                  aria-label={t("clear")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-surface-muted hover:text-danger"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : (
            <Input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              aria-label={t("travel_date")}
              className="sm:w-48"
            />
          )}
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
                    <th className="px-4 py-3">{t("expires_in")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((booking) => (
                    <PendingRow key={booking.id} booking={booking} onConfirm={setConfirmBooking} t={t} locale={locale} />
                  ))}
                </tbody>
              </table>
            </TableFrame>

            <div className="space-y-3 md:hidden">
              {filtered.map((booking) => (
                <PendingCard key={booking.id} booking={booking} onConfirm={setConfirmBooking} t={t} locale={locale} />
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
        locale={locale}
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

function travelDateLabel(booking: Booking, locale?: string) {
  return formatDisplayDateValue(booking.trip?.travelDate, locale);
}

function bookingDateLabel(booking: Booking, locale?: string) {
  return formatDisplayDateValue(booking.firstSeatReserved, locale);
}

function PendingRow({
  booking,
  onConfirm,
  t,
  locale,
}: {
  booking: Booking;
  onConfirm: (booking: Booking) => void;
  t: (key: string) => string;
  locale?: string;
}) {
  const expiresAt = expiresAtFor(booking);
  const [expired, setExpired] = useState(() => isExpired(booking));

  return (
    <tr
      onClick={() => onConfirm(booking)}
      className="cursor-pointer align-middle text-text transition hover:bg-surface-muted/60"
    >
      <td className="px-4 py-3 font-semibold text-navy">{booking.refNumber || "-"}</td>
      <td className="px-4 py-3 text-text-muted">{booking.id}</td>
      <td className="px-4 py-3">{passengerLabel(booking)}</td>
      <td className="px-4 py-3 text-text-muted">{booking.phoneNumber || "-"}</td>
      <td className="px-4 py-3">
        <p>{routeLabel(booking)}</p>
        {booking.bank ? <p className="text-xs text-text-faint">{booking.bank}</p> : null}
      </td>
      <td className="px-4 py-3 text-text-muted">{travelDateLabel(booking, locale)}</td>
      <td className="px-4 py-3 text-right font-semibold text-navy">{amountLabel(booking)}</td>
      <td className="px-4 py-3 text-text-muted">{bookingDateLabel(booking, locale)}</td>
      <td className="px-4 py-3">
        {expiresAt && !expired ? (
          <Countdown endTime={expiresAt} onExpire={() => setExpired(true)} />
        ) : (
          <span className="text-text-faint">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {expired ? <Badge tone="danger">{t("expired")}</Badge> : <Badge tone="pending">{t("pending_payment")}</Badge>}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          disabled={expired}
          onClick={(e) => {
            e.stopPropagation();
            onConfirm(booking);
          }}
        >
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
  locale,
}: {
  booking: Booking;
  onConfirm: (booking: Booking) => void;
  t: (key: string) => string;
  locale?: string;
}) {
  const expiresAt = expiresAtFor(booking);
  const [expired, setExpired] = useState(() => isExpired(booking));

  return (
    <Card className="cursor-pointer space-y-2 text-sm" onClick={() => onConfirm(booking)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-navy">{booking.refNumber || `#${booking.id}`}</p>
          <p className="text-text-muted">{passengerLabel(booking)}</p>
        </div>
        {expired ? <Badge tone="danger">{t("expired")}</Badge> : <Badge tone="pending">{t("pending_payment")}</Badge>}
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
        <span className="text-right font-semibold text-navy">{travelDateLabel(booking, locale)}</span>
        <span>{t("phone")}</span>
        <span className="text-right font-semibold text-navy">{booking.phoneNumber || "-"}</span>
        <span>{t("amount")}</span>
        <span className="text-right font-semibold text-navy">{amountLabel(booking)}</span>
        <span>{t("booking_date")}</span>
        <span className="text-right font-semibold text-navy">{bookingDateLabel(booking, locale)}</span>
        {expiresAt && !expired ? (
          <>
            <span>{t("expires_in")}</span>
            <span className="text-right">
              <Countdown endTime={expiresAt} onExpire={() => setExpired(true)} />
            </span>
          </>
        ) : null}
      </div>
      <Button
        className="w-full"
        disabled={expired}
        onClick={(e) => {
          e.stopPropagation();
          onConfirm(booking);
        }}
      >
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
  locale,
}: {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (bookingId: number, transactionNumber: string) => Promise<void>;
  t: (key: string) => string;
  locale?: string;
}) {
  const [transactionNumber, setTransactionNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [expired, setExpired] = useState(() => (booking ? isExpired(booking) : false));

  if (!booking) return null;

  const expiresAt = expiresAtFor(booking);

  async function submit() {
    if (!booking || !transactionNumber.trim() || expired) return;
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
      title={expired ? t("reservation_detail") : t("confirm_payment")}
      subtitle={`${t("pnr")} ${booking.refNumber || `#${booking.id}`}`}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            {t("cancel_button")}
          </Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={!transactionNumber.trim() || expired}
            onClick={submit}
          >
            {t("confirm_payment")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {expired ? (
          <div className="flex items-center justify-between rounded-lg bg-danger-soft px-3.5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-danger">{t("expired")}</span>
            <span className="text-xs text-danger">{t("payment_window_expired_hint")}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-warning-soft px-3.5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-warning">{t("pending_payment")}</span>
            {expiresAt ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-warning">{t("expires_in")}</span>
                <Countdown endTime={expiresAt} onExpire={() => setExpired(true)} />
              </span>
            ) : null}
          </div>
        )}

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <DetailRow label={t("reservation_no")} value={String(booking.id)} />
          <DetailRow label={t("passenger")} value={passengerLabel(booking)} />
          <DetailRow label={t("phone")} value={booking.phoneNumber} />
          <DetailRow label={`${t("from")}/${t("to")}`} value={routeLabel(booking)} />
          {booking.bank ? <DetailRow label={t("bank")} value={booking.bank} /> : null}
          <DetailRow label={t("travel_date")} value={travelDateLabel(booking, locale)} />
          <DetailRow label={t("booking_date")} value={bookingDateLabel(booking, locale)} />
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
              disabled={expired}
              autoFocus
            />
          </label>
          <p className="text-xs text-text-muted">{t("bank_transaction_number_hint")}</p>
        </div>
      </div>
    </Modal>
  );
}
