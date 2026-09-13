"use client";

import { Protected } from "@/components/protected";
import { Badge, Button, Card, EmptyState, PageHeader, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { TicketReport } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ReportsScreen() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [pendingType, setPendingType] = useState(type || "today");
  const [report, setReport] = useState<TicketReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type) {
      setReport(null);
      return;
    }
    setLoading(true);
    api
      .getTicketReport(type)
      .then(setReport)
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function search() {
    if (pendingType === "ofecho") {
      router.push("/reports/ofecho");
      return;
    }
    router.push(`/reports?type=${pendingType}`);
  }

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("report")} backHref="/home" />
        <Card className="space-y-4">
          <Select value={pendingType} onChange={(e) => setPendingType(e.target.value)}>
            <option value="today">{t("today")}</option>
            <option value="week">{t("this_week")}</option>
            <option value="month">{t("this_month")}</option>
            {profile?.type === "SUPER" ? <option value="ofecho">Ofecho</option> : null}
          </Select>
          <Button className="w-full" onClick={search}>
            {t("search")}
          </Button>
        </Card>

        {type ? (
          <div className="mt-4 space-y-3">
            {loading ? <Spinner /> : null}
            {!loading && !report?.ticket?.length && !report?.route?.length ? (
              <EmptyState title={t("no_content")} />
            ) : null}
            {report?.ticket?.map((ticket) => (
              <Card key={ticket.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">{ticket.ticketNo}</p>
                  <p className="text-sm text-text-muted">{ticket.passenger}</p>
                </div>
                <Badge tone="info">
                  {t("seat")} {ticket.seat}
                </Badge>
              </Card>
            ))}
            {report?.route?.map((route) => (
              <Card key={route.route} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-navy">{route.route}</p>
                    <p className="text-sm text-text-muted">
                      {route.passengers?.length || 0} {t("ticket")}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatMoney(route.passengers?.reduce((sum, item) => sum + Number(item.price || 0), 0))}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    sessionStorage.setItem("passengerList", JSON.stringify(route.passengers || []));
                    router.push("/reports/passengers");
                  }}
                >
                  {t("passengers")}
                </Button>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </Protected>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ReportsScreen />
    </Suspense>
  );
}
