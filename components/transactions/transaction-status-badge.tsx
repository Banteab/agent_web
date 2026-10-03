"use client";

import { Badge } from "@/components/ui";

export function normalizeLedgerStatus(status: string): string {
  if (status === "VERIFIED" || status === "USED") return "VERIFIED";
  if (status === "PENDING" || status === "AVAILABLE") return "PENDING";
  if (status === "CANCELLED") return "CANCELLED";
  return status;
}

export function TransactionStatusBadge({
  status,
  t,
}: {
  status?: string | null;
  t: (key: string) => string;
}) {
  if (!status) return null;
  const normalized = normalizeLedgerStatus(status);
  const tone =
    normalized === "VERIFIED"
      ? "success"
      : normalized === "PENDING"
        ? "pending"
        : normalized === "CANCELLED"
          ? "danger"
          : "neutral";
  const label =
    normalized === "VERIFIED"
      ? t("ledger_verified")
      : normalized === "PENDING"
        ? t("ledger_pending")
        : normalized === "CANCELLED"
          ? t("ledger_cancelled")
          : status;
  return <Badge tone={tone}>{label}</Badge>;
}
