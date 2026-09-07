"use client";

import { Protected } from "@/components/protected";
import { Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

const steps = ["step1", "step1.1", "step1.2", "step2", "step3", "step3.1", "step4", "step4.1", "step5", "step5.1", "step5.2", "step6", "step6.2"];

export default function HelpPage() {
  const { t } = useI18n();

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("help")} backHref="/menu" />
        <Card className="space-y-3">
          <h2 className="font-bold text-navy">{t("steps")}</h2>
          {steps.map((step) => (
            <p key={step} className="text-sm text-slate-600">
              {t(step)}
            </p>
          ))}
          <p className="pt-2 text-sm font-semibold text-primary">{t("call_us")}: 9439</p>
        </Card>
      </div>
    </Protected>
  );
}
