"use client";

import { CityPicker } from "@/components/city-picker";
import { SupportIllustration } from "@/components/support-illustration";
import { Button, EmptyState, SectionLabel } from "@/components/ui";
import { api } from "@/lib/api";
import { cityApiName, citiesFromApi, FALLBACK_CITIES, mergeCities, normalizeCity } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import { addRecentHistory, parseRecentHistory, setBookingSession } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { City } from "@/lib/types";
import { formatDateISO, formatDisplayDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomeSearchPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
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
      visualDate: formatDisplayDate(new Date(date)),
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
        <div className="relative flex items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
              {t("new_booking_hero_title")}
            </p>
            <p className="mt-2 text-sm text-white/70 sm:text-base">{t("new_booking_hero_subtitle")}</p>
          </div>
          <SupportIllustration className="hidden h-40 w-40 shrink-0 xl:block" />
        </div>
      </div>

      {/* Elevated search widget */}
      <div className="relative z-10 -mt-8 rounded-2xl border border-border bg-surface p-3 shadow-lg shadow-navy/5 sm:-mt-9 sm:p-4">
        <div className="flex flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
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
            </div>
          </label>
          <div className="flex items-center p-1.5 lg:pl-3">
            <Button className="w-full lg:w-auto" loading={loading} onClick={search}>
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
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary/40 hover:bg-surface-muted"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <RouteIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{item.from.sys}</p>
                    <p className="truncate text-xs text-text-faint">→ {item.to.sys}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title={t("no_recent_searches")} hint={t("no_recent_searches_hint")} />
          )}
        </div>
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
