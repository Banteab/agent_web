"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { usePendingBankPaymentsCount } from "@/lib/use-pending-bank-payments-count";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AccountMenu } from "./account-menu";
import { BrandLogo } from "./brand-logo";
import { Protected } from "./protected";
import { SessionCountdown } from "./session-countdown";

type NavItem = { href: string; key: string; icon: (props: { className?: string }) => React.ReactNode; badge?: boolean };

// The redesign's target IA is 6 flat destinations, surfaced directly in the
// header nav — no sidebar, no grouping. Profile/Report/Sales
// Report/Settings/About/Logout live in the header account menu instead.
const NAV_ITEMS: NavItem[] = [
  { href: "/home", key: "new_booking", icon: HomeIcon },
  { href: "/bookings", key: "manage_bookings", icon: TicketIcon },
  { href: "/find-ticket", key: "find_ticket", icon: CheckIcon },
  { href: "/payments", key: "payments", icon: PendingPaymentIcon, badge: true },
  { href: "/bookings?status=cancelled", key: "requests", icon: XCircleIcon },
  { href: "/help", key: "help", icon: HelpIcon },
];

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { associationName, profile, logout } = useAuth();
  const pendingCount = usePendingBankPaymentsCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePathname, setMobilePathname] = useState(pathname);

  if (pathname !== mobilePathname) {
    setMobilePathname(pathname);
    setMobileOpen(false);
  }

  const initials = `${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.toUpperCase() || "AG";

  return (
    <Protected>
      <div className="min-h-dvh bg-page">
        <header className="sticky top-0 z-40 bg-surface/95 shadow-sm backdrop-blur-md print:hidden">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-1.5 px-4 sm:px-6">
            <Link href="/home" className="flex shrink-0 items-center gap-2.5">
              <BrandLogo compact imgClassName="h-8 w-8" />
              <span className="hidden leading-none sm:block">
                <span className="block text-sm font-semibold text-navy">Biftu Bus</span>
                <span className="block truncate text-[10px] text-text-faint">{associationName}</span>
              </span>
            </Link>

            <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} pendingCount={pendingCount} t={t} />
              ))}
            </nav>

            <div className="flex-1 lg:hidden" />

            <div className="hidden shrink-0 items-center sm:flex">
              <SessionCountdown />
            </div>

            <div className="flex items-center gap-1.5">
              <AccountMenu
                profile={profile}
                t={t}
                onLogout={logout}
                trigger={
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {initials}
                  </span>
                }
              />
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? t("close_menu") : t("open_menu")}
                aria-expanded={mobileOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted lg:hidden"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {mobileOpen ? (
            <nav className="origin-top animate-[dropIn_150ms_ease-out] border-t border-border bg-surface px-3 py-2 lg:hidden">
              <div className="mb-2 flex justify-center border-b border-border pb-2 sm:hidden">
                <SessionCountdown />
              </div>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  pendingCount={pendingCount}
                  t={t}
                  block
                />
              ))}
            </nav>
          ) : null}
        </header>

        <main className="min-w-0 px-4 py-6 sm:px-6 sm:py-8">
          <div key={pathname} className="mx-auto max-w-6xl animate-[riseIn_320ms_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </Protected>
  );
}

function NavLink({
  item,
  active,
  pendingCount,
  t,
  block = false,
}: {
  item: NavItem;
  active: boolean;
  pendingCount: number;
  t: (key: string) => string;
  block?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2 rounded-lg text-[13.5px] font-medium transition",
        block ? "px-3 py-2.5" : "px-3 py-2",
        active ? "bg-primary-soft text-primary" : "text-text-muted hover:bg-surface-muted hover:text-text",
      )}
    >
      <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-primary" : "text-text-faint group-hover:text-text-muted")} />
      <span className={block ? "flex-1" : undefined}>{t(item.key)}</span>
      {item.badge && pendingCount > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      ) : null}
    </Link>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" />
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
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
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
function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
      <path d="M12 17h.01" />
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
