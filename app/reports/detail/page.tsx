"use client";

import { Protected } from "@/components/protected";
import { Button, Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { TicketReport } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ReportDetail() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const type = useSearchParams().get("type") || "today";
  const [report, setReport] = useState<TicketReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTicketReport(type)
      .then(setReport)
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [type, t, toast]);

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("report")} backHref="/reports" />
        {loading ? <Spinner /> : null}
        {!loading && !report?.ticket?.length && !report?.route?.length ? (
          <EmptyState title={t("no_content")} />
        ) : null}
        <div className="space-y-3">
          {report?.ticket?.map((ticket) => (
            <Card key={ticket.id}>
              <p className="font-bold text-navy">{ticket.ticketNo}</p>
              <p className="text-sm text-slate-500">
                {ticket.passenger} · {t("seat")} {ticket.seat}
              </p>
            </Card>
          ))}
          {report?.route?.map((route) => (
            <Card key={route.route}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-navy">{route.route}</p>
                <Button
                  variant="ghost"
                  className="min-h-9 px-3"
                  onClick={() => {
                    sessionStorage.setItem("passengerList", JSON.stringify(route.passengers || []));
                    router.push("/reports/passengers");
                  }}
                >
                  {t("passengers")}
                </Button>
              </div>
              <p className="text-sm text-slate-500">{route.passengers?.length || 0} {t("ticket")}</p>
              <p className="text-sm font-semibold text-primary">
                {formatMoney(
                  route.passengers?.reduce((sum, item) => sum + Number(item.price || 0), 0),
                )}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </Protected>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ReportDetail />
    </Suspense>
  );
}
