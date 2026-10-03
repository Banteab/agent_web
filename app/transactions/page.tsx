"use client";

import { Badge, Card, EmptyState, Input, PageHeader, Spinner, TableFrame } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { PaymentTransactionListItem } from "@/lib/types";
import { formatDisplayDateValue, formatMoney } from "@/lib/utils";
import { FormEvent, useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTransactionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getPaymentTransactionsPaged(
        page,
        PAGE_SIZE,
        searchFilter.trim() || undefined,
      );
      setRows(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setRows([]);
      setTotal(0);
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }, [page, searchFilter, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(event?: FormEvent) {
    event?.preventDefault();
    setPage(1);
    setSearchFilter(searchInput.trim());
  }

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title={t("transactions")} subtitle={t("transactions_subtitle")} />

      <Card className="mb-4">
        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              placeholder={t("search_by_reference")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label={t("transaction_reference")}
              className="pl-10"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-navy px-5 text-sm font-semibold text-white sm:w-32"
          >
            {t("search")}
          </button>
        </form>
      </Card>

      {loading ? <Spinner label={t("transactions")} /> : null}

      {!loading && !rows.length ? (
        <EmptyState title={t("no_transactions")} hint={t("no_transactions_hint")} />
      ) : null}

      {!loading && rows.length > 0 ? (
        <>
          <TableFrame className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-3 py-3">{t("col_id")}</th>
                  <th className="px-3 py-3">{t("value_date")}</th>
                  <th className="px-3 py-3">{t("post_date")}</th>
                  <th className="px-3 py-3">{t("transaction_type")}</th>
                  <th className="px-3 py-3">{t("narration")}</th>
                  <th className="px-3 py-3">{t("transaction_reference")}</th>
                  <th className="px-3 py-3 text-right">{t("debit")}</th>
                  <th className="px-3 py-3 text-right">{t("credit")}</th>
                  <th className="px-3 py-3">{t("status")}</th>
                  <th className="px-3 py-3">{t("uploaded_at")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top text-text">
                    <td className="px-3 py-3 font-mono text-xs">{row.id}</td>
                    <td className="px-3 py-3 text-text-muted">
                      {formatDisplayDateValue(row.transactionAt, locale)}
                    </td>
                    <td className="px-3 py-3 text-text-muted">
                      {formatDisplayDateValue(row.postDate, locale)}
                    </td>
                    <td className="px-3 py-3">{row.transactionType || ""}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-text-muted">
                      {row.description || ""}
                    </td>
                    <td className="px-3 py-3 font-semibold text-navy">{row.transactionNumber}</td>
                    <td className="px-3 py-3 text-right">{moneyOrEmpty(row.debit)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-navy">
                      {moneyOrEmpty(row.credit ?? row.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={row.status} t={t} />
                    </td>
                    <td className="px-3 py-3 text-text-muted whitespace-nowrap">
                      {formatUploadedAt(row.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>

          <div className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <Card key={row.id} className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{row.transactionNumber}</p>
                    <p className="text-xs text-text-faint">#{row.id}</p>
                  </div>
                  <StatusBadge status={row.status} t={t} />
                </div>
                <p className="font-semibold text-navy">{moneyOrEmpty(row.credit ?? row.amount)}</p>
                <p className="text-text-muted">{row.description || ""}</p>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-text-muted sm:flex-row">
            <span>
              {t("pagination_range")
                .replace("{from}", String(rangeFrom))
                .replace("{to}", String(rangeTo))
                .replace("{total}", String(total))}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
              >
                {t("prev_page")}
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
              >
                {t("next_page")}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function moneyOrEmpty(value?: string | null) {
  if (value == null || value === "") return "";
  return formatMoney(value);
}

function StatusBadge({
  status,
  t,
}: {
  status?: string | null;
  t: (key: string) => string;
}) {
  if (!status) return null;
  const normalized =
    status === "VERIFIED" || status === "USED"
      ? "VERIFIED"
      : status === "PENDING" || status === "AVAILABLE"
        ? "PENDING"
        : status;
  const tone =
    normalized === "VERIFIED" ? "success" : normalized === "PENDING" ? "pending" : "neutral";
  const label =
    normalized === "VERIFIED"
      ? t("ledger_verified")
      : normalized === "PENDING"
        ? t("ledger_pending")
        : status;
  return <Badge tone={tone}>{label}</Badge>;
}

function formatUploadedAt(value?: string | null, locale?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const date = parsed.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = parsed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}
