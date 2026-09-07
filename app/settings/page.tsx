"use client";

import { Protected } from "@/components/protected";
import { Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function SettingsPage() {
  const { t, locale } = useI18n();

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("setting")} backHref="/menu" />
        <Card className="p-0">
          <Link
            href="/settings/language"
            className="flex items-center justify-between px-5 py-4 transition hover:bg-surface-muted"
          >
            <div>
              <p className="text-sm font-semibold text-navy">{t("language")}</p>
              <p className="text-xs text-text-muted">{t("languages")}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              {locale} <span className="text-text-faint">›</span>
            </span>
          </Link>
        </Card>
      </div>
    </Protected>
  );
}
