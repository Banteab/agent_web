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
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={`${session?.fromCity} → ${session?.toCity}`}
          backHref="/home"
          action={<Countdown endTime={endTime} onExpire={expire} />}
        />
        <Card className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <Legend icon={<SeatIcon className="text-border-strong" />} label={t("available_seat")} />
          <Legend icon={<SeatIcon className="text-primary" />} label={t("selected_seat")} />
          <Legend icon={<SeatIcon className="text-text-faint" />} label={t("booked_seat")} />
          <p className="col-span-2 text-right font-semibold text-primary sm:col-span-1">
            {formatMoney((trip.price || 0) * selected.length)}
          </p>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>{t("seat")}</SectionLabel>
            <span className="flex items-center gap-1.5 text-xs text-text-faint">
              <WheelIcon /> {t("driver")}
            </span>
          </div>
          <div className="mx-auto grid max-w-sm grid-cols-5 gap-x-2 gap-y-3">
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
                  aria-label={`${t("seat")} ${current}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex flex-col items-center transition disabled:cursor-not-allowed",
                    !isBooked && !isSelected && "cursor-pointer",
                  )}
                >
                  <SeatIcon
                    className={cn(
                      "h-10 w-9 drop-shadow-sm transition",
                      isSelected && "text-primary",
                      isBooked && !isSelected && "text-text-faint",
                      !isBooked && !isSelected && "text-border-strong group-hover:text-primary/50",
                    )}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute top-4 text-[11px] font-bold",
                      isSelected || (isBooked && !isSelected) ? "text-white" : "text-navy",
                    )}
                  >
                    {current}
                  </span>
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

function Legend({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-text-muted">
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </div>
  );
}

function SeatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 44" fill="currentColor" className={className}>
      <rect x="11" y="1.5" width="18" height="13" rx="5" />
      <rect x="4" y="13" width="32" height="27" rx="9" />
      <rect x="0" y="19" width="5" height="16" rx="2.5" />
      <rect x="35" y="19" width="5" height="16" rx="2.5" />
    </svg>
  );
}

function WheelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
    </svg>
  );
}
