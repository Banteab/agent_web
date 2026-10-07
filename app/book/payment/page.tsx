"use client";

import { BookingStepper } from "@/components/booking-stepper";
import { Countdown } from "@/components/countdown";
import { Protected } from "@/components/protected";
import { TransactionStatusBadge, normalizeLedgerStatus } from "@/components/transactions/transaction-status-badge";
import { Button, Card, DetailRow, Input, PageHeader, SectionLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CHECKOUT_BANKS, RESCHEDULE_HOLD_MS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import {
  clearBookingSession,
  getBookingSession,
  setBookingSession,
} from "@/lib/storage";
import { notifyPendingPaymentsRefresh } from "@/lib/use-pending-bank-payments-count";
import { useToast } from "@/lib/toast-context";
import type { Booking, BookingCompleteSummary, PaymentTransactionLookup } from "@/lib/types";
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
  const [rescheduleTxn, setRescheduleTxn] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [lookup, setLookup] = useState<PaymentTransactionLookup | null | "not_found">(null);
  const session = getBookingSession();
  const reschedule = session?.reschedule;

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
      const bankName = CHECKOUT_BANKS.find((item) => item.id === bank)?.name;
      const res = await api.updatePayment(
        current.bookingId,
        method,
        reference.trim(),
        method === "BANK" ? bankName : undefined,
      );
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      setBookingSession(current);
      if (method === "BANK") {
        const summary: BookingCompleteSummary = {
          kind: "bank_pending",
          reservationNo: booking?.refNumber || String(current.bookingId),
          fromCity: current.fromCity,
          toCity: current.toCity,
          travelDate: current.isoDate || booking?.trip?.travelDate,
          passengers,
          seats: (current.selectedSeats || []).map(String),
          amount: total,
          bank: bankName,
        };
        sessionStorage.setItem("bookingComplete", JSON.stringify(summary));
        clearBookingSession();
        notifyPendingPaymentsRefresh();
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

  async function verifyTransaction() {
    const number = rescheduleTxn.trim();
    if (!number) return;
    setVerifying(true);
    setLookup(null);
    try {
      const results = await api.getPaymentTransactionByReference(number);
      setLookup(results[0] || "not_found");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setVerifying(false);
    }
  }

  async function submitReschedule() {
    const current = getBookingSession();
    if (!current?.bookingId || !current.reschedule) return;
    if (current.reschedule.penalty === 50 && !rescheduleTxn.trim()) {
      toast.error(t("reschedule_transaction_required"));
      return;
    }
    setSaving(true);
    try {
      const res = await api.rescheduleRequest({
        newBookingId: current.bookingId,
        originalTicketId: current.reschedule.originalTicketId,
        penalty: current.reschedule.penalty,
        newTransactionNumber: current.reschedule.penalty === 50 ? rescheduleTxn.trim() : undefined,
      });
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      const summary: BookingCompleteSummary = {
        kind: "reschedule_pending",
        reservationNo: booking?.refNumber || String(current.bookingId),
        fromCity: current.fromCity,
        toCity: current.toCity,
        travelDate: current.isoDate || booking?.trip?.travelDate,
        passengers,
        seats: (current.selectedSeats || []).map(String),
        amount: total,
        originalTicketNo: current.reschedule.originalTicketNo,
        holdExpiresAt: Date.now() + RESCHEDULE_HOLD_MS,
      };
      sessionStorage.setItem("bookingComplete", JSON.stringify(summary));
      clearBookingSession();
      router.replace("/book/complete");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `${t("reschedule_submit_not_live")} (${err.message})`
          : t("reschedule_submit_not_live"),
      );
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
        {reschedule ? (
          <Card className="mb-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gold-soft px-3.5 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gold-ink">{t("rescheduling_banner")}</span>
              <span className="text-xs text-gold-ink">{reschedule.originalTicketNo}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <span className="text-sm text-text-muted">
                {reschedule.penalty}% {t("reschedule_penalty_charge")}
              </span>
              <span className="text-base font-bold text-navy">
                {formatMoney(Math.round((reschedule.originalPrice || 0) * (reschedule.penalty / 100)))}
              </span>
            </div>

            {reschedule.penalty === 50 ? (
              <div className="space-y-2">
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-semibold text-navy">
                    {t("reschedule_transaction_number")} <span className="text-danger">*</span>
                  </span>
                  <div className="flex gap-2">
                    <Input
                      value={rescheduleTxn}
                      onChange={(e) => {
                        setRescheduleTxn(e.target.value);
                        setLookup(null);
                      }}
                      placeholder={t("bank_transaction_number_placeholder")}
                    />
                    <Button variant="secondary" loading={verifying} disabled={!rescheduleTxn.trim()} onClick={verifyTransaction}>
                      {t("verify")}
                    </Button>
                  </div>
                </label>
                {lookup === "not_found" ? (
                  <p className="text-xs font-semibold text-danger">{t("transaction_not_found")}</p>
                ) : lookup ? (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-semibold text-navy">{formatMoney(lookup.credit)}</p>
                      <p className="text-xs text-text-faint">{lookup.transactionAt}</p>
                    </div>
                    <TransactionStatusBadge status={lookup.status} t={t} />
                  </div>
                ) : null}
                {lookup && lookup !== "not_found" && normalizeLedgerStatus(lookup.status || "") === "VERIFIED" ? (
                  <p className="text-xs font-semibold text-danger">{t("transaction_already_used")}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-text-muted">{t("reschedule_zero_penalty_hint")}</p>
            )}
          </Card>
        ) : (
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
                        "relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition duration-150 active:scale-[0.98]",
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-muted hover:shadow-sm",
                      )}
                    >
                      <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-white p-1.5">
                        <img src={item.logo} alt={item.name} className="h-full w-full object-contain" />
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
        )}

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
          {!reschedule ? <DetailRow label="Commission" value={formatMoney(commission)} strong={false} /> : null}
          <DetailRow label={t("total")} value={<span className="text-primary">{formatMoney(total)}</span>} />
        </Card>

        <Button
          className="group mt-4 h-12 w-full text-[15px] shadow-md shadow-primary/25"
          loading={saving}
          onClick={reschedule ? submitReschedule : submit}
        >
          {reschedule ? t("reschedule_submit") : t("confirm_booking")}
          <ArrowRightIcon className="transition-transform duration-150 group-hover:translate-x-1" />
        </Button>
      </div>
    </Protected>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
