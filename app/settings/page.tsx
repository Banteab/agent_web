"use client";

import { Protected } from "@/components/protected";
import { Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function SettingsPage() {
  const { t, locale } = useI18n();

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("setting")} backHref="/menu" />
        <Card className="divide-y divide-slate-100 p-0">
          <Link href="/settings/language" className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold text-navy">{t("language")}</p>
              <p className="text-sm text-slate-500">{t("languages")}</p>
            </div>
            <span className="text-gold">{locale} ›</span>
          </Link>
          <div className="px-5 py-4 text-sm text-slate-500">
            {t("languages")}
          </div>
        </Card>
      </div>
    </Protected>
  );
}
