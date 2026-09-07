"use client";

import { Protected } from "@/components/protected";
import { Card, DetailRow, PageHeader, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getCancellationReason } from "@/lib/storage";
import type { TicketListItem } from "@/lib/types";
import { formatMoney, parseSelectedRoute } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CancelledDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketListItem | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("ticketDetail");
    if (!raw) {
      router.replace("/cancelled");
      return;
    }
    setTicket(JSON.parse(raw) as TicketListItem);
  }, [router]);

  if (!ticket) return null;
  const route = ticket.booking?.parseSelectedRoute || parseSelectedRoute(ticket.booking?.selectedRoute);
  const reason = getCancellationReason(ticket.id);

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("cancelled")} backHref="/cancelled" action={<StatusBadge status={ticket.status} />} />
        <Card className="space-y-3 text-sm">
          <DetailRow label={t("ticket_no")} value={ticket.ticketNo} />
          <DetailRow label={t("passenger")} value={ticket.passenger} />
          <DetailRow label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
          <DetailRow label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
          <DetailRow label={t("seat")} value={ticket.seat} />
          <DetailRow label={t("price")} value={formatMoney(ticket.booking?.trip?.price || route?.price)} />
          {reason ? <DetailRow label={t("cancellation_reason")} value={reason} /> : null}
        </Card>
      </div>
    </Protected>
  );
}
