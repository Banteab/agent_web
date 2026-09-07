"use client";

import { Protected } from "@/components/protected";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { TicketListItem } from "@/lib/types";
import { parseSelectedRoute } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookedPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getBookedTickets()
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [t, toast]);

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("booked")} backHref="/menu" />
        {loading ? <Spinner /> : null}
        {!loading && !tickets.length ? <EmptyState title={t("no_ticket_data")} /> : null}
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const route = ticket.booking?.parseSelectedRoute || parseSelectedRoute(ticket.booking?.selectedRoute);
            return (
              <button
                key={ticket.id}
                className="block w-full text-left"
                onClick={() => {
                  sessionStorage.setItem("ticketDetail", JSON.stringify(ticket));
                  router.push("/booked/detail");
                }}
              >
                <Card>
                  <p className="font-bold text-navy">{ticket.ticketNo}</p>
                  <p className="text-sm text-slate-500">{ticket.passenger}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {route?.from || ticket.booking?.trip?.from} → {route?.to || ticket.booking?.trip?.to}
                  </p>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </Protected>
  );
}
