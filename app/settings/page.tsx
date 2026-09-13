"use client";

import { Protected } from "@/components/protected";
import { Card, PageHeader, SectionLabel } from "@/components/ui";
import { LOCALES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("setting")} backHref="/home" />
        <Card className="p-0">
          <div className="px-5 pt-4">
            <SectionLabel>{t("language")}</SectionLabel>
          </div>
          <div className="divide-y divide-border">
            {LOCALES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-surface-muted",
                  locale === item.id && "bg-azure",
                )}
                onClick={() => setLocale(item.id)}
              >
                <span className="font-semibold text-navy">
                  {item.flag} {item.label}
                </span>
                {locale === item.id ? <span className="text-primary">●</span> : null}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Protected>
  );
}
