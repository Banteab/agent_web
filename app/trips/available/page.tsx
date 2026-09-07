"use client";

import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
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
      <div className="mx-auto max-w-3xl">
        <PageHeader title={`${from} → ${to}`} backHref="/home" />
        {loading ? <Spinner /> : null}
        {!loading && !trips.length ? <EmptyState title={t("no_available")} /> : null}
        <div className="space-y-3">
          {trips.map((trip) => {
            const lowSeats = typeof trip.seatsLeft === "number" && trip.seatsLeft <= 5;
            return (
              <Card key={trip.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-navy">{trip.busAssociation || t("bus")}</p>
                    <p className="text-sm text-text-muted">
                      {t("bus_id")} {trip.sideNumber} · {trip.plateNumber}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">{formatMoney(trip.price)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm font-semibold text-navy">
                  <span>{trip.departureTime}</span>
                  <span className="flex-1 border-t border-dashed border-border-strong" />
                  <BusIcon />
                  <span className="flex-1 border-t border-dashed border-border-strong" />
                  <span>{trip.arrivalTime}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <span>{trip.travelDate}</span>
                  <Badge tone={lowSeats ? "danger" : "info"}>
                    {trip.seatsLeft} {t("seats")}
                  </Badge>
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
            );
          })}
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
    <div className="space-y-2 border-t border-border pt-3 text-sm text-text-muted">
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

function BusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary">
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M6 17v2M18 17v2M4 11h16" />
    </svg>
  );
}

export default function AvailableBusesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AvailableBuses />
    </Suspense>
  );
}
