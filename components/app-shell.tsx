"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { usePendingBankPaymentsCount } from "@/lib/use-pending-bank-payments-count";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { Protected } from "./protected";

const tabs = [
  { href: "/home", key: "home", icon: HomeIcon },
  { href: "/trips", key: "trip", icon: BusIcon },
  { href: "/pending-payments", key: "pending_payments", icon: PendingPaymentIcon, badge: true },
  { href: "/cancel", key: "cancel", icon: CancelIcon },
  { href: "/checker", key: "checker", icon: CheckIcon },
  { href: "/menu", key: "menu", icon: MenuIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { associationName } = useAuth();
  const pendingCount = usePendingBankPaymentsCount();

  return (
    <Protected>
      <div className="min-h-dvh bg-page">
        <header className="sticky top-0 z-30 bg-primary shadow-sm print:hidden">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
            <div className="w-10 md:w-24" />
            <BrandLogo onDark imgClassName="h-10" />
            <Link
              href="/settings"
              className="inline-flex h-10 items-center justify-center rounded-full px-2 text-gold transition hover:bg-white/10"
              aria-label={t("setting")}
            >
              <SettingsIcon />
            </Link>
          </div>
        </header>

        <div className="mx-auto flex max-w-6xl gap-6 px-3 py-4 sm:px-4 md:py-6">
          <aside className="sticky top-20 hidden h-fit w-60 shrink-0 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 md:block">
            <BrandLogo className="mb-3 px-2" imgClassName="h-16" />
            <p className="mb-3 truncate px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {associationName}
            </p>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      active ? "bg-primary text-white" : "text-navy hover:bg-azure",
                    )}
                  >
                    <Icon />
                    <span className="flex-1">{t(tab.key)}</span>
                    {tab.badge && pendingCount > 0 ? (
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                          active ? "bg-white text-primary" : "bg-rose-500 text-white",
                        )}
                      >
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 pb-24 md:pb-6">{children}</main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-primary-dark/20 bg-primary print:hidden md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-6">
            {tabs.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2 text-[10px] font-semibold",
                    active ? "text-white" : "text-gold",
                  )}
                >
                  <span className="relative">
                    <Icon />
                    {tab.badge && pendingCount > 0 ? (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{t(tab.key)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </Protected>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" />
    </svg>
  );
}
function BusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M6 17v2M18 17v2M4 11h16" />
    </svg>
  );
}
function PendingPaymentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M12 14.5v2M10.6 15.2h2.8a1 1 0 1 1 0 2h-2.1" />
    </svg>
  );
}
function CancelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7 1 1.2 1.7 1.2H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
