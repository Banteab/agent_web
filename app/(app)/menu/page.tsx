"use client";

import { Card, EmptyState, PageHeader, SectionLabel, Spinner, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { usePendingBankPaymentsCount } from "@/lib/use-pending-bank-payments-count";
import { useToast } from "@/lib/toast-context";
import type { TicketListItem } from "@/lib/types";
import { formatDateISO, formatMoney, parseSelectedRoute } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

const quickLinks = [
  { href: "/pending-payments", key: "pending_payments", icon: PendingIcon },
  { href: "/reports/sales", key: "sales_report", icon: ReportIcon },
  { href: "/booked", key: "booked", icon: TicketIcon },
  { href: "/cancelled", key: "cancelled", icon: XCircleIcon },
  { href: "/reports", key: "report", icon: FolderIcon },
  { href: "/profile", key: "profile", icon: ProfileIcon },
  { href: "/help", key: "help", icon: HelpIcon },
  { href: "/about", key: "about", icon: InfoIcon },
];

export default function MenuPage() {
  const { t } = useI18n();
  const toast = useToast();
  const { profile } = useAuth();
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
          <SectionLabel>{t("quick_links")}</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-surface-muted"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t(item.key)}</span>
                  <span className="text-text-faint">›</span>
                </Link>
              );
            })}
          </div>
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
function XCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m9.5 9.5 5 5m0-5-5 5" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
      <path d="M12 17h.01" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
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
