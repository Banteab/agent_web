"use client";

import { HEADER_LOCALES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  /** Full width row (mobile menu). */
  block?: boolean;
};

export function LanguageSwitcher({ className, block = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const current = HEADER_LOCALES.find((item) => item.id === locale) ?? HEADER_LOCALES[0];

  if (block) {
    return (
      <div className={cn("rounded-lg border border-border bg-surface-muted/50 p-3", className)}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">
          {t("language")}
        </p>
        <div className="grid grid-cols-1 gap-1 min-[420px]:grid-cols-2">
          {HEADER_LOCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLocale(item.id)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition",
                locale === item.id
                  ? "bg-primary-soft text-primary"
                  : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              {item.nativeLabel}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0", className)}>
      <label className="sr-only" htmlFor="header-language">
        {t("language")}
      </label>
      <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint">
        <GlobeIcon className="h-4 w-4" />
      </div>
      <select
        id="header-language"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        title={t("language")}
        className={cn(
          "h-9 max-w-[7.5rem] cursor-pointer appearance-none rounded-lg border border-border bg-surface pl-8 pr-7 text-[11px] font-semibold text-navy",
          "transition hover:bg-surface-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "md:h-9 md:max-w-[8.5rem] md:text-[12px] lg:max-w-[9.5rem] xl:text-[13px]",
        )}
      >
        {HEADER_LOCALES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nativeLabel}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-faint">
        ▾
      </span>
      <span className="sr-only">{current.nativeLabel}</span>
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}
