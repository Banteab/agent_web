"use client";

import { Countdown } from "@/components/countdown";
import { Protected } from "@/components/protected";
import { Button, Card, Input, PageHeader, SectionLabel, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getBookingSession, setBookingSession } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import type { TripDetail } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PassengerPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const session = getBookingSession();

  useEffect(() => {
    const current = getBookingSession();
    if (!current?.trip || !current.bookingId) {
      router.replace("/home");
      return;
    }
    setNames(current.selectedSeats.map(() => ""));
    setPhones(current.selectedSeats.map(() => ""));
    api
      .getTrip(current.trip.id)
      .then((data) => {
        setTrip(data);
        const fromName = (current.fromCity || "").toLowerCase();
        const routeFrom = (data.route?.from?.name || "").toLowerCase();
        const sameDirection = !fromName || !routeFrom || fromName === routeFrom;
        const boarding = sameDirection ? data.route?.pickup : data.route?.dropoff;
        const alighting = sameDirection ? data.route?.dropoff : data.route?.pickup;
        setPickup(boarding?.[0]?.name || "");
        setDropoff(alighting?.[0]?.name || "");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
  }, [router, t, toast]);

  const fromName = (session?.fromCity || "").toLowerCase();
  const routeFrom = (trip?.route?.from?.name || "").toLowerCase();
  const sameDirection = !fromName || !routeFrom || fromName === routeFrom;
  const boardingPlaces = sameDirection ? trip?.route?.pickup : trip?.route?.dropoff;
  const alightingPlaces = sameDirection ? trip?.route?.dropoff : trip?.route?.pickup;

  async function next() {
    const current = getBookingSession();
    if (!current?.bookingId) return;
    if (names.some((name) => !name.trim()) || phones.some((phone) => !phone.trim())) {
      toast.error(t("all_passenger_info_is_req"));
      return;
    }
    if (phones.some((phone) => phone.trim().length !== 10)) {
      toast.error(t("phone_no_is_req"));
      return;
    }
    setSaving(true);
    try {
      const passengers = names.map((name) => name.trim()).join(",");
      const phoneNumber = phones.map((phone) => phone.trim()).join(",");
      const res = await api.addPassengerData(current.bookingId, {
        pickup,
        dropoff,
        passengers,
        phoneNumber,
      });
      if (res.success === false) {
        toast.error(res.message || t("error_occured"));
        return;
      }
      setBookingSession({
        ...current,
        pickup,
        dropoff,
        phoneNumber,
        passengers,
        tripDetail: trip || current.tripDetail,
      });
      toast.success(res.message || t("passenger_inofo_added"));
      router.push("/book/payment");
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
          title={t("passanger_data")}
          backHref="/book/seats"
          action={<Countdown endTime={session?.endTime} />}
        />
        <Card className="space-y-4">
          <SectionLabel>{t("passengers")}</SectionLabel>
          {session?.selectedSeats.map((seat, index) => (
            <div key={seat} className="space-y-3 rounded-xl bg-surface-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-faint">
                {t("seat_no")} {seat}
              </p>
              <Input
                placeholder={`${t("passenger")} ${index + 1}`}
                value={names[index] || ""}
                onChange={(e) => {
                  const nextNames = [...names];
                  nextNames[index] = e.target.value;
                  setNames(nextNames);
                }}
              />
              <Input
                inputMode="numeric"
                placeholder={`${t("phone")} ${index + 1}`}
                value={phones[index] || ""}
                onChange={(e) => {
                  const nextPhones = [...phones];
                  nextPhones[index] = e.target.value;
                  setPhones(nextPhones);
                }}
              />
            </div>
          ))}

          <SectionLabel>{t("contact_info")}</SectionLabel>
          <Select value={pickup} onChange={(e) => setPickup(e.target.value)}>
            <option value="">{t("pickup")}</option>
            {boardingPlaces?.map((place) => (
              <option key={place.id || place.name} value={place.name}>
                {place.name}
              </option>
            ))}
          </Select>
          <Select value={dropoff} onChange={(e) => setDropoff(e.target.value)}>
            <option value="">{t("dropoff")}</option>
            {alightingPlaces?.map((place) => (
              <option key={place.id || place.name} value={place.name}>
                {place.name}
              </option>
            ))}
          </Select>
          <Button className="w-full" loading={saving} onClick={next}>
            {t("next")}
          </Button>
        </Card>
      </div>
    </Protected>
  );
}
