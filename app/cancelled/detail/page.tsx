"use client";

import { Protected } from "@/components/protected";
import { Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
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

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("cancelled")} backHref="/cancelled" />
        <Card className="space-y-3 text-sm">
          <Row label={t("ticket_no")} value={ticket.ticketNo} />
          <Row label={t("passenger")} value={ticket.passenger} />
          <Row label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
          <Row label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
          <Row label={t("seat")} value={ticket.seat} />
          <Row label={t("price")} value={formatMoney(ticket.booking?.trip?.price || route?.price)} />
          <Row label={t("status")} value={ticket.status} />
        </Card>
      </div>
    </Protected>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-navy">{value || "-"}</span>
    </div>
  );
}
