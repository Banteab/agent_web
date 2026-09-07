"use client";

import { CityPicker } from "@/components/city-picker";
import { SupportIllustration } from "@/components/support-illustration";
import { Button, EmptyState, SectionLabel } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cityApiName, citiesFromApi, FALLBACK_CITIES, mergeCities, normalizeCity } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import { formatEthiopianDate } from "@/lib/ethiopian-calendar";
import { addRecentHistory, parseRecentHistory, setBookingSession } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { City } from "@/lib/types";
import { usePendingBankPaymentsCount } from "@/lib/use-pending-bank-payments-count";
import { formatDateISO, formatDisplayDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function greetingKey(hour: number) {
  if (hour < 12) return "greeting_morning";
  if (hour < 17) return "greeting_afternoon";
  return "greeting_evening";
}

export default function HomeSearchPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const { profile } = useAuth();
  const pendingCount = usePendingBankPaymentsCount();
  const [from, setFrom] = useState<City | null>(null);
  const [to, setTo] = useState<City | null>(null);
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>(FALLBACK_CITIES);
  const [recents, setRecents] = useState<{ from: City; to: City }[]>([]);

  useEffect(() => {
    setRecents(parseRecentHistory());
    api
      .getCityNames()
      .then((names) => setCities(mergeCities(citiesFromApi(names), FALLBACK_CITIES)))
      .catch(() => setCities(FALLBACK_CITIES));
  }, []);

  function search() {
    if (!from || !to) {
      toast.error(t("cities_empty_message"));
      return;
    }
    const origin = normalizeCity(from);
    const destination = normalizeCity(to);
    addRecentHistory(origin, destination);
    setRecents(parseRecentHistory());
    const fromName = cityApiName(origin);
    const toName = cityApiName(destination);
    setBookingSession({
      fromCity: fromName,
      toCity: toName,
      visualDate: formatDisplayDate(new Date(date), locale),
      isoDate: date,
      selectedSeats: [],
    });
    setLoading(true);
    router.push(`/trips/available?from=${encodeURIComponent(fromName)}&to=${encodeURIComponent(toName)}&date=${date}`);
  }

  function searchRoute(routeFrom: City, routeTo: City) {
    setFrom(normalizeCity(routeFrom));
    setTo(normalizeCity(routeTo));
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-10 sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-gold/10 blur-3xl"
          aria-hidden
        />
        {/* Decorative route line — a small bus travels across the hero */}
        <div className="pointer-events-none absolute inset-x-10 bottom-16 hidden sm:block" aria-hidden>
          <div className="relative h-px border-t border-dashed border-white/15">
            <span className="absolute -top-[9px] left-0 -translate-x-1/2 text-gold/70 animate-[driveAcross_10s_linear_infinite]">
              <BusGlyphIcon />
            </span>
          </div>
        </div>
        <div className="relative flex items-center justify-between gap-6">
          <div className="max-w-xl animate-[riseIn_450ms_ease-out]">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                {t(greetingKey(new Date().getHours()))}
                {profile?.firstName ? `, ${profile.firstName}` : ""}
              </p>
              {pendingCount > 0 ? (
                <Link
                  href="/pending-payments"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold transition hover:bg-gold/25"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                  </span>
                  {pendingCount} {t("pending_payments")}
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-3xl font-bold leading-snug tracking-tight text-white sm:text-4xl">
              {t("new_booking_hero_title")}
            </p>
            <p className="mt-2 text-sm text-white/70 sm:text-base">{t("new_booking_hero_subtitle")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <TrustBadge icon={<SeatMapIcon />} label={t("feature_live_seats")} />
              <TrustBadge icon={<ShieldIcon />} label={t("feature_secure_payments")} />
              <TrustBadge icon={<BoltIcon />} label={t("feature_instant_tickets")} />
            </div>
          </div>
          <SupportIllustration className="hidden h-40 w-40 shrink-0 animate-[floatY_6s_ease-in-out_infinite] xl:block" />
        </div>
      </div>

      {/* Elevated search widget */}
      <div className="relative z-10 -mt-8 animate-[riseIn_500ms_ease-out] rounded-2xl border border-border bg-surface p-3 shadow-lg shadow-navy/5 sm:-mt-9 sm:p-4">
        <div className="flex flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
          <div className="relative flex flex-1 items-stretch">
            <button
              type="button"
              onClick={() => setPicker("from")}
              className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-surface-muted"
            >
              <LocationIcon />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{t("leaving_from")}</p>
                <p className={from ? "truncate font-semibold text-navy" : "truncate text-text-faint"}>
                  {from ? from.sys : t("leaving_from")}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={swap}
              aria-label={t("swap_route")}
              title={t("swap_route")}
              className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm transition hover:border-primary/40 hover:text-primary lg:flex"
            >
              <SwapIcon />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPicker("to")}
            className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-surface-muted"
          >
            <PinIcon />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{t("going_to")}</p>
              <p className={to ? "truncate font-semibold text-navy" : "truncate text-text-faint"}>
                {to ? to.sys : t("going_to")}
              </p>
            </div>
          </button>
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-surface-muted">
            <CalendarIcon />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{t("departure")}</p>
              <input
                type="date"
                value={date}
                min={formatDateISO(new Date())}
                onChange={(e) => setDate(e.target.value)}
                className="w-full truncate border-none bg-transparent p-0 font-semibold text-navy outline-none [color-scheme:light]"
              />
              {locale?.startsWith("am") && (
                <p className="truncate text-[11px] text-text-faint">{formatEthiopianDate(new Date(date))}</p>
              )}
            </div>
          </label>
          <div className="flex items-center p-1.5 lg:pl-3">
            <Button className="w-full shadow-md shadow-primary/20 lg:w-auto" loading={loading} onClick={search}>
              <SearchIcon />
              {t("search_bus")}
            </Button>
          </div>
        </div>
      </div>

      {/* Popular / recent routes */}
      <div className="mt-8">
        <SectionLabel>{t("popular_routes")}</SectionLabel>
        <div className="mt-3">
          {recents.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recents.slice(0, 6).map((item) => (
                <button
                  key={`${item.from.sys}-${item.to.sys}`}
                  onClick={() => searchRoute(item.from, item.to)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-white">
                    <RouteIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{item.from.sys}</p>
                    <p className="truncate text-xs text-text-faint">→ {item.to.sys}</p>
                  </div>
                  <ChevronIcon className="shrink-0 text-text-faint transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title={t("no_recent_searches")} hint={t("no_recent_searches_hint")} />
          )}
        </div>
      </div>

      {/* Why agents choose this platform */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <FeatureCard icon={<SeatMapIcon />} title={t("feature_live_seats")} caption={t("feature_live_seats_caption")} />
        <FeatureCard
          icon={<ShieldIcon />}
          title={t("feature_secure_payments")}
          caption={t("feature_secure_payments_caption")}
        />
        <FeatureCard
          icon={<BoltIcon />}
          title={t("feature_instant_tickets")}
          caption={t("feature_instant_tickets_caption")}
        />
      </div>

      <CityPicker
        open={picker !== null}
        cities={cities}
        recents={recents.map((item) => (picker === "from" ? item.from : item.to))}
        onClose={() => setPicker(null)}
        onSelect={(city) => {
          const next = normalizeCity(city);
          if (picker === "from") setFrom(next);
          if (picker === "to") setTo(next);
          setPicker(null);
        }}
      />
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
      <span className="text-gold">{icon}</span>
      {label}
    </span>
  );
}

function FeatureCard({ icon, title, caption }: { icon: React.ReactNode; title: string; caption: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="mt-0.5 text-xs text-text-faint">{caption}</p>
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gold">
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 7c3 0 2 6 5 6M13 13c1.5 0 2-1 3.5-1" />
    </svg>
  );
}
function BusGlyphIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="5" width="18" height="11" rx="3" />
      <rect x="5.5" y="7.5" width="5" height="4" rx="0.75" fill="#0a1730" />
      <rect x="13.5" y="7.5" width="5" height="4" rx="0.75" fill="#0a1730" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M7 4v13M7 17 3.5 13.5M7 17l3.5-3.5" />
      <path d="M17 20V7M17 7l3.5 3.5M17 7l-3.5 3.5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
function SeatMapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}
