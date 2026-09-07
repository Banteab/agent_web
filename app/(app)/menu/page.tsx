"use client";

import { Card, DetailRow, EmptyState, PageHeader, SectionLabel, Spinner, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { usePendingBankPaymentsCount } from "@/lib/use-pending-bank-payments-count";
import { useToast } from "@/lib/toast-context";
import type { TicketListItem } from "@/lib/types";
import { formatDateISO, formatMoney, parseSelectedRoute } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MenuPage() {
  const { t } = useI18n();
  const toast = useToast();
  const { profile, associationName } = useAuth();
  const pendingCount = usePendingBankPaymentsCount();
  const [todayBookings, setTodayBookings] = useState<number | null>(null);
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null);
  const [recent, setRecent] = useState<TicketListItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const today = formatDateISO(new Date());
    api
      .getSalesReport(today, today)
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const routes = rows.flatMap((day) => day.routeSales || []);
        setTodayBookings(routes.reduce((sum, r) => sum + Number(r.totalTickets || 0), 0));
        setTodayRevenue(routes.reduce((sum, r) => sum + Number(r.ticketSales || 0), 0));
      })
      .catch(() => {
        setTodayBookings(0);
        setTodayRevenue(0);
      });

    api
      .getBookedTickets()
      .then((data) => setRecent(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoadingRecent(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title={t("dashboard")}
        subtitle={
          profile?.firstName ? `${t("welcome_back")}, ${profile.firstName}` : t("dashboard_subtitle")
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("todays_bookings")}
          value={todayBookings === null ? "-" : todayBookings}
          icon={<TicketIcon />}
          tone="primary"
        />
        <StatCard
          label={t("todays_revenue")}
          value={todayRevenue === null ? "-" : formatMoney(todayRevenue)}
          icon={<ReportIcon />}
          tone="gold"
        />
        <StatCard
          label={t("pending_payments")}
          value={pendingCount}
          icon={<PendingIcon />}
          tone={pendingCount > 0 ? "primary" : "neutral"}
        />
        <StatCard label={t("booked")} value={profile?.booked ?? 0} icon={<CheckCircleIcon />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <SectionLabel action={<Link href="/booked" className="text-xs font-semibold text-primary hover:underline">{t("view_all")}</Link>}>
            {t("recent_bookings")}
          </SectionLabel>
          <div className="mt-2">
            {loadingRecent ? <Spinner /> : null}
            {!loadingRecent && !recent.length ? <EmptyState title={t("no_ticket_data")} /> : null}
            {!loadingRecent && recent.length ? (
              <Card className="divide-y divide-border p-0">
                {recent.map((ticket) => {
                  const route = ticket.booking?.parseSelectedRoute || parseSelectedRoute(ticket.booking?.selectedRoute);
                  return (
                    <div key={ticket.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">{ticket.ticketNo}</p>
                        <p className="truncate text-xs text-text-muted">
                          {ticket.passenger} · {route?.from || ticket.booking?.trip?.from} →{" "}
                          {route?.to || ticket.booking?.trip?.to}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-primary">
                        {formatMoney(ticket.booking?.trip?.price || route?.price)}
                      </p>
                    </div>
                  );
                })}
              </Card>
            ) : null}
          </div>
        </div>

        <div>
          <SectionLabel>{t("account_summary")}</SectionLabel>
          <Card className="mt-2 space-y-1">
            <div className="mb-2 flex items-center gap-3 border-b border-border pb-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {`${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.toUpperCase() || "AG"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">
                  {`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || t("profile")}
                </p>
                <p className="truncate text-xs text-text-faint">{associationName}</p>
              </div>
            </div>
            <DetailRow label={t("balance")} value={formatMoney(profile?.balance)} />
            <DetailRow label={t("commission_rate")} value={formatMoney(profile?.commision)} />
            <DetailRow label={t("booked")} value={profile?.booked ?? 0} />
            <DetailRow label={t("cancelled")} value={profile?.cancelled ?? 0} />
            <Link
              href="/profile"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-primary transition hover:bg-primary-soft"
            >
              {t("view_profile")}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PendingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 0 3v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1.5 1.5 0 0 0 0-3V8Z" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}
