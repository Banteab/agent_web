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
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("passengers")} backHref="/reports" />
        {!rows.length ? <EmptyState title={t("no_content")} /> : null}
        <div className="space-y-3">
          {rows.map((row, index) => (
            <Card key={`${row.ticketNo}-${index}`}>
              <p className="font-bold text-navy">{row.passenger}</p>
              <p className="text-sm text-slate-500">
                {row.ticketNo} · {t("seat")} {row.seat}
              </p>
              <p className="font-semibold text-primary">{formatMoney(row.price)}</p>
            </Card>
          ))}
        </div>
      </div>
    </Protected>
  );
}
