"use client";

import { ListLoadMore } from "@/components/list-load-more";
import { Protected } from "@/components/protected";
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { usePaginatedApiList } from "@/lib/use-paginated-api-list";
import type { TicketListItem } from "@/lib/types";
import { parseSelectedRoute } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function BookedPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();

  const fetchPage = useCallback(
    (page: number, limit: number) => api.getBookedTickets(page, limit),
    [],
  );

  const { items: tickets, total, loading, loadingMore, hasMore, error, loadMore } =
    usePaginatedApiList<TicketListItem>(fetchPage);

  useEffect(() => {
    if (error) {
      toast.error(error.message || t("error_occured"));
    }
  }, [error, t, toast]);

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
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
                <Card className="flex items-center justify-between gap-3 transition hover:ring-primary/30">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{ticket.ticketNo}</p>
                    <p className="truncate text-sm text-text-muted">{ticket.passenger}</p>
                    <p className="mt-1 truncate text-sm text-text-muted">
                      {route?.from || ticket.booking?.trip?.from} → {route?.to || ticket.booking?.trip?.to}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <span className="text-text-faint">›</span>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
        {!loading ? (
          <ListLoadMore
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            shown={tickets.length}
            total={total}
          />
        ) : null}
      </div>
    </Protected>
  );
}
