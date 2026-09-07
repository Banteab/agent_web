"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { usePendingBankPaymentsCount } from "@/lib/use-pending-bank-payments-count";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { Protected } from "./protected";

type NavItem = { href: string; key: string; icon: (props: { className?: string }) => React.ReactNode; badge?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "workspace",
    items: [
      { href: "/home", key: "new_booking", icon: HomeIcon },
      { href: "/menu", key: "dashboard", icon: DashboardIcon },
      { href: "/trips", key: "trip", icon: BusIcon },
      { href: "/pending-payments", key: "pending_payments", icon: PendingPaymentIcon, badge: true },
      { href: "/cancel", key: "cancel", icon: CancelIcon },
      { href: "/checker", key: "checker", icon: CheckIcon },
    ],
  },
  {
    label: "reports_and_account",
    items: [
      { href: "/reports/sales", key: "sales_report", icon: ReportIcon },
      { href: "/booked", key: "booked", icon: TicketIcon },
      { href: "/cancelled", key: "cancelled", icon: XCircleIcon },
      { href: "/reports", key: "report", icon: FolderIcon },
      { href: "/profile", key: "profile", icon: ProfileIcon },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { associationName, profile, logout } = useAuth();
  const pendingCount = usePendingBankPaymentsCount();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPathname, setDrawerPathname] = useState(pathname);
  const [collapsed, setCollapsed] = useState(false);

  if (pathname !== drawerPathname) {
    setDrawerPathname(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
      } catch {
        // ignore
      }
    });
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const initials =
    `${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.toUpperCase() || "AG";

  return (
    <Protected>
      <div className="min-h-dvh bg-page md:flex">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-150 md:flex",
            collapsed ? "w-[76px]" : "w-64",
          )}
        >
          <div className={cn("flex h-16 items-center gap-2.5 border-b border-border", collapsed ? "justify-center px-2" : "px-5")}>
            <BrandLogo compact imgClassName="h-8 w-8" />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">Biftu Bus</p>
                <p className="truncate text-[11px] text-text-faint">{associationName}</p>
              </div>
            ) : null}
          </div>
          <SidebarNav pathname={pathname} pendingCount={pendingCount} t={t} collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
            title={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
            className={cn(
              "mx-3 mb-2 flex h-9 items-center gap-2 rounded-lg text-text-faint transition hover:bg-surface-muted hover:text-text-muted",
              collapsed ? "justify-center px-0" : "justify-start px-3",
            )}
          >
            <CollapseIcon collapsed={collapsed} />
            {!collapsed ? <span className="text-[13px] font-medium">{t("collapse_sidebar")}</span> : null}
          </button>
          <SidebarFooter initials={initials} profile={profile} t={t} logout={logout} collapsed={collapsed} />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-navy/50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div className="relative flex h-full w-72 max-w-[82vw] animate-[drawerIn_180ms_ease-out] flex-col border-r border-border bg-surface shadow-xl">
              <div className="flex h-16 items-center justify-between gap-2.5 border-b border-border px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <BrandLogo compact imgClassName="h-8 w-8" />
                  <p className="truncate text-sm font-semibold text-navy">Biftu Bus</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-faint hover:bg-surface-muted"
                >
                  <CloseIcon />
                </button>
              </div>
              <SidebarNav pathname={pathname} pendingCount={pendingCount} t={t} />
              <SidebarFooter initials={initials} profile={profile} t={t} logout={logout} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top utility header */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 print:hidden sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted md:hidden"
            >
              <MenuIcon />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <BrandLogo compact imgClassName="h-7 w-7" />
              <span className="text-sm font-semibold text-navy">Biftu Bus</span>
            </div>
            <div className="flex-1" />
            <Link
              href="/pending-payments"
              className="relative hidden h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text sm:flex"
              aria-label={t("pending_payments")}
            >
              <PendingPaymentIcon />
              {pendingCount > 0 ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
              ) : null}
            </Link>
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text"
              aria-label={t("setting")}
            >
              <SettingsIcon />
            </Link>
            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
              aria-label={t("profile")}
            >
              {initials}
            </Link>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </Protected>
  );
}

function SidebarNav({
  pathname,
  pendingCount,
  t,
  collapsed = false,
}: {
  pathname: string;
  pendingCount: number;
  t: (key: string) => string;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed ? (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-text-faint">
              {t(group.label)}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? t(item.key) : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg py-2 text-[13.5px] font-medium transition",
                  collapsed ? "justify-center px-0" : "px-3",
                  active ? "bg-primary-soft text-primary" : "text-text-muted hover:bg-surface-muted hover:text-text",
                )}
              >
                {active ? <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" /> : null}
                <span className="relative shrink-0">
                  <Icon className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-text-faint group-hover:text-text-muted")} />
                  {collapsed && item.badge && pendingCount > 0 ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />
                  ) : null}
                </span>
                {!collapsed ? (
                  <>
                    <span className="flex-1 truncate">{t(item.key)}</span>
                    {item.badge && pendingCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({
  initials,
  profile,
  t,
  logout,
  collapsed = false,
}: {
  initials: string;
  profile: { firstName?: string; lastName?: string; phoneNo?: string } | null;
  t: (key: string) => string;
  logout: () => void;
  collapsed?: boolean;
}) {
  const name = profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || t("profile") : t("profile");

  if (collapsed) {
    return (
      <div className="border-t border-border p-3">
        <div className="flex flex-col items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
            title={name}
          >
            {initials}
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label={t("logout")}
            title={t("logout")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-danger-soft hover:text-danger"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-text">{name}</p>
          <p className="truncate text-[11px] text-text-faint">{profile?.phoneNo || ""}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label={t("logout")}
          title={t("logout")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-danger-soft hover:text-danger"
        >
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" />
    </svg>
  );
}
function BusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M6 17v2M18 17v2M4 11h16" />
    </svg>
  );
}
function PendingPaymentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M12 14.5v2M10.6 15.2h2.8a1 1 0 1 1 0 2h-2.1" />
    </svg>
  );
}
function CancelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}
function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 0 3v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1.5 1.5 0 0 0 0-3V8Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  );
}
function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5h.01M14.5 9.5h.01M8 15c1.2-1 2.6-1 4-1s2.8 0 4 1" />
    </svg>
  );
}
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
function CollapseIcon({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      {collapsed ? <path d="M13.5 9.5 16 12l-2.5 2.5" /> : <path d="M16.5 9.5 14 12l2.5 2.5" />}
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7 1 1.2 1.7 1.2H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
