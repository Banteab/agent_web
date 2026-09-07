"use client";

import { Button, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { City } from "@/lib/types";
import { useMemo, useState } from "react";

export function CityPicker({
  open,
  cities,
  onClose,
  onSelect,
  recents,
}: {
  open: boolean;
  cities: City[];
  recents?: City[];
  onClose: () => void;
  onSelect: (city: City) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => {
      const translated = t(city.name);
      return (
        city.sys.toLowerCase().includes(q) ||
        city.name.toLowerCase().includes(q) ||
        translated.toLowerCase().includes(q)
      );
    });
  }, [cities, query, t]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4">
      <div className="flex h-[92dvh] w-full max-w-lg animate-[modalIn_180ms_ease-out] flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:h-[min(88dvh,720px)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-text">{t("search_city")}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
        <div className="px-5 py-3">
          <Input
            autoFocus
            placeholder={t("search_item")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
          {!query && recents?.length ? (
            <div className="px-3 pb-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">
                {t("recent_searches")}
              </p>
              {recents.map((city, index) => (
                <button
                  key={`recent-${city.sys}-${index}`}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-surface-muted"
                  onClick={() => onSelect(city)}
                >
                  <span className="font-medium text-navy">{t(city.name)}</span>
                  <span className="text-xs text-text-faint">{city.sys}</span>
                </button>
              ))}
            </div>
          ) : null}
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">
            {t("all_cities")} · {filtered.length}
          </p>
          {filtered.map((city, index) => (
            <button
              key={`${city.sys}-${index}`}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-surface-muted"
              onClick={() => onSelect(city)}
            >
              <span className="font-medium text-navy">{t(city.name)}</span>
              <span className="text-xs text-text-faint">{city.sys}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
