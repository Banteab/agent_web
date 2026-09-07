"use client";

import { BookingStepper } from "@/components/booking-stepper";
import { BrandLogo } from "@/components/brand-logo";
import { Protected } from "@/components/protected";
import { Button, Card, DetailRow, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { clearBookingSession, getBookingSession } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { Booking, BookingCompleteSummary } from "@/lib/types";
import { formatMoney, parsePassengerNames, parseSeats } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReservationPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const { profile } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const session = getBookingSession();

  useEffect(() => {
    const current = getBookingSession();
    if (!current?.bookingId) {
      router.replace("/home");
      return;
    }
    api
      .getBooking(current.bookingId)
      .then(setBooking)
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [router, t, toast]);

  const passengers = parsePassengerNames(booking?.passengers || session?.passengers);
  const seats = parseSeats(booking?.seat).length
    ? parseSeats(booking?.seat)
    : (session?.selectedSeats || []).map(String);
  const cards = Math.max(passengers.length, seats.length, 1);

  async function finish() {
    const current = getBookingSession();
    if (!current?.bookingId) return;
    setIssuing(true);
    try {
      const res = await api.generateTickets(current.bookingId);
      if (res.success === false) {
        toast.error(res.message || t("could_not_ptint"));
        return;
      }
      const summary: BookingCompleteSummary = {
        kind: "ticket_issued",
        reservationNo: booking?.refNumber || String(current.bookingId),
        fromCity: current.fromCity || booking?.trip?.from,
        toCity: current.toCity || booking?.trip?.to,
        travelDate: current.isoDate || booking?.trip?.travelDate,
        passengers,
        seats,
        amount: booking?.price || current.trip?.price,
        ticketNumbers: Array.isArray(res.data) ? res.data : [],
      };
      sessionStorage.setItem("bookingComplete", JSON.stringify(summary));
      clearBookingSession();
      router.replace("/book/complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("could_not_ptint"));
    } finally {
      setIssuing(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <BookingStepper current="payment" t={t} />
        <PageHeader title={t("reservation_detail")} />
        <div className="space-y-4">
          {Array.from({ length: cards }, (_, index) => (
            <Card
              key={`${passengers[index] || "passenger"}-${index}`}
              className="space-y-3 overflow-hidden border-t-4 border-primary text-center"
            >
              <BrandLogo className="mx-auto" imgClassName="h-16" />
              <p className="text-sm text-text-muted">Addis Ababa, Ethiopia</p>
              <div className="space-y-1 text-left text-sm">
                <DetailRow label={t("passenger")} value={passengers[index] || passengers.join(", ")} />
                <DetailRow label={t("phone")} value={session?.phoneNumber || booking?.phoneNumber} />
                <DetailRow label={t("from")} value={session?.fromCity || booking?.trip?.from} />
                <DetailRow label={t("to")} value={session?.toCity || booking?.trip?.to} />
                <DetailRow label={t("pickup")} value={session?.pickup || booking?.pickup} />
                <DetailRow label={t("dropoff")} value={session?.dropoff || booking?.dropoff} />
                <DetailRow label={t("seat_no")} value={seats[index] || seats.join(", ")} />
                <DetailRow label={t("price")} value={formatMoney(booking?.price || session?.trip?.price)} />
                <DetailRow
                  label={t("ticketer_name")}
                  value={`${booking?.agent?.firstName || profile?.firstName || ""} ${booking?.agent?.lastName || profile?.lastName || ""}`.trim()}
                />
                <DetailRow label={t("ticketer_phone")} value={booking?.agent?.phoneNo || profile?.phoneNo} />
              </div>
            </Card>
          ))}
        </div>
        <Button className="mt-4 h-12 w-full text-[15px] shadow-md shadow-primary/25" loading={issuing} onClick={finish}>
          {t("complete_booking")}
        </Button>
      </div>
    </Protected>
  );
}
