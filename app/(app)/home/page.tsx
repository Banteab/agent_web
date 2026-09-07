"use client";

import { CityPicker } from "@/components/city-picker";
import { Button, Card, EmptyState, Input, PageHeader, SectionLabel } from "@/components/ui";
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

  return (
    <div>
      <PageHeader title={t("new_booking")} subtitle={t("new_booking_subtitle")} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="space-y-4">
          <SectionLabel>{t("journey_detail")}</SectionLabel>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPicker("from")}
              className="flex w-full items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-left transition hover:border-primary/50"
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
              className="flex w-full items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-left transition hover:border-primary/50"
            >
              <PinIcon />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{t("going_to")}</p>
                <p className={to ? "truncate font-semibold text-navy" : "truncate text-text-faint"}>
                  {to ? to.sys : t("going_to")}
                </p>
              </div>
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium text-text-muted">{t("departure")}</span>
            <Input
              type="date"
              value={date}
              min={formatDateISO(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="block text-xs text-text-faint">{formatDisplayDate(new Date(date))}</span>
          </label>

          <Button className="w-full" loading={loading} onClick={search}>
            {t("search_bus")}
          </Button>
        </Card>

        <div>
          <SectionLabel>{t("recent_searches")}</SectionLabel>
          <div className="mt-2">
            {recents.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {recents.slice(0, 6).map((item) => (
                  <button
                    key={`${item.from.sys}-${item.to.sys}`}
                    className="rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm transition hover:border-primary/50 hover:bg-surface-muted"
                    onClick={() => {
                      setFrom(normalizeCity(item.from));
                      setTo(normalizeCity(item.to));
                    }}
                  >
                    <span className="font-semibold text-navy">{item.from.sys}</span>
                    <span className="mx-2 text-text-faint">→</span>
                    <span className="font-semibold text-navy">{item.to.sys}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title={t("no_recent_searches")} hint={t("no_recent_searches_hint")} />
            )}
          </div>
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
