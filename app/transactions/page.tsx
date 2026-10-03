"use client";

import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge";
import { Card, EmptyState, Input, PageHeader, Select, Spinner, TableFrame } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { PaymentTransactionListItem } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

/** Search and status are mutually exclusive on each API request (last control used wins). */
type LedgerQueryMode = "search" | "status";

export default function TransactionsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [queryMode, setQueryMode] = useState<LedgerQueryMode>("status");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTransactionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const appliedSearch = searchFilter.trim();
  const useSearchQuery = queryMode === "search" && appliedSearch.length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getPaymentTransactionsPaged(
        page,
        PAGE_SIZE,
        useSearchQuery ? appliedSearch : undefined,
        useSearchQuery ? undefined : statusFilter || undefined,
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
  }, [page, appliedSearch, queryMode, statusFilter, useSearchQuery, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(event?: FormEvent) {
    event?.preventDefault();
    const term = searchInput.trim();
    if (!term) {
      return;
    }
    setPage(1);
    setSearchFilter(term);
    setStatusFilter("");
    setQueryMode("search");
  }

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px]">
      <PageHeader title={t("transactions")} subtitle={t("transactions_subtitle")} />

      <Card className="mb-4">
        <form
          onSubmit={onSearch}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_7.5rem] lg:items-stretch"
        >
          <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
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
              onChange={(e) => {
                const next = e.target.value;
                setSearchInput(next);
                if (!next.trim()) {
                  setSearchFilter("");
                  setQueryMode("status");
                  setPage(1);
                }
              }}
              aria-label={t("transaction_reference")}
              className="pl-10"
            />
          </div>
          <div className="min-w-0 w-full">
            <Select
              aria-label={t("status")}
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setSearchInput("");
                setSearchFilter("");
                setStatusFilter(e.target.value);
                setQueryMode("status");
              }}
              className="min-h-11 w-full"
            >
              <option value="">{t("all_statuses")}</option>
              <option value="PENDING">{t("ledger_pending")}</option>
              <option value="VERIFIED">{t("ledger_verified")}</option>
            </Select>
          </div>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-navy px-5 text-sm font-semibold text-white sm:col-span-2 lg:col-span-1"
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
          <TableFrame className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-3 py-3">{t("col_id")}</th>
                  <th className="px-3 py-3">{t("transaction_type")}</th>
                  <th className="px-3 py-3">{t("narration")}</th>
                  <th className="px-3 py-3">{t("transaction_reference")}</th>
                  <th className="px-3 py-3 text-right">{t("credit")}</th>
                  <th className="px-3 py-3">{t("status")}</th>
                  <th className="px-3 py-3">{t("uploaded_at")}</th>
                  <th className="px-3 py-3 text-center">{t("col_action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top text-text">
                    <td className="px-3 py-3 font-mono text-xs">{row.id}</td>
                    <td className="px-3 py-3">{row.transactionType || ""}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-text-muted">
                      {row.description || ""}
                    </td>
                    <td className="max-w-[140px] break-all px-3 py-3 font-semibold text-navy sm:max-w-none">
                      {row.transactionNumber}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-navy">
                      {moneyOrEmpty(row.credit ?? row.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <TransactionStatusBadge status={row.status} t={t} />
                    </td>
                    <td className="px-3 py-3 text-text-muted whitespace-nowrap">
                      {formatUploadedAt(row.createdAt, locale)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        href={`/transactions/${row.id}`}
                        className="inline-flex rounded-lg p-2 text-navy hover:bg-surface-muted"
                        title={t("view_detail")}
                        aria-label={t("view_detail")}
                      >
                        <EyeIcon />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>

          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <Card key={row.id} className="min-w-0 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-all font-bold text-navy">{row.transactionNumber}</p>
                    <p className="text-xs text-text-faint">#{row.id}</p>
                  </div>
                  <TransactionStatusBadge status={row.status} t={t} />
                </div>
                <p className="font-semibold text-navy">{moneyOrEmpty(row.credit ?? row.amount)}</p>
                {row.transactionType ? (
                  <p className="text-xs text-text-faint">{row.transactionType}</p>
                ) : null}
                <p className="break-words text-text-muted">{row.description || ""}</p>
                <Link
                  href={`/transactions/${row.id}`}
                  className="inline-block text-sm font-semibold text-navy hover:underline"
                >
                  {t("view_detail")}
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex min-w-0 flex-col items-center justify-between gap-3 text-center text-sm text-text-muted sm:flex-row sm:text-left">
            <span className="max-w-full break-words">
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

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
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
