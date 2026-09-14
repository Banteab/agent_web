"use client";

import { Button, DetailRow, Input, Modal } from "@/components/ui";
import { Countdown } from "@/components/countdown";
import { PENDING_BANK_PAYMENT_TTL_MS } from "@/lib/constants";
import type { Booking } from "@/lib/types";
import { formatDisplayDateValue, formatMoney, parsePassengerNames } from "@/lib/utils";
import { useState } from "react";

export function expiresAtFor(booking: Booking) {
  if (!booking.firstSeatReserved) return undefined;
  return new Date(booking.firstSeatReserved).getTime() + PENDING_BANK_PAYMENT_TTL_MS;
}

export function isExpired(booking: Booking, now = Date.now()) {
  const at = expiresAtFor(booking);
  return at != null && now >= at;
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

/** Shared with Manage Bookings' pending-payment detail view and the legacy /pending-payments page. */
export function ConfirmPaymentModal({
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
          <Button className="flex-1" loading={saving} disabled={!transactionNumber.trim() || expired} onClick={submit}>
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
          <DetailRow label={t("travel_date")} value={formatDisplayDateValue(booking.trip?.travelDate, locale)} />
          <DetailRow label={t("booking_date")} value={formatDisplayDateValue(booking.firstSeatReserved, locale)} />
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
