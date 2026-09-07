"use client";

import { Button, Card, EmptyState, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getSearchedBus, setSearchedBus } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { SearchResult } from "@/lib/types";
import { formatDateISO, formatMoney } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FastTripPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [trips, setTrips] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [issuing, setIssuing] = useState(false);

  async function load(nextDate = date) {
    setLoading(true);
    try {
      const data = await api.searchTripsByDate(nextDate);
      const list = Array.isArray(data) ? data : [];
      setTrips(list);
      setSearchedBus(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
      setTrips(getSearchedBus());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const cached = getSearchedBus();
    if (cached.length) setTrips(cached);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function issue(trip: SearchResult) {
    if (!name.trim()) {
      toast.error(t("passenger_name_can_not_be_empty"));
      return;
    }
    if (!phone.trim()) {
      toast.error(t("phone_no_is_req"));
      return;
    }
    setIssuing(true);
    try {
      const res = await api.issueTicketShort({
        passenger: name.trim(),
        tripId: trip.id,
        phoneNumber: phone.trim(),
      });
      if (res.success === false) {
        toast.error(res.message || t("could_not_ptint"));
        return;
      }
      toast.success(res.message || t("booking_added"));
      setName("");
      setPhone("");
      setOpenId(null);
      router.replace("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1">
          <span className="text-sm font-semibold text-slate-500">{t("travel_date")}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-11 w-full rounded-full bg-slate-100 px-4"
          />
        </label>
        <Button onClick={() => load(date)} loading={loading} className="sm:w-40">
          {t("search")}
        </Button>
      </Card>

      {loading ? <Spinner /> : null}
      {!loading && !trips.length ? <EmptyState title={t("no_available")} /> : null}

      {trips.map((trip) => (
        <Card key={trip.id} className="space-y-3">
          <button className="w-full text-left" onClick={() => setOpenId(openId === trip.id ? null : trip.id)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy">
                  {trip.from} → {trip.to}
                </p>
                <p className="text-sm text-slate-500">
                  {trip.busAssociation} · {trip.sideNumber}
                </p>
              </div>
              <p className="font-semibold text-primary">{formatMoney(trip.price)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {t("dt")} {trip.departureTime} · {t("at")} {trip.arrivalTime} · {trip.seatsLeft} {t("seats")}
            </p>
          </button>
          {openId === trip.id ? (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <Input placeholder={t("passenger_name")} value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder={t("passenger_phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button className="w-full" loading={issuing} onClick={() => issue(trip)}>
                {t("finish")}
              </Button>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
