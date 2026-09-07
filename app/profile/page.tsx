"use client";

import { Protected } from "@/components/protected";
import { Button, Card, PageHeader, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { useEffect } from "react";

export default function ProfilePage() {
  const { t } = useI18n();
  const { profile, refreshProfile, logout } = useAuth();

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("profile")} backHref="/menu" />
        {!profile ? <Spinner /> : (
          <Card className="space-y-4">
            <div className="flex items-center gap-4">
              <img src="/images/user.png" alt="" className="h-16 w-16 rounded-full bg-azure object-cover" />
              <div>
                <p className="text-xl font-bold text-navy">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-sm text-slate-500">{profile.phoneNo}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label={t("birr")} value={formatMoney(profile.balance)} />
              <Stat label="Commission" value={formatMoney(profile.commision)} />
              <Stat label={t("booked")} value={profile.booked} />
              <Stat label={t("cancelled")} value={profile.cancelled} />
              <Stat label={t("total")} value={profile.total} />
              <Stat label={t("total")} value={formatMoney(profile.totalMade)} />
            </div>
            <Row label={t("email")} value={profile.email} />
            <Row label={t("address_detail")} value={profile.address} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/profile/password" className="flex-1">
                <Button className="w-full">{t("change_password")}</Button>
              </Link>
              <Link href="/profile/top-up" className="flex-1">
                <Button variant="secondary" className="w-full">Top up</Button>
              </Link>
              <Button variant="danger" className="flex-1" onClick={logout}>
                Logout
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Protected>
  );
}

function Stat({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl bg-azure/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-navy">{value ?? 0}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="text-sm">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold text-navy">{value || "-"}</p>
    </div>
  );
}
