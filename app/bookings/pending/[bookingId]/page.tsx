"use client";

import { BookingDetailPanel } from "@/components/booking-detail-panel";
import { EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PendingBookingDetailPage() {
  const { t } = useI18n();
  const toast = useToast();
  const params = useParams<{ bookingId: string }>();
  const bookingId = Number(params.bookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getBooking(bookingId)
      .then(setBooking)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : t("error_occured"));
        setBooking(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (!booking) return <EmptyState title={t("no_ticket_data")} />;

  return <BookingDetailPanel mode="pending" booking={booking} onRefresh={load} />;
}
