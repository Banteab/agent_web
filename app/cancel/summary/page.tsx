"use client";

import { Protected } from "@/components/protected";
import { Button, Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Ticket } from "@/lib/types";
import { formatMoney, parseSelectedRoute } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CancelSummary() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const ticketNo = params.get("ticket") || "";
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!ticketNo) {
      setLoading(false);
      return;
    }
    api
      .getTicketByNumber(ticketNo)
      .then(setTicket)
      .catch((err) => toast.error(err instanceof Error ? err.message : t("no_ticket_data")))
      .finally(() => setLoading(false));
  }, [ticketNo, t, toast]);

  async function confirm() {
    if (!ticket?.id) return;
    setCancelling(true);
    try {
      const res = await api.cancelTicket(ticket.id);
      toast.success(res.message || t("ticket_cancelled"));
      router.replace("/cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("ticket_not_cancelled"));
    } finally {
      setCancelling(false);
    }
  }

  const route = ticket?.booking?.parseSelectedRoute || parseSelectedRoute(ticket?.booking?.selectedRoute);

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("cancel_detail")} backHref="/cancel" />
        {loading ? <Spinner /> : null}
        {!loading && !ticket ? <EmptyState title={t("no_ticket_data")} /> : null}
        {ticket ? (
          <Card className="space-y-3">
            <Row label={t("ticket_no")} value={ticket.ticketNo} />
            <Row label={t("passenger")} value={ticket.passenger} />
            <Row label={t("phone")} value={ticket.booking?.phoneNumber} />
            <Row label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
            <Row label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
            <Row label={t("seat")} value={ticket.seat} />
            <Row label={t("price")} value={formatMoney(ticket.booking?.price || route?.price)} />
            <Row label={t("status")} value={ticket.status} />
            <Button variant="danger" className="w-full" loading={cancelling} onClick={confirm}>
              {t("cancel_this_ticket")}
            </Button>
          </Card>
        ) : null}
      </div>
    </Protected>
  );
}

export default function CancelSummaryPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CancelSummary />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-navy">{value || "-"}</span>
    </div>
  );
}
