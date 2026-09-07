"use client";

import { Protected } from "@/components/protected";
import { Button, Card, DetailRow, EmptyState, Field, PageHeader, Spinner, StatusBadge, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { setCancellationReason } from "@/lib/storage";
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
  const [reason, setReason] = useState("");

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
    if (!reason.trim()) {
      toast.error(t("cancellation_reason_required"));
      return;
    }
    setCancelling(true);
    try {
      const res = await api.cancelTicket(ticket.id);
      setCancellationReason(ticket.id, reason.trim());
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
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("cancel_detail")} backHref="/cancel" />
        {loading ? <Spinner /> : null}
        {!loading && !ticket ? <EmptyState title={t("no_ticket_data")} /> : null}
        {ticket ? (
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy">{t("journey_detail")}</h2>
              <StatusBadge status={ticket.status} />
            </div>
            <DetailRow label={t("ticket_no")} value={ticket.ticketNo} />
            <DetailRow label={t("passenger")} value={ticket.passenger} />
            <DetailRow label={t("phone")} value={ticket.booking?.phoneNumber} />
            <DetailRow label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
            <DetailRow label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
            <DetailRow label={t("seat")} value={ticket.seat} />
            <DetailRow label={t("price")} value={formatMoney(ticket.booking?.price || route?.price)} />
            <Field label={t("cancellation_reason")} required>
              <Textarea
                placeholder={t("cancellation_reason_placeholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
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
