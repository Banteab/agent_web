"use client";

import { Countdown } from "@/components/countdown";
import { Protected } from "@/components/protected";
import { Button, Card, PageHeader, SectionLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { BOOKING_HOLD_MS, MAX_SEATS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { clearBookingSession, getBookingSession, setBookingSession } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import { asNumberList, cn, formatMoney, selectedRoutePayload } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function SeatsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [bookingId, setBookingId] = useState<number>();
  const [endTime, setEndTime] = useState<number>();
  const [busy, setBusy] = useState(false);

  const [liveBooked, setLiveBooked] = useState<number[]>([]);
  const session = useMemo(() => getBookingSession(), [ready, selected, bookingId]);
  const trip = session?.trip;
  const booked = Array.from(
    new Set([...asNumberList(trip?.bookedSeats), ...asNumberList(trip?.blockedSeats), ...liveBooked]),
  );
  const layout = useMemo(
    () => (trip?.busStructureName || "").replaceAll(",", "").split(""),
    [trip],
  );

  useEffect(() => {
    const current = getBookingSession();
    if (!current?.trip) {
      router.replace("/home");
      return;
    }
    setSelected(current.selectedSeats || []);
    setBookingId(current.bookingId);
    setEndTime(current.endTime);
    setReady(true);
    api
      .getTrip(current.trip.id)
      .then((detail) => {
        const session = getBookingSession();
        if (session) setBookingSession({ ...session, tripDetail: detail });
      })
      .catch(() => {
        // seat map still works from search result
      });
  }, [router]);

  useEffect(() => {
    const tripId = getBookingSession()?.trip?.id;
    if (!tripId) return;
    let cancelled = false;
    const load = () => {
      api
        .getFormattedSeats(tripId)
        .then((seats) => {
          if (!cancelled) setLiveBooked(seats);
        })
        .catch(() => {
          // keep the seats already returned by trip search
        });
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const expire = useCallback(async () => {
    const current = getBookingSession();
    if (current?.bookingId) {
      try {
        await api.deleteBooking(current.bookingId);
      } catch {
        // seat hold already expired on the server
      }
    }
    clearBookingSession();
    toast.error(t("error_occured"));
    router.replace("/home");
  }, [router, t, toast]);

  async function toggleSeat(seat: number) {
    if (busy || booked.includes(seat)) return;
    if (selected.includes(seat)) {
      if (!bookingId) return;
      setBusy(true);
      try {
        await api.removeSeat(seat, bookingId);
        const next = selected.filter((s) => s !== seat);
        setSelected(next);
        const current = getBookingSession();
        if (current) setBookingSession({ ...current, selectedSeats: next });
        toast.success(t("seat_removed"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("err"));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (selected.length >= MAX_SEATS) {
      toast.error(t("more_than_six"));
      return;
    }

    setBusy(true);
    try {
      if (!bookingId) {
        const res = await api.reserveFirstSeat(
          String(seat),
          trip!.busId || 0,
          trip!.id,
          selectedRoutePayload(trip),
        );
        const id = Number(res.data);
        if (!id) {
          throw new Error(res.message || t("err"));
        }
        const hold = Date.now() + BOOKING_HOLD_MS;
        setBookingId(id);
        setEndTime(hold);
        const next = [seat];
        setSelected(next);
        const current = getBookingSession();
        if (current) {
          setBookingSession({ ...current, selectedSeats: next, bookingId: id, endTime: hold });
        }
        toast.success(res.message || t("booking_added"));
      } else {
        await api.addSeat(bookingId, seat);
        const next = [...selected, seat];
        setSelected(next);
        const current = getBookingSession();
        if (current) setBookingSession({ ...current, selectedSeats: next });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("err"));
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (selected.length < 1 || selected.length > MAX_SEATS) {
      toast.error(t("inproper_seat"));
      return;
    }
    if (!bookingId) {
      toast.error(t("inproper_seat"));
      return;
    }
    setBusy(true);
    try {
      const res = await api.updateBookingStatus(bookingId);
      if (res.success === false) {
        toast.error(res.message || t("booking_could_not_updated"));
        return;
      }
      router.push("/book/passengers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking_could_not_updated"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !trip) return <Spinner />;

  let seatNo = 0;

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader
          title={`${session?.fromCity} → ${session?.toCity}`}
          backHref="/home"
          action={<Countdown endTime={endTime} onExpire={expire} />}
        />
        <Card className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Legend color="bg-white ring-1 ring-slate-300" label={t("available_seat")} />
          <Legend color="bg-emerald-300" label={t("selected_seat")} />
          <Legend color="bg-rose-400" label={t("booked_seat")} />
          <p className="col-span-2 text-right font-semibold text-primary sm:col-span-1">
            {formatMoney((trip.price || 0) * selected.length)}
          </p>
        </Card>

        <Card>
          <SectionLabel>{t("seat")}</SectionLabel>
          <div className="mx-auto mt-3 grid max-w-sm grid-cols-5 gap-2">
            {layout.map((cell, index) => {
              if (cell === "_") return <div key={`${cell}-${index}`} />;
              if (cell !== "p") return <div key={`${cell}-${index}`} />;
              seatNo += 1;
              const current = seatNo;
              const isBooked = booked.includes(current);
              const isSelected = selected.includes(current);
              return (
                <button
                  key={current}
                  type="button"
                  disabled={isBooked && !isSelected}
                  onClick={() => toggleSeat(current)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition",
                    isSelected && "bg-emerald-300 text-navy shadow-sm",
                    isBooked && !isSelected && "bg-rose-400 text-white",
                    !isBooked && !isSelected && "bg-white text-navy ring-1 ring-slate-300 hover:ring-primary/40",
                  )}
                >
                  {current}
                </button>
              );
            })}
          </div>
        </Card>

        <Button className="mt-4 w-full" loading={busy} onClick={next}>
          {t("next")} · {selected.length} {t("seats")}
        </Button>
      </div>
    </Protected>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <span className={cn("h-4 w-4 rounded", color)} />
      {label}
    </div>
  );
}
