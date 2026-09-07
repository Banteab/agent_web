"use client";

import { Countdown } from "@/components/countdown";
import { Protected } from "@/components/protected";
import { Button, Card, DetailRow, Input, PageHeader, SectionLabel, Spinner } from "@/components/ui";
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
import { cn, formatMoney, parsePassengerNames } from "@/lib/utils";
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
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={t("how_to_pay")}
          backHref="/book/passengers"
          action={<Countdown endTime={session?.endTime} />}
        />
        <Card className="mb-4 space-y-3">
          <SectionLabel>{t("choose_option")}</SectionLabel>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map((option) => {
              const active = method === option;
              const label = option === "CASH" ? t("cash") : option === "REFERENCE" ? t("ref") : t("bank");
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:bg-surface-muted",
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full border-2",
                      active ? "border-primary bg-primary" : "border-border-strong",
                    )}
                  />
                  {label}
                </button>
              );
            })}
          </div>
          {method === "REFERENCE" ? (
            <Input placeholder={t("ref_no")} value={reference} onChange={(e) => setReference(e.target.value)} />
          ) : null}
        </Card>

        <Card className="space-y-2">
          <SectionLabel>{t("travel_summery")}</SectionLabel>
          <DetailRow label={t("from")} value={session?.fromCity} />
          <DetailRow label={t("to")} value={session?.toCity} />
          <DetailRow label={t("phone")} value={session?.phoneNumber || booking?.phoneNumber} />
          <DetailRow label={t("pickup")} value={session?.pickup || booking?.pickup} />
          <DetailRow label={t("dropoff")} value={session?.dropoff || booking?.dropoff} />
          <DetailRow label={t("passengers")} value={passengers.join(", ")} />
          <hr className="border-border" />
          <DetailRow label={t("price")} value={formatMoney(price)} strong={false} />
          <DetailRow label="Commission" value={formatMoney(commission)} strong={false} />
          <DetailRow label={t("total")} value={<span className="text-primary">{formatMoney(total)}</span>} />
        </Card>

        <Button className="mt-4 w-full" loading={saving} onClick={submit}>
          {t("next")}
        </Button>
      </div>
    </Protected>
  );
}
