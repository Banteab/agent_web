"use client";

import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Spinner, TableFrame } from "@/components/ui";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getPendingBankPayments, removePendingBankPayment, type PendingBankPayment } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { formatMoney, parsePassengerNames } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type Row = {
  entry: PendingBankPayment;
  booking: Booking | null;
  loadError?: string;
};

export default function PendingPaymentsPage() {
  const { t } = useI18n();
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
        <PageHeader title={t("pending_payments")} />

        <Card className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder={t("search_pending_payments")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            aria-label={t("travel_date")}
            className="min-h-12 rounded-full border border-transparent bg-slate-100 px-4 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
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
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("pnr")}</th>
                    <th className="px-4 py-3">{t("reservation_no")}</th>
                    <th className="px-4 py-3">{t("passenger")}</th>
                    <th className="px-4 py-3">{t("phone")}</th>
                    <th className="px-4 py-3">{t("from")}/{t("to")}</th>
                    <th className="px-4 py-3">{t("travel_date")}</th>
                    <th className="px-4 py-3">{t("amount")}</th>
                    <th className="px-4 py-3">{t("booking_date")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
  return (
    <tr className="align-middle text-navy">
      <td className="px-4 py-3 font-semibold">{row.booking?.refNumber || "-"}</td>
      <td className="px-4 py-3">{row.entry.bookingId}</td>
      <td className="px-4 py-3">{passengerLabel(row)}</td>
      <td className="px-4 py-3">{row.booking?.phoneNumber || row.entry.phoneNumber || "-"}</td>
      <td className="px-4 py-3">{routeLabel(row)}</td>
      <td className="px-4 py-3">{travelDateLabel(row)}</td>
      <td className="px-4 py-3 font-semibold">{amountLabel(row)}</td>
      <td className="px-4 py-3 text-slate-500">{bookingDateLabel(row)}</td>
      <td className="px-4 py-3">
        {row.loadError ? <Badge tone="danger">{t("error_occured")}</Badge> : <Badge tone="pending">{t("pending_payment")}</Badge>}
      </td>
      <td className="px-4 py-3 text-right">
        {row.loadError ? (
          <Button variant="ghost" onClick={() => onRemoveStale(row.entry.bookingId)}>
            {t("cancel_button")}
          </Button>
        ) : (
          <Button onClick={() => onConfirm(row)}>{t("confirm_payment")}</Button>
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
  return (
    <Card className="space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-navy">{row.booking?.refNumber || `#${row.entry.bookingId}`}</p>
          <p className="text-slate-500">{passengerLabel(row)}</p>
        </div>
        {row.loadError ? <Badge tone="danger">{t("error_occured")}</Badge> : <Badge tone="pending">{t("pending_payment")}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
        <span>{t("from")}/{t("to")}</span>
        <span className="text-right font-semibold text-navy">{routeLabel(row)}</span>
        <span>{t("travel_date")}</span>
        <span className="text-right font-semibold text-navy">{travelDateLabel(row)}</span>
        <span>{t("phone")}</span>
        <span className="text-right font-semibold text-navy">{row.booking?.phoneNumber || row.entry.phoneNumber || "-"}</span>
        <span>{t("amount")}</span>
        <span className="text-right font-semibold text-navy">{amountLabel(row)}</span>
        <span>{t("booking_date")}</span>
        <span className="text-right font-semibold text-navy">{bookingDateLabel(row)}</span>
      </div>
      {row.loadError ? (
        <Button variant="ghost" className="w-full" onClick={() => onRemoveStale(row.entry.bookingId)}>
          {t("cancel_button")}
        </Button>
      ) : (
        <Button className="w-full" onClick={() => onConfirm(row)}>
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

  if (!row) return null;

  async function submit() {
    if (!row || !transactionNumber.trim()) return;
    setSaving(true);
    try {
      await onConfirm(row.entry.bookingId, transactionNumber);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={t("confirm_payment")}
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
      <div className="space-y-3 text-sm">
        <Row label={t("pnr")} value={row.booking?.refNumber || "-"} />
        <Row label={t("reservation_no")} value={String(row.entry.bookingId)} />
        <Row label={t("passenger")} value={passengerLabel(row)} />
        <Row label={`${t("from")}/${t("to")}`} value={routeLabel(row)} />
        <Row label={t("travel_date")} value={travelDateLabel(row)} />
        <Row label={t("amount")} value={amountLabel(row)} />
        <Row label={t("status")} value={t("pending_payment")} />
        <label className="block space-y-1.5 pt-2">
          <span className="text-sm font-semibold text-slate-600">
            {t("bank_transaction_number")} <span className="text-rose-500">*</span>
          </span>
          <Input
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            placeholder={t("bank_transaction_number")}
            autoFocus
          />
        </label>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-navy">{value || "-"}</span>
    </div>
  );
}
