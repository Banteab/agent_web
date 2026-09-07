"use client";

import { Badge, Button, Card, DetailRow, EmptyState, Input, Modal, PageHeader, Spinner, TableFrame } from "@/components/ui";
import { Countdown } from "@/components/countdown";
import { DateTriggerBox, EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
import { formatEthiopianDate } from "@/lib/ethiopian-calendar";
import { useI18n } from "@/lib/i18n";
import {
  getPendingBankPayments,
  isPendingBankPaymentExpired,
  pendingBankPaymentExpiresAt,
  removePendingBankPayment,
  type PendingBankPayment,
} from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { formatDateISO, formatMoney, parsePassengerNames } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type Row = {
  entry: PendingBankPayment;
  booking: Booking | null;
  loadError?: string;
};

export default function PendingPaymentsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [confirmRow, setConfirmRow] = useState<Row | null>(null);

  function fetchPending() {
    const entries = getPendingBankPayments();
    return Promise.all(
      entries.map(async (entry): Promise<Row> => {
        try {
          const booking = await api.getBooking(entry.bookingId);
          return { entry, booking };
        } catch (err) {
          return { entry, booking: null, loadError: err instanceof Error ? err.message : t("error_occured") };
        }
      }),
    );
  }

  useEffect(() => {
    fetchPending().then((results) => {
      // A booking that already carries a bank reference number has been
      // confirmed (by this agent or another session) — no longer pending.
      results
        .filter((row) => row.booking?.bankReferenceNumber)
        .forEach((row) => removePendingBankPayment(row.entry.bookingId));
      setRows(results.filter((row) => !row.booking?.bankReferenceNumber));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const { booking, entry } = row;
      if (travelDate) {
        const rowDate = (booking?.trip?.travelDate || entry.travelDate || "").slice(0, 10);
        if (rowDate !== travelDate) return false;
      }
      if (!needle) return true;
      const haystack = [
        booking?.refNumber,
        String(entry.bookingId),
        booking?.passengers || entry.passengers,
        booking?.phoneNumber || entry.phoneNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, query, travelDate]);

  function removeStale(bookingId: number) {
    removePendingBankPayment(bookingId);
    setRows((prev) => prev.filter((row) => row.entry.bookingId !== bookingId));
  }

  async function confirmPayment(bookingId: number, transactionNumber: string) {
    const trimmed = transactionNumber.trim();
    if (!trimmed) {
      toast.error(t("bank_transaction_number_required"));
      return;
    }
    try {
      const res = await api.updatePayment(bookingId, "BANK", trimmed);
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      try {
        await api.generateTickets(bookingId);
      } catch (ticketErr) {
        toast.error(
          ticketErr instanceof Error
            ? `${t("payment_confirmed")}. ${ticketErr.message}`
            : t("could_not_ptint"),
        );
        removePendingBankPayment(bookingId);
        setRows((prev) => prev.filter((row) => row.entry.bookingId !== bookingId));
        setConfirmRow(null);
        return;
      }
      toast.success(res.message || t("payment_confirmed"));
      removePendingBankPayment(bookingId);
      setRows((prev) => prev.filter((row) => row.entry.bookingId !== bookingId));
      setConfirmRow(null);
    } catch (err) {
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
            !loading && rows.length ? (
              <Badge tone="pending" className="hidden sm:inline-flex">
                {rows.length} {t("pending_payment")}
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
                  {filtered.map((row) => (
                    <PendingRow key={row.entry.bookingId} row={row} onConfirm={setConfirmRow} onRemoveStale={removeStale} t={t} />
                  ))}
                </tbody>
              </table>
            </TableFrame>

            <div className="space-y-3 md:hidden">
              {filtered.map((row) => (
                <PendingCard key={row.entry.bookingId} row={row} onConfirm={setConfirmRow} onRemoveStale={removeStale} t={t} />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <ConfirmPaymentModal
        key={confirmRow?.entry.bookingId ?? "closed"}
        row={confirmRow}
        onClose={() => setConfirmRow(null)}
        onConfirm={confirmPayment}
        t={t}
      />
    </Protected>
  );
}

function passengerLabel(row: Row) {
  const names = parsePassengerNames(row.booking?.passengers || row.entry.passengers);
  return names.join(", ") || "-";
}

function routeLabel(row: Row) {
  const from = row.booking?.trip?.from || row.entry.fromCity;
  const to = row.booking?.trip?.to || row.entry.toCity;
  if (!from && !to) return "-";
  return `${from || "-"} → ${to || "-"}`;
}

function amountLabel(row: Row) {
  // `entry.price` (set at BANK-selection time) is already the total for all
  // passengers; `booking.price` from the API is a per-seat price.
  if (row.booking?.price != null) {
    const passengers = Math.max(parsePassengerNames(row.booking.passengers || row.entry.passengers).length, 1);
    return formatMoney(row.booking.price * passengers);
  }
  return row.entry.price != null ? formatMoney(row.entry.price) : "-";
}

function travelDateLabel(row: Row) {
  const value = row.booking?.trip?.travelDate || row.entry.travelDate;
  return value ? value.slice(0, 10) : "-";
}

function bookingDateLabel(row: Row) {
  return row.entry.addedAt ? row.entry.addedAt.slice(0, 10) : "-";
}

function bankLabel(row: Row) {
  return row.entry.bank || "-";
}

function PendingRow({
  row,
  onConfirm,
  onRemoveStale,
  t,
}: {
  row: Row;
  onConfirm: (row: Row) => void;
  onRemoveStale: (bookingId: number) => void;
  t: (key: string) => string;
}) {
  const expiresAt = pendingBankPaymentExpiresAt(row.entry);
  const [expired, setExpired] = useState(() => isPendingBankPaymentExpired(row.entry));
  const blocked = row.loadError || expired;

  return (
    <tr
      onClick={() => onConfirm(row)}
      className="cursor-pointer align-middle text-text transition hover:bg-surface-muted/60"
    >
      <td className="px-4 py-3 font-semibold text-navy">{row.booking?.refNumber || "-"}</td>
      <td className="px-4 py-3 text-text-muted">{row.entry.bookingId}</td>
      <td className="px-4 py-3">{passengerLabel(row)}</td>
      <td className="px-4 py-3 text-text-muted">{row.booking?.phoneNumber || row.entry.phoneNumber || "-"}</td>
      <td className="px-4 py-3">
        <p>{routeLabel(row)}</p>
        {row.entry.bank ? <p className="text-xs text-text-faint">{bankLabel(row)}</p> : null}
      </td>
      <td className="px-4 py-3 text-text-muted">{travelDateLabel(row)}</td>
      <td className="px-4 py-3 text-right font-semibold text-navy">{amountLabel(row)}</td>
      <td className="px-4 py-3 text-text-muted">{bookingDateLabel(row)}</td>
      <td className="px-4 py-3">
        {row.loadError || expired ? (
          <span className="text-text-faint">—</span>
        ) : (
          <Countdown endTime={expiresAt} onExpire={() => setExpired(true)} />
        )}
      </td>
      <td className="px-4 py-3">
        {row.loadError ? (
          <Badge tone="danger">{t("error_occured")}</Badge>
        ) : expired ? (
          <Badge tone="danger">{t("expired")}</Badge>
        ) : (
          <Badge tone="pending">{t("pending_payment")}</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {blocked ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveStale(row.entry.bookingId);
            }}
          >
            {t("cancel_button")}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm(row);
            }}
          >
            {t("confirm_payment")}
          </Button>
        )}
      </td>
    </tr>
  );
}

function PendingCard({
  row,
  onConfirm,
  onRemoveStale,
  t,
}: {
  row: Row;
  onConfirm: (row: Row) => void;
  onRemoveStale: (bookingId: number) => void;
  t: (key: string) => string;
}) {
  const expiresAt = pendingBankPaymentExpiresAt(row.entry);
  const [expired, setExpired] = useState(() => isPendingBankPaymentExpired(row.entry));
  const blocked = row.loadError || expired;

  return (
    <Card className="cursor-pointer space-y-2 text-sm" onClick={() => onConfirm(row)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-navy">{row.booking?.refNumber || `#${row.entry.bookingId}`}</p>
          <p className="text-text-muted">{passengerLabel(row)}</p>
        </div>
        {row.loadError ? (
          <Badge tone="danger">{t("error_occured")}</Badge>
        ) : expired ? (
          <Badge tone="danger">{t("expired")}</Badge>
        ) : (
          <Badge tone="pending">{t("pending_payment")}</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-text-muted">
        <span>{t("from")}/{t("to")}</span>
        <span className="text-right font-semibold text-navy">{routeLabel(row)}</span>
        {row.entry.bank ? (
          <>
            <span>{t("select_bank")}</span>
            <span className="text-right font-semibold text-navy">{bankLabel(row)}</span>
          </>
        ) : null}
        <span>{t("travel_date")}</span>
        <span className="text-right font-semibold text-navy">{travelDateLabel(row)}</span>
        <span>{t("phone")}</span>
        <span className="text-right font-semibold text-navy">{row.booking?.phoneNumber || row.entry.phoneNumber || "-"}</span>
        <span>{t("amount")}</span>
        <span className="text-right font-semibold text-navy">{amountLabel(row)}</span>
        <span>{t("booking_date")}</span>
        <span className="text-right font-semibold text-navy">{bookingDateLabel(row)}</span>
        {!row.loadError && !expired ? (
          <>
            <span>{t("expires_in")}</span>
            <span className="text-right">
              <Countdown endTime={expiresAt} onExpire={() => setExpired(true)} />
            </span>
          </>
        ) : null}
      </div>
      {blocked ? (
        <Button
          variant="ghost"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveStale(row.entry.bookingId);
          }}
        >
          {t("cancel_button")}
        </Button>
      ) : (
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm(row);
          }}
        >
          {t("confirm_payment")}
        </Button>
      )}
    </Card>
  );
}

function ConfirmPaymentModal({
  row,
  onClose,
  onConfirm,
  t,
}: {
  row: Row | null;
  onClose: () => void;
  onConfirm: (bookingId: number, transactionNumber: string) => Promise<void>;
  t: (key: string) => string;
}) {
  const [transactionNumber, setTransactionNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [expired, setExpired] = useState(() => (row ? isPendingBankPaymentExpired(row.entry) : false));

  if (!row) return null;

  const expiresAt = pendingBankPaymentExpiresAt(row.entry);

  async function submit() {
    if (!row || !transactionNumber.trim() || expired) return;
    setSaving(true);
    try {
      await onConfirm(row.entry.bookingId, transactionNumber);
    } finally {
      setSaving(false);
    }
  }

  const viewOnly = Boolean(row.loadError) || expired;

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={viewOnly ? t("reservation_detail") : t("confirm_payment")}
      subtitle={`${t("pnr")} ${row.booking?.refNumber || `#${row.entry.bookingId}`}`}
      footer={
        row.loadError ? (
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {t("cancel_button")}
          </Button>
        ) : (
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
        )
      }
    >
      <div className="space-y-4 text-sm">
        {row.loadError ? (
          <div className="flex items-center justify-between rounded-lg bg-danger-soft px-3.5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-danger">{t("error_occured")}</span>
            <span className="text-xs text-danger">{row.loadError}</span>
          </div>
        ) : expired ? (
          <div className="flex items-center justify-between rounded-lg bg-danger-soft px-3.5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-danger">{t("expired")}</span>
            <span className="text-xs text-danger">{t("payment_window_expired_hint")}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-warning-soft px-3.5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-warning">{t("pending_payment")}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-warning">{t("expires_in")}</span>
              <Countdown endTime={expiresAt} onExpire={() => setExpired(true)} />
            </span>
          </div>
        )}

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <DetailRow label={t("reservation_no")} value={String(row.entry.bookingId)} />
          <DetailRow label={t("passenger")} value={passengerLabel(row)} />
          <DetailRow label={t("phone")} value={row.booking?.phoneNumber || row.entry.phoneNumber} />
          <DetailRow label={`${t("from")}/${t("to")}`} value={routeLabel(row)} />
          {row.entry.bank ? <DetailRow label={t("select_bank")} value={bankLabel(row)} /> : null}
          <DetailRow label={t("travel_date")} value={travelDateLabel(row)} />
          <DetailRow label={t("booking_date")} value={bookingDateLabel(row)} />
          <div className="my-1 border-t border-border" />
          <DetailRow label={t("amount")} value={<span className="text-base text-primary">{amountLabel(row)}</span>} />
        </div>

        {!row.loadError ? (
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
        ) : null}
      </div>
    </Modal>
  );
}
