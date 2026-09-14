"use client";

import { Button, Card, DetailRow, EmptyState, Input, PageHeader, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Ticket } from "@/lib/types";
import { formatDisplayDateValue, parseSelectedRoute } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function FindTicketPage() {
  const { t, locale } = useI18n();
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
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("find_ticket")} subtitle={t("find_ticket_subtitle")} />
      <Card className="space-y-4">
        <Input placeholder={t("tikect_number")} value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} />
        <Button className="w-full" loading={loading} onClick={search}>
          {t("search")}
        </Button>
      </Card>

      {loading ? <Spinner /> : null}
      {!loading && ticket ? (
        <Card className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-navy">{t("journey_detail")}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <DetailRow label={t("ticket_no")} value={ticket.ticketNo} />
          <DetailRow label={t("passenger")} value={ticket.passenger} />
          <DetailRow label={t("phone")} value={ticket.booking?.phoneNumber} />
          <DetailRow label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
          <DetailRow label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
          <DetailRow label={t("seat")} value={ticket.seat} />
          <DetailRow label={t("travel_date")} value={formatDisplayDateValue(ticket.booking?.trip?.travelDate, locale)} />
          <Button className="w-full" loading={activating} onClick={activate}>
            {t("active")}
          </Button>
          {ticket.ticketNo ? (
            <Link
              href={`/bookings/ticket/${encodeURIComponent(ticket.ticketNo)}`}
              className="block w-full rounded-lg border border-border py-2 text-center text-sm font-semibold text-primary transition hover:bg-primary-soft"
            >
              {t("view_full_details")}
            </Link>
          ) : null}
        </Card>
      ) : null}
      {!loading && ticketNo && !ticket ? (
        <div className="mt-4">
          <EmptyState title={t("no_ticket_data")} />
        </div>
      ) : null}
    </div>
  );
}
