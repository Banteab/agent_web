"use client";

import { Card, PageHeader, Spinner } from "@/components/ui";
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { PaymentTransactionDetail } from "@/lib/types";
import { formatDisplayDateValue, formatMoney } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

export default function TransactionDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const { t, locale } = useI18n();
  const toast = useToast();
  const [row, setRow] = useState<PaymentTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const detail = await api.getPaymentTransaction(id);
        if (!cancelled) setRow(detail);
      } catch (err) {
        if (!cancelled) {
          setRow(null);
          toast.error(err instanceof Error ? err.message : t("error_occured"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t, toast]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/transactions"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline"
      >
        ← {t("back_to_transactions")}
      </Link>

      <PageHeader title={t("transaction_detail")} subtitle={row?.transactionNumber} />

      {loading ? <Spinner label={t("transaction_detail")} /> : null}

      {!loading && !row ? (
        <Card className="text-sm text-text-muted">{t("detail_load_failed")}</Card>
      ) : null}

      {!loading && row ? (
        <Card className="divide-y divide-border text-sm">
          <DetailSection title={t("transaction_detail")}>
            <DetailRow label={t("col_id")} value={row.id} />
            <DetailRow label={t("transaction_reference")} value={row.transactionNumber} />
            <DetailRow
              label={t("status")}
              value={<TransactionStatusBadge status={row.status} t={t} />}
            />
            <DetailRow label={t("detail_account_reference")} value={row.accountReference} />
            <DetailRow label={t("detail_bank")} value={row.bank} />
            <DetailRow label={t("detail_currency")} value={row.currency} />
            <DetailRow
              label={t("value_date")}
              value={formatDisplayDateValue(row.transactionAt, locale)}
            />
            <DetailRow
              label={t("post_date")}
              value={formatDisplayDateValue(row.postDate, locale)}
            />
            <DetailRow label={t("transaction_type")} value={row.transactionType} />
            <DetailRow label={t("debit")} value={moneyOrEmpty(row.debit)} />
            <DetailRow label={t("credit")} value={moneyOrEmpty(row.credit ?? row.amount)} />
            <DetailRow label={t("narration")} value={row.description} full />
            <DetailRow label={t("payer_name")} value={row.payerName} />
            <DetailRow label={t("payer_phone")} value={row.payerPhone} />
            <DetailRow label={t("pnr")} value={row.pnr} />
            <DetailRow
              label={t("booking_id")}
              value={row.bookingId != null ? String(row.bookingId) : row.booking?.id != null ? String(row.booking.id) : undefined}
            />
            <DetailRow label={t("used_by")} value={formatPerson(row.usedBy)} />
            <DetailRow label={t("used_at")} value={formatDateTime(row.usedAt, locale)} />
            <DetailRow label={t("detail_uploaded_by")} value={formatUploadedBy(row.uploadedBy)} />
            <DetailRow
              label={t("uploaded_at")}
              value={formatDateTime(row.createdAt, locale)}
            />
            <DetailRow
              label={t("detail_updated_at")}
              value={formatDateTime(row.updatedAt, locale)}
            />
            <DetailRow label={t("detail_remarks")} value={row.remarks} full />
          </DetailSection>
        </Card>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="p-4">
      <h2 className="mb-3 text-base font-bold text-navy">{title}</h2>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function DetailRow({
  label,
  value,
  full,
}: {
  label: string;
  value?: ReactNode;
  full?: boolean;
}) {
  const empty = value == null || value === "";
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-faint">{label}</dt>
      <dd className="mt-1 font-medium text-navy">{empty ? "" : value}</dd>
    </div>
  );
}

function moneyOrEmpty(value?: string | null) {
  if (value == null || value === "") return "";
  return formatMoney(value);
}

function formatPerson(
  person?: { firstName?: string; lastName?: string; phoneNo?: string } | null,
) {
  if (!person) return "";
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  if (name && person.phoneNo) return `${name} (${person.phoneNo})`;
  return name || person.phoneNo || "";
}

function formatUploadedBy(
  person?: { firstName?: string; lastName?: string; email?: string } | null,
) {
  if (!person) return "";
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  if (name && person.email) return `${name} (${person.email})`;
  return name || person.email || "";
}

function formatDateTime(value?: string | null, locale?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const date = formatDisplayDateValue(value, locale);
  const time = parsed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}
