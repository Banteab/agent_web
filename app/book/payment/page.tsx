"use client";

import { BookingStepper } from "@/components/booking-stepper";
import { Countdown } from "@/components/countdown";
import { Protected } from "@/components/protected";
import { Button, Card, DetailRow, Input, PageHeader, SectionLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CHECKOUT_BANKS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import {
  addPendingBankPayment,
  clearBookingSession,
  getBookingSession,
  setBookingSession,
} from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { Booking, BookingCompleteSummary } from "@/lib/types";
import { cn, formatMoney, parsePassengerNames } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const options = ["CASH", "REFERENCE", "BANK"] as const;
// CASH and REFERENCE are hidden for now — bank transfer only at checkout.
// Flip this back on to restore the full payment-method picker.
const SHOW_ALL_PAYMENT_METHODS = false;

export default function PaymentPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<(typeof options)[number]>(SHOW_ALL_PAYMENT_METHODS ? "CASH" : "BANK");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState<(typeof CHECKOUT_BANKS)[number]["id"] | null>(null);
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
    if (method === "BANK" && !bank) {
      toast.error(t("select_bank"));
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
          bank: CHECKOUT_BANKS.find((item) => item.id === bank)?.name,
        });
        const summary: BookingCompleteSummary = {
          kind: "bank_pending",
          reservationNo: booking?.refNumber || String(current.bookingId),
          fromCity: current.fromCity,
          toCity: current.toCity,
          travelDate: current.isoDate || booking?.trip?.travelDate,
          passengers,
          seats: (current.selectedSeats || []).map(String),
          amount: total,
          bank: CHECKOUT_BANKS.find((item) => item.id === bank)?.name,
        };
        sessionStorage.setItem("bookingComplete", JSON.stringify(summary));
        clearBookingSession();
        router.replace("/book/complete");
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
        <BookingStepper current="payment" t={t} />
        <PageHeader
          title={t("how_to_pay")}
          backHref="/book/passengers"
          action={<Countdown endTime={session?.endTime} />}
        />
        <Card className="mb-4 space-y-3">
          {SHOW_ALL_PAYMENT_METHODS ? (
            <>
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
            </>
          ) : null}

          {method === "BANK" ? (
            <>
              <SectionLabel>{t("select_bank")}</SectionLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {CHECKOUT_BANKS.map((item) => {
                  const active = bank === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBank(item.id)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-surface-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
                          active ? "bg-primary text-white" : "bg-surface-muted text-text-muted",
                        )}
                      >
                        <BankIcon />
                      </span>
                      <span className={cn("text-sm font-semibold", active ? "text-primary" : "text-navy")}>
                        {item.name}
                      </span>
                      {active ? (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="m5 13 4 4 10-10" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
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

        <Button className="mt-4 h-12 w-full text-[15px] shadow-md shadow-primary/25" loading={saving} onClick={submit}>
          {t("confirm_booking")}
          <ArrowRightIcon />
        </Button>
      </div>
    </Protected>
  );
}

function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v9M10 10v9M14 10v9M19 10v9" />
      <path d="M3 19h18" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
