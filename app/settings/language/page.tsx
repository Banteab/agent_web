"use client";

import { Protected } from "@/components/protected";
import { Card, PageHeader } from "@/components/ui";
import { LOCALES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LanguagePage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("language")} backHref="/settings" />
        <Card className="divide-y divide-border p-0">
          {LOCALES.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex w-full items-center justify-between px-5 py-4 text-left",
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
        </Card>
      </div>
    </Protected>
  );
}
