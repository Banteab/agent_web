"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Profile = { firstName?: string; lastName?: string; phoneNo?: string } | null;

/**
 * The sidebar redesign moved Profile/Settings/Help/About/Logout out of the
 * nav list into this single header dropdown, so the primary sidebar can stay
 * to just the handful of things an agent actually does all day.
 */
export function AccountMenu({
  profile,
  t,
  onLogout,
  trigger,
}: {
  profile: Profile;
  t: (key: string) => string;
  onLogout: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const name = profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || t("profile") : t("profile");

  const items: { href: string; label: string; icon: (props: { className?: string }) => React.ReactNode }[] = [
    { href: "/profile", label: t("profile"), icon: ProfileIcon },
    { href: "/reports", label: t("report"), icon: ReportIcon },
    { href: "/reports/sales", label: t("sales_report"), icon: ReportIcon },
    { href: "/settings", label: t("setting"), icon: SettingsIcon },
    { href: "/about", label: t("about"), icon: InfoIcon },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={t("account_menu")} aria-expanded={open}>
        {trigger}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 animate-[fadeIn_120ms_ease-out] rounded-xl border border-border bg-surface py-1.5 shadow-lg">
          <div className="border-b border-border px-3.5 py-2.5">
            <p className="truncate text-[13px] font-semibold text-text">{name}</p>
            <p className="truncate text-[11px] text-text-faint">{profile?.phoneNo || ""}</p>
          </div>
          <div className="py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-text transition hover:bg-surface-muted"
              >
                <item.icon className="h-4 w-4 text-text-faint" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium text-danger transition hover:bg-danger-soft",
              )}
            >
              <LogoutIcon className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7 1 1.2 1.7 1.2H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  );
}
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
