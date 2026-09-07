"use client";

import { Protected } from "@/components/protected";
import { Button, Card, EmptyState, PageHeader, SectionLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { RouteSalesData } from "@/lib/types";
import { formatDateISO, formatMoney } from "@/lib/utils";
import { useState } from "react";

export default function SalesReportPage() {
  const { t } = useI18n();
  const toast = useToast();
  const today = formatDateISO(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [rows, setRows] = useState<RouteSalesData[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getSalesReport(start, end);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("sales_report")} backHref="/menu" />
        <Card className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="min-h-11 rounded-full bg-slate-100 px-4" />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="min-h-11 rounded-full bg-slate-100 px-4" />
          <Button onClick={load} loading={loading}>
            {t("search")}
          </Button>
        </Card>
        {loading ? <Spinner /> : null}
        {!loading && !rows.length ? <EmptyState title={t("no_sales_report")} /> : null}
        <div className="space-y-3">
          {rows.map((day) => {
            const dayTotal = day.routeSales?.reduce((sum, sale) => sum + Number(sale.ticketSales || 0), 0);
            return (
              <Card key={day.date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionLabel>{day.date}</SectionLabel>
                  <p className="font-bold text-navy">{formatMoney(dayTotal)}</p>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  {day.routeSales?.map((sale) => (
                    <div key={`${sale.from}-${sale.to}`} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-slate-600">
                        {sale.from} → {sale.to} <span className="text-slate-400">({sale.totalTickets})</span>
                      </span>
                      <span className="font-semibold text-primary">{formatMoney(sale.ticketSales)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Protected>
  );
}
