"use client";

import { Protected } from "@/components/protected";
import { Button, Card, PageHeader, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReportsPage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const router = useRouter();
  const [type, setType] = useState("today");

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("report")} backHref="/menu" />
        <Card className="space-y-4">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="today">{t("today")}</option>
            <option value="week">{t("this_week")}</option>
            <option value="month">{t("this_month")}</option>
            {profile?.type === "SUPER" ? <option value="ofecho">Ofecho</option> : null}
          </Select>
          <Button
            className="w-full"
            onClick={() =>
              type === "ofecho" ? router.push("/reports/ofecho") : router.push(`/reports/detail?type=${type}`)
            }
          >
            {t("search")}
          </Button>
        </Card>
      </div>
    </Protected>
  );
}
