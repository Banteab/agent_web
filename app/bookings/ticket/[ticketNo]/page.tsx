"use client";

import { BookingDetailPanel } from "@/components/booking-detail-panel";
import { EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Ticket } from "@/lib/types";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function TicketDetailPage() {
  const { t } = useI18n();
  const toast = useToast();
  const params = useParams<{ ticketNo: string }>();
  const ticketNo = decodeURIComponent(params.ticketNo);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getTicketByNumber(ticketNo)
      .then(setTicket)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : t("no_ticket_data"));
        setTicket(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketNo]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (!ticket) return <EmptyState title={t("no_ticket_data")} />;

  return <BookingDetailPanel mode="ticket" ticket={ticket} onRefresh={load} />;
}
