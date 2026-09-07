"use client";

import { Protected } from "@/components/protected";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { useEffect, useState } from "react";

type Passenger = {
  passenger?: string;
  seat?: string;
  ticketNo?: string;
  price?: string;
};

export default function PassengerListPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Passenger[]>([]);

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
          {rows.map((row, index) => (
            <Card key={`${row.ticketNo}-${index}`} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-navy">{row.passenger}</p>
                <p className="truncate text-sm text-text-muted">
                  {row.ticketNo} · {t("seat")} {row.seat}
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold text-primary">{formatMoney(row.price)}</p>
            </Card>
          ))}
        </div>
      </div>
    </Protected>
  );
}
