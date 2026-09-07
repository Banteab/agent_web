"use client";

import { Protected } from "@/components/protected";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { ReportPassenger } from "@/lib/types";
import { formatMoney, reportPassengerFields } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function PassengerListPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<ReportPassenger[]>([]);

  useEffect(() => {
    try {
      setRows(JSON.parse(sessionStorage.getItem("passengerList") || "[]"));
    } catch {
      setRows([]);
    }
  }, []);

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("passengers")} backHref="/reports" />
        {!rows.length ? <EmptyState title={t("no_content")} /> : null}
        <div className="space-y-3">
          {rows.map((row, index) => {
            const info = reportPassengerFields(row);
            return (
              <Card key={`${info.ticketNo}-${index}`} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{info.name}</p>
                    <p className="truncate text-sm text-text-muted">
                      {info.ticketNo} · {t("seat")} {info.seat}
                    </p>
                    {info.phone ? <p className="truncate text-sm text-text-faint">{info.phone}</p> : null}
                  </div>
                  <p className="shrink-0 text-lg font-bold text-primary">{formatMoney(info.price)}</p>
                </div>
                {info.bank || info.transactionNumber ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-text-muted">
                    {info.bank ? <span>{info.bank}</span> : null}
                    {info.transactionNumber ? (
                      <span className="font-mono">
                        {t("bank_transaction_number")}: {info.transactionNumber}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </Protected>
  );
}
