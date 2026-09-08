"use client";

import { BookingStepper } from "@/components/booking-stepper";
import { BrandLogo } from "@/components/brand-logo";
import { Protected } from "@/components/protected";
import { Button, Card, DetailRow } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { BookingCompleteSummary } from "@/lib/types";
import { formatDisplayDateValue, formatMoney, qrSrc } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookingCompletePage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [summary, setSummary] = useState<BookingCompleteSummary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem("bookingComplete");
        if (!raw) {
          router.replace("/home");
          return;
        }
        setSummary(JSON.parse(raw) as BookingCompleteSummary);
        setReady(true);
      } catch {
        router.replace("/home");
      }
    });
  }, [router]);

  if (!ready || !summary) return null;

  const isBankPending = summary.kind === "bank_pending";

  return (
    <Protected>
      <div className="mx-auto max-w-2xl">
        <BookingStepper current="done" t={t} />

        <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-sm sm:py-12">
          <div
            className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-success/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-[pulseRing_1.8s_ease-out_infinite] rounded-full bg-success/40" />
            <span className="relative flex h-16 w-16 animate-[scaleCheck_500ms_ease-out] items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/30">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="m5 13 4 4 10-10" />
              </svg>
            </span>
          </div>

          <h1 className="relative mt-5 text-xl font-bold tracking-tight text-navy sm:text-2xl">
            {isBankPending ? t("booking_confirmed_title") : t("tickets_issued_title")}
          </h1>
          <p className="relative mt-2 max-w-md text-sm text-text-muted">
            {isBankPending ? t("booking_confirmed_subtitle") : t("tickets_issued_subtitle")}
          </p>

          {isBankPending ? (
            <span className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {t("pending_payment")}
            </span>
          ) : null}
        </div>

        <Card className="mt-4 space-y-1">
          <div className="mb-2 flex items-center justify-between">
            <BrandLogo compact imgClassName="h-7 w-7" />
            <span className="font-mono text-xs text-text-faint">#{summary.reservationNo}</span>
          </div>
          <DetailRow label={t("from")} value={summary.fromCity} />
          <DetailRow label={t("to")} value={summary.toCity} />
          <DetailRow label={t("travel_date")} value={formatDisplayDateValue(summary.travelDate, locale)} />
          <DetailRow label={t("passengers")} value={summary.passengers.join(", ")} />
          <DetailRow label={t("seat")} value={summary.seats.join(", ")} />
          {summary.bank ? <DetailRow label={t("bank")} value={summary.bank} /> : null}
          <div className="my-1 border-t border-border" />
          <DetailRow label={t("total")} value={<span className="text-primary">{formatMoney(summary.amount)}</span>} />
        </Card>

        {!isBankPending && summary.ticketNumbers?.length ? (
          <Card className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-faint">{t("ticket")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.ticketNumbers.map((ticketNo) => (
                <div key={ticketNo} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <img src={qrSrc(ticketNo)} alt="QR" className="h-16 w-16 shrink-0" />
                  <p className="truncate font-mono text-sm font-semibold text-navy">{ticketNo}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          {isBankPending ? (
            <Button className="flex-1 shadow-md shadow-primary/20" onClick={() => router.push("/pending-payments")}>
              {t("view_pending_payments")}
            </Button>
          ) : (
            <>
              <Button className="flex-1 shadow-md shadow-primary/20" onClick={() => router.push("/booked")}>
                {t("view_my_bookings")}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => window.print()}>
                {t("print")}
              </Button>
            </>
          )}
          <Button variant="secondary" className="flex-1" onClick={() => router.push("/home")}>
            {t("new_booking")}
          </Button>
        </div>
      </div>
    </Protected>
  );
}
