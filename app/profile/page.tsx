"use client";

import { Protected } from "@/components/protected";
import { Button, Card, DetailRow, PageHeader, Spinner, StatCard } from "@/components/ui";
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
              <StatCard label={t("birr")} value={formatMoney(profile.balance)} tone="primary" />
              <StatCard label="Commission" value={formatMoney(profile.commision)} tone="gold" />
              <StatCard label={t("booked")} value={profile.booked ?? 0} />
              <StatCard label={t("cancelled")} value={profile.cancelled ?? 0} />
              <StatCard label={t("total")} value={profile.total ?? 0} />
              <StatCard label={t("total")} value={formatMoney(profile.totalMade)} tone="primary" />
            </div>
            <DetailRow label={t("email")} value={profile.email} />
            <DetailRow label={t("address_detail")} value={profile.address} />
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
