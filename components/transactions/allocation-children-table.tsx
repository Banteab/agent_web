"use client";

import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge";
import { TableFrame } from "@/components/ui";
import type { PaymentTransactionChildItem } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

type Props = {
  rows: PaymentTransactionChildItem[];
  t: (key: string) => string;
};

function formatChildCancelledAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function AllocationChildrenTable({ rows, t }: Props) {
  if (!rows.length) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-text-faint">
        {t("ticket_allocations")}
      </h3>
      <TableFrame className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-3 py-2.5">{t("col_id")}</th>
              <th className="px-3 py-2.5">{t("ticket_id")}</th>
              <th className="px-3 py-2.5">{t("ticket_no")}</th>
              <th className="px-3 py-2.5">{t("credit")}</th>
              <th className="px-3 py-2.5">{t("status")}</th>
              <th className="px-3 py-2.5">{t("cancelled_at")}</th>
              <th className="px-3 py-2.5 text-center">{t("col_action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((child) => (
              <tr key={child.id} className="text-text">
                <td className="px-3 py-2.5 font-mono text-xs">{child.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {child.ticketId ?? "—"}
                </td>
                <td className="px-3 py-2.5 font-medium text-navy">
                  {child.ticketNo ?? "—"}
                </td>
                <td className="px-3 py-2.5 font-semibold text-navy">
                  {child.credit ? formatMoney(child.credit) : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <TransactionStatusBadge status={child.status} t={t} />
                </td>
                <td className="px-3 py-2.5 text-text-muted whitespace-nowrap">
                  {child.cancelledAt ? formatChildCancelledAt(child.cancelledAt) : "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/transactions/${child.id}`}
                    className="text-sm font-semibold text-navy hover:underline"
                  >
                    {t("view_detail")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableFrame>
    </div>
  );
}
