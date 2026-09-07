"use client";

import { BrandLogo } from "@/components/brand-logo";
import { CityPicker } from "@/components/city-picker";
import { Button, Card } from "@/components/ui";
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
      <div className="-mx-3 -mt-4 mb-6 rounded-b-[2rem] bg-primary px-4 pb-16 pt-4 sm:-mx-4">
        <BrandLogo onDark className="mx-auto" imgClassName="h-24 sm:h-28" />
      </div>

      <Card className="-mt-16 space-y-4">
        <button
          type="button"
          onClick={() => setPicker("from")}
          className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left"
        >
          <span className="text-gold">➤</span>
          <span className={from ? "font-semibold text-navy" : "text-slate-500"}>
            {from ? from.sys : t("leaving_from")}
          </span>
        </button>
        <hr className="border-slate-200" />
        <button
          type="button"
          onClick={() => setPicker("to")}
          className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left"
        >
          <span className="text-gold">📍</span>
          <span className={to ? "font-semibold text-navy" : "text-slate-500"}>
            {to ? to.sys : t("going_to")}
          </span>
        </button>
        <hr className="border-slate-200" />
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-slate-500">{t("departure")}</span>
          <input
            type="date"
            value={date}
            min={formatDateISO(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-slate-50 px-3 py-2 text-navy outline-none"
          />
        </label>
        <p className="text-sm text-slate-500">{formatDisplayDate(new Date(date))}</p>
        <Button className="w-full" loading={loading} onClick={search}>
          {t("search_bus")}
        </Button>
      </Card>

      {recents.length ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">{t("recent_searches")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recents.slice(0, 6).map((item) => (
              <button
                key={`${item.from.sys}-${item.to.sys}`}
                className="rounded-xl bg-white px-4 py-3 text-left text-sm shadow-sm ring-1 ring-slate-100"
                onClick={() => {
                  setFrom(normalizeCity(item.from));
                  setTo(normalizeCity(item.to));
                }}
              >
                <span className="font-semibold text-navy">{item.from.sys}</span>
                <span className="mx-2 text-gold">→</span>
                <span className="font-semibold text-navy">{item.to.sys}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
