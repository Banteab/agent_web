"use client";

import { Countdown } from "@/components/countdown";
import { Protected } from "@/components/protected";
import { Button, Card, Input, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  addPendingBankPayment,
  clearBookingSession,
  getBookingSession,
  setBookingSession,
} from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { formatMoney, parsePassengerNames } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const options = ["CASH", "REFERENCE", "BANK"] as const;

export default function PaymentPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<(typeof options)[number]>("CASH");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const session = getBookingSession();

  useEffect(() => {
    const current = getBookingSession();
    if (!current?.bookingId) {
      router.replace("/home");
      return;
    }
    Promise.all([api.getBooking(current.bookingId), refreshProfile()])
      .then(([data]) => setBooking(data))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [refreshProfile, router, t, toast]);

  const passengers = parsePassengerNames(booking?.passengers || session?.passengers);
  const price = (booking?.price || session?.trip?.price || 0) * Math.max(passengers.length, 1);
  const commission = profile?.commision || 0;
  const total = Math.max(0, price - commission);

  async function submit() {
    const current = getBookingSession();
    if (!current?.bookingId) return;
    if (method === "REFERENCE" && !reference.trim()) {
      toast.error(t("ref_no"));
      return;
    }
    setSaving(true);
    try {
      const res = await api.updatePayment(current.bookingId, method, reference.trim());
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      setBookingSession(current);
      if (method === "BANK") {
        addPendingBankPayment({
          bookingId: current.bookingId,
          fromCity: current.fromCity,
          toCity: current.toCity,
          phoneNumber: current.phoneNumber || booking?.phoneNumber,
          passengers: current.passengers || booking?.passengers,
          price: total,
          travelDate: current.isoDate || booking?.trip?.travelDate,
        });
        toast.success(res.message || t("booking_added"));
        clearBookingSession();
        router.replace("/home");
        return;
      }
      router.push("/book/reservation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader
          title={t("how_to_pay")}
          backHref="/book/passengers"
          action={<Countdown endTime={session?.endTime} />}
        />
        <Card className="mb-4 space-y-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm font-semibold text-navy">
              <input
                type="radio"
                name="pay"
                checked={method === option}
                onChange={() => setMethod(option)}
              />
              {option === "CASH" ? t("cash") : option === "REFERENCE" ? t("ref") : t("bank")}
            </label>
          ))}
          {method === "REFERENCE" ? (
            <Input placeholder={t("ref_no")} value={reference} onChange={(e) => setReference(e.target.value)} />
          ) : null}
        </Card>

        <Card className="space-y-2 text-sm">
          <h2 className="font-bold text-navy">{t("travel_summery")}</h2>
          <Row label={t("from")} value={session?.fromCity} />
          <Row label={t("to")} value={session?.toCity} />
          <Row label={t("phone")} value={session?.phoneNumber || booking?.phoneNumber} />
          <Row label={t("pickup")} value={session?.pickup || booking?.pickup} />
          <Row label={t("dropoff")} value={session?.dropoff || booking?.dropoff} />
          <Row label={t("passengers")} value={passengers.join(", ")} />
          <Row label={t("price")} value={formatMoney(price)} />
          <Row label="Commission" value={formatMoney(commission)} />
          <Row label={t("total")} value={formatMoney(total)} />
        </Card>

        <Button className="mt-4 w-full" loading={saving} onClick={submit}>
          {t("next")}
        </Button>
      </div>
    </Protected>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-navy">{value || "-"}</span>
    </div>
  );
}
