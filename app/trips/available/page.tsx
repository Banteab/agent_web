"use client";

import { Button, Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getBookingSession, setBookingSession } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { CancellationPolicy, SearchResult } from "@/lib/types";
import { citySearchName, formatMoney } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AvailableBuses() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [trips, setTrips] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  const from = citySearchName(params.get("from") || getBookingSession()?.fromCity);
  const to = citySearchName(params.get("to") || getBookingSession()?.toCity);
  const date = params.get("date") || getBookingSession()?.isoDate || "";

  useEffect(() => {
    if (!from || !to || !date) {
      setLoading(false);
      return;
    }
    api
      .searchTrips(from, to, date)
      .then((data) => setTrips(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [from, to, date, t, toast]);

  function selectTrip(trip: SearchResult) {
    const current = getBookingSession();
    setBookingSession({
      fromCity: from,
      toCity: to,
      isoDate: date,
      visualDate: current?.visualDate,
      trip,
      selectedSeats: [],
    });
    router.push("/book/seats");
  }

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={`${from} → ${to}`} backHref="/home" />
        {loading ? <Spinner /> : null}
        {!loading && !trips.length ? <EmptyState title={t("no_available")} /> : null}
        <div className="space-y-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">{trip.busAssociation || t("bus")}</p>
                  <p className="text-sm text-slate-500">
                    {t("bus_id")} {trip.sideNumber} · {trip.plateNumber}
                  </p>
                </div>
                <p className="font-bold text-primary">{formatMoney(trip.price)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
                <span>{t("dt")}: {trip.departureTime}</span>
                <span>{t("at")}: {trip.arrivalTime}</span>
                <span>{t("seats")}: {trip.seatsLeft}</span>
                <span>{trip.travelDate}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={() => selectTrip(trip)}>
                  {t("seat")}
                </Button>
                <Button variant="ghost" onClick={() => setOpen(open === trip.id ? null : trip.id)}>
                  {t("more")}
                </Button>
              </div>
              {open === trip.id ? (
                <PolicyDetails trip={trip} />
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </Protected>
  );
}

function PolicyDetails({ trip }: { trip: SearchResult }) {
  const { t } = useI18n();
  const [policies, setPolicies] = useState<CancellationPolicy[]>(trip.cancellationPolicy || []);

  useEffect(() => {
    if (trip.cancellationPolicy?.length) {
      setPolicies(trip.cancellationPolicy);
      return;
    }
    api
      .getCancellationPolicy()
      .then((rows) => setPolicies(rows))
      .catch(() => setPolicies([]));
  }, [trip.cancellationPolicy]);

  return (
    <div className="space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
      <p className="font-semibold text-navy">{t("cancellation_policy")}</p>
      {policies.length ? (
        policies.map((policy) => (
          <p key={policy.name}>
            {policy.name}: {policy.value}
          </p>
        ))
      ) : (
        <p>{t("no_content")}</p>
      )}
    </div>
  );
}

export default function AvailableBusesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AvailableBuses />
    </Suspense>
  );
}
