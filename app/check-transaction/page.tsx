"use client";

import { Badge, Button, Card, EmptyState, Input, PageHeader, Spinner, TableFrame } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { PaymentTransactionLookup } from "@/lib/types";
import { formatDisplayDateValue, formatMoney } from "@/lib/utils";
import { FormEvent, useState } from "react";

export default function CheckTransactionPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [reference, setReference] = useState("");
  const [rows, setRows] = useState<PaymentTransactionLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    const transactionReference = reference.trim();
    if (!transactionReference) {
      toast.error(t("transaction_reference_required"));
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const list = await api.getPaymentTransactionByReference(transactionReference);
      setRows(list);
    } catch (err) {
      setRows([]);
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("check_transaction")} subtitle={t("check_transaction_subtitle")} />

      <Card className="mb-4">
        <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              placeholder={t("transaction_reference_placeholder")}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              aria-label={t("transaction_reference")}
              className="pl-10"
            />
          </div>
          <Button type="submit" loading={loading} className="sm:w-32">
            {t("search")}
          </Button>
        </form>
      </Card>

      {loading ? <Spinner label={t("check_transaction")} /> : null}

      {!loading && searched && !rows.length ? (
        <EmptyState title={t("no_transaction_found")} hint={t("no_transaction_found_hint")} />
      ) : null}

      {!loading && rows.length ? (
        <>
          <TableFrame className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-4 py-3">{t("credit")}</th>
                  <th className="px-4 py-3">{t("transaction_reference")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3">{t("value_date")}</th>
                  <th className="px-4 py-3">{t("transaction_type")}</th>
                  <th className="px-4 py-3">{t("narration")}</th>
                  <th className="px-4 py-3">{t("payer_name")}</th>
                  <th className="px-4 py-3">{t("payer_phone")}</th>
                  <th className="px-4 py-3">{t("pnr")}</th>
                  <th className="px-4 py-3">{t("booking_id")}</th>
                  <th className="px-4 py-3">{t("post_date")}</th>
                  <th className="px-4 py-3">{t("used_by")}</th>
                  <th className="px-4 py-3">{t("used_at")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.transactionNumber} className="align-top text-text">
                    <td className="px-4 py-3 font-semibold text-navy">{creditLabel(row.credit)}</td>
                    <td className="px-4 py-3 font-semibold text-navy">{row.transactionNumber}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDisplayDateValue(row.transactionAt, locale)}</td>
                    <td className="px-4 py-3">{row.transactionType || "-"}</td>
                    <td className="max-w-xs px-4 py-3 text-text-muted">{row.description || "-"}</td>
                    <td className="px-4 py-3">{row.payerName || "-"}</td>
                    <td className="px-4 py-3 text-text-muted">{row.payerPhone || "-"}</td>
                    <td className="px-4 py-3">{row.pnr || "-"}</td>
                    <td className="px-4 py-3">{row.bookingId ?? "-"}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDisplayDateValue(row.postDate, locale)}</td>
                    <td className="px-4 py-3">{usedByLabel(row)}</td>
                    <td className="px-4 py-3 text-text-muted">{formatUsedAt(row.usedAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>

          <div className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <Card key={row.transactionNumber} className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{row.transactionNumber}</p>
                    <p className="font-semibold text-navy">{creditLabel(row.credit)}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-text-muted">
                  <Field label={t("value_date")} value={formatDisplayDateValue(row.transactionAt, locale)} />
                  <Field label={t("transaction_type")} value={row.transactionType} />
                  <Field label={t("narration")} value={row.description} />
                  <Field label={t("payer_name")} value={row.payerName} />
                  <Field label={t("payer_phone")} value={row.payerPhone} />
                  <Field label={t("pnr")} value={row.pnr} />
                  <Field label={t("booking_id")} value={row.bookingId == null ? undefined : String(row.bookingId)} />
                  <Field label={t("post_date")} value={formatDisplayDateValue(row.postDate, locale)} />
                  <Field label={t("used_by")} value={usedByLabel(row)} />
                  <Field label={t("used_at")} value={formatUsedAt(row.usedAt, locale)} />
                </dl>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className="text-right font-semibold text-navy">{value || "-"}</dd>
    </>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-text-faint">-</span>;
  const tone = status === "VERIFIED" ? "success" : status === "PENDING" ? "pending" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function creditLabel(credit?: string | null) {
  if (credit == null || credit === "") return "-";
  return formatMoney(credit);
}

function usedByLabel(row: PaymentTransactionLookup) {
  const name = [row.usedBy?.firstName, row.usedBy?.lastName].filter(Boolean).join(" ").trim();
  return name || "-";
}

function formatUsedAt(value?: string | null, locale?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const date = formatDisplayDateValue(value, locale);
  const time = parsed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}
