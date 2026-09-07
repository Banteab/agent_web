"use client";

import { Protected } from "@/components/protected";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { OfechoRow } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function OfechoPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<OfechoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOfechoReport()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [t, toast]);

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title="Ofecho" backHref="/reports" />
        {loading ? <Spinner /> : null}
        {!loading && !rows.length ? <EmptyState title={t("no_content")} /> : null}
        <div className="space-y-3">
          {rows.map((row, index) => (
            <Card key={`${row.name}-${index}`} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-navy">{row.name}</p>
                <p className="truncate text-sm text-slate-500">
                  {row.from} → {row.to} · {t("seat")} {row.seat}
                </p>
                <p className="text-sm text-slate-400">{row.bus}</p>
              </div>
              <p className="shrink-0 text-lg font-bold text-primary">{formatMoney(row.price)}</p>
            </Card>
          ))}
        </div>
      </div>
    </Protected>
  );
}
