"use client";

import { Button, Card, EmptyState, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Ticket } from "@/lib/types";
import { parseSelectedRoute } from "@/lib/utils";
import { useState } from "react";

export default function CheckerPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [ticketNo, setTicketNo] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  async function search() {
    if (!ticketNo.trim()) {
      toast.error(t("can_not_be_empty"));
      return;
    }
    setLoading(true);
    try {
      const data = await api.getTicketByNumber(ticketNo.trim());
      setTicket(data);
    } catch (err) {
      setTicket(null);
      toast.error(err instanceof Error ? err.message : t("no_ticket_data"));
    } finally {
      setLoading(false);
    }
  }

  async function activate() {
    if (!ticket?.id) return;
    setActivating(true);
    try {
      const res = await api.activateTicket(ticket.id);
      toast.success(res.message || t("active"));
      await search();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setActivating(false);
    }
  }

  const route = ticket?.booking?.parseSelectedRoute || parseSelectedRoute(ticket?.booking?.selectedRoute);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-navy">{t("checker")}</h2>
        <Input placeholder={t("tikect_number")} value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} />
        <Button className="w-full" loading={loading} onClick={search}>
          {t("search")}
        </Button>
      </Card>

      {loading ? <Spinner /> : null}
      {!loading && ticket ? (
        <Card className="space-y-3">
          <h3 className="font-bold text-navy">{t("journey_detail")}</h3>
          <Row label={t("ticket_no")} value={ticket.ticketNo} />
          <Row label={t("passenger")} value={ticket.passenger} />
          <Row label={t("phone")} value={ticket.booking?.phoneNumber} />
          <Row label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
          <Row label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
          <Row label={t("seat")} value={ticket.seat} />
          <Row label={t("travel_date")} value={ticket.booking?.trip?.travelDate?.slice(0, 10)} />
          <Row label={t("status")} value={ticket.status} />
          <Button className="w-full" loading={activating} onClick={activate}>
            {t("active")}
          </Button>
        </Card>
      ) : null}
      {!loading && ticketNo && !ticket ? <EmptyState title={t("no_ticket_data")} /> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-navy">{value || "-"}</span>
    </div>
  );
}
