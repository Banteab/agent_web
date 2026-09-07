"use client";

import { BrandLogo } from "@/components/brand-logo";
import { Protected } from "@/components/protected";
import { Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("about_liubus")} backHref="/menu" />
        <BrandLogo className="mx-auto mb-4 block" imgClassName="h-32" />
        <Card className="space-y-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-navy">{t("about_us")}</p>
          <p>
            Engida Travel Technology is building Africa’s next-generation travel infrastructure —
            powerful digital platforms that make travel smart, simple, and accessible for everyone.
            We are the technology company behind some of Ethiopia’s leading travel solutions, trusted
            by millions of travelers and major transport operators nationwide.
          </p>
          <p className="font-semibold text-navy">Our Vision</p>
          <p>
            To build Africa’s leading travel ecosystem by delivering smart, scalable, and secure
            digital solutions that empower travelers and modernize transportation across the continent.
          </p>
          <p className="font-semibold text-navy">{t("contact")}</p>
          <p>{t("location_public_bus")}</p>
          <p>{t("tel")}: 9439</p>
          <a
            href="https://www.facebook.com/112600186927437/posts/addis-abeba-fm-bus-transport-office"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-primary"
          >
            <img src="/images/facebook-logo.png" alt="" className="h-5 w-5" />
            Facebook
          </a>
        </Card>
      </div>
    </Protected>
  );
}
