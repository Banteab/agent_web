"use client";

import { BookingStepper } from "@/components/booking-stepper";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Splits a bus's seat-map string into rows of seat/aisle cells ("p"/"_").
 *
 * Two conventions occur in the wild: one comma-separated token per row
 * (e.g. "pp_pp,pp_pp,ppppp" — a 5-across last row with no aisle needs this
 * to render correctly), or one token per character (e.g. "p,p,_,p,p,p,p,_,p,p"),
 * which carries no row-boundary info and is regrouped into rows of 5 as
 * before. Seats are still numbered in the same left-to-right, top-to-bottom
 * order either way, so seat numbers sent to the API are unaffected.
 */
function parseBusRows(busStructureName?: string): string[][] {
  const tokens = (busStructureName || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.some((token) => token.length > 1)) {
    return tokens.map((row) => row.split(""));
  }
  const flat = tokens.join("").split("");
  const rows: string[][] = [];
  for (let i = 0; i < flat.length; i += 5) rows.push(flat.slice(i, i + 5));
  return rows;
}

export default function SeatsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selected, setSelectedState] = useState<number[]>([]);
  const [bookingId, setBookingIdState] = useState<number>();
  const [endTime, setEndTime] = useState<number>();
  const [busy, setBusy] = useState(false);

  // Seat taps can arrive faster than their network round trips resolve (an
  // agent picking several seats for a group, for instance). `toggleSeat`
  // queues each tap instead of dropping the ones that land while a previous
  // one is still in flight, so `performToggle` must read the *latest*
  // selection/booking id at the moment it actually runs rather than whatever
  // was captured in the click's closure — hence mirroring both into refs
  // that are updated synchronously, right alongside the state setters.
  const selectedRef = useRef<number[]>([]);
  const bookingIdRef = useRef<number | undefined>(undefined);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingCountRef = useRef(0);

  function setSelected(next: number[]) {
    selectedRef.current = next;
    setSelectedState(next);
  }

  function setBookingIdValue(next: number | undefined) {
    bookingIdRef.current = next;
    setBookingIdState(next);
  }

  const [liveBooked, setLiveBooked] = useState<number[]>([]);
  const session = useMemo(() => getBookingSession(), [ready, selected, bookingId]);
  const trip = session?.trip;
  // "Booked" seats are confirmed tickets (red); "reserved" seats are only
  // temporarily held — another agent's in-progress hold, from either the
  // trip snapshot's blockedSeats or the live polling endpoint (yellow).
  const bookedSet = new Set(asNumberList(trip?.bookedSeats));
  const reservedSet = new Set(
    [...asNumberList(trip?.blockedSeats), ...liveBooked].filter((seat) => !bookedSet.has(seat)),
  );
  const booked = Array.from(new Set([...bookedSet, ...reservedSet]));
  const rows = useMemo(() => parseBusRows(trip?.busStructureName), [trip]);

  useEffect(() => {
    const current = getBookingSession();
    if (!current?.trip) {
      router.replace("/home");
      return;
    }
    setSelected(current.selectedSeats || []);
    setBookingIdValue(current.bookingId);
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

  // Runs one seat tap. Reads/writes the refs (not `selected`/`bookingId`
  // directly) so it always sees the outcome of whichever taps the queue has
  // already processed, even though this function itself was created back
  // when the tap happened.
  async function performToggle(seat: number) {
    const currentSelected = selectedRef.current;
    const currentBookingId = bookingIdRef.current;

    // Check the agent's own selection before the booked/reserved guard: once a
    // seat they've picked shows up again in the live occupied-seats poll (which
    // it will, since the backend now genuinely considers it held), it must stay
    // deselectable — otherwise a seat becomes permanently stuck a few seconds
    // after being selected.
    if (currentSelected.includes(seat)) {
      if (!currentBookingId) return;
      try {
        await api.removeSeat(seat, currentBookingId);
        const next = currentSelected.filter((s) => s !== seat);
        setSelected(next);
        const current = getBookingSession();
        if (current) setBookingSession({ ...current, selectedSeats: next });
        toast.success(t("seat_removed"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("err"));
      }
      return;
    }

    if (booked.includes(seat)) return;

    if (currentSelected.length >= MAX_SEATS) {
      toast.error(t("more_than_six"));
      return;
    }

    try {
      if (!currentBookingId) {
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
        setBookingIdValue(id);
        setEndTime(hold);
        const next = [seat];
        setSelected(next);
        const current = getBookingSession();
        if (current) {
          setBookingSession({ ...current, selectedSeats: next, bookingId: id, endTime: hold });
        }
        toast.success(res.message || t("booking_added"));
      } else {
        await api.addSeat(currentBookingId, seat);
        const next = [...currentSelected, seat];
        setSelected(next);
        const current = getBookingSession();
        if (current) setBookingSession({ ...current, selectedSeats: next });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("err"));
    }
  }

  // Queues seat taps instead of dropping the ones that land while an earlier
  // one is still in flight — an agent picking several seats for a group taps
  // faster than each add/remove round trip resolves, and a plain "ignore
  // while busy" guard here would silently swallow every seat but the first.
  function toggleSeat(seat: number) {
    pendingCountRef.current += 1;
    setBusy(true);
    queueRef.current = queueRef.current
      .then(() => performToggle(seat))
      .catch(() => {})
      .finally(() => {
        pendingCountRef.current -= 1;
        if (pendingCountRef.current === 0) setBusy(false);
      });
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
        <BookingStepper current="seats" t={t} />
        <PageHeader
          title={`${session?.fromCity} → ${session?.toCity}`}
          backHref="/home"
          action={<Countdown endTime={endTime} onExpire={expire} />}
        />
        <Card className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
          <Legend icon={<SeatIcon className="text-white" />} label={t("available_seat")} />
          <Legend icon={<SeatIcon className="text-success" />} label={t("selected_seat")} />
          <Legend icon={<SeatIcon className="text-gold" />} label={t("reserved_seat")} />
          <Legend icon={<SeatIcon className="text-danger" />} label={t("booked_seat")} />
          <p className="col-span-2 text-right font-semibold text-primary sm:col-span-1">
            {formatMoney((trip.price || 0) * selected.length)}
          </p>
        </Card>

        <Card>
          <SectionLabel>{t("seat")}</SectionLabel>
          <div className="mx-auto mt-3 max-w-sm overflow-hidden rounded-[28px] border-2 border-border bg-surface-muted/40">
            <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-2.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-text-faint">
                <WheelIcon /> {t("driver")}
              </span>
              <span className="h-1.5 w-10 rounded-full bg-border-strong" aria-hidden />
            </div>
            <div className="space-y-2.5 px-4 py-5 sm:px-6">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1.5">
                  {row.map((cell, cellIndex) => {
                    if (cell !== "p") {
                      return <div key={`gap-${rowIndex}-${cellIndex}`} className="w-4 shrink-0" aria-hidden />;
                    }
                    seatNo += 1;
                    const current = seatNo;
                    const isSelected = selected.includes(current);
                    const isBooked = bookedSet.has(current);
                    const isReserved = reservedSet.has(current);
                    const isBlocked = (isBooked || isReserved) && !isSelected;
                    return (
                      <button
                        key={`seat-${current}`}
                        type="button"
                        disabled={isBlocked}
                        onClick={() => toggleSeat(current)}
                        aria-label={`${t("seat")} ${current}`}
                        aria-pressed={isSelected}
                        className={cn(
                          "group relative flex shrink-0 flex-col items-center transition disabled:cursor-not-allowed",
                          !isBlocked && "cursor-pointer",
                        )}
                      >
                        <SeatIcon
                          className={cn(
                            "h-10 w-9 drop-shadow-sm transition",
                            isSelected && "text-success",
                            !isSelected && isBooked && "text-danger",
                            !isSelected && isReserved && "text-gold",
                            !isSelected && !isBooked && !isReserved && "text-white group-hover:text-success/20",
                          )}
                        />
                        <span
                          className={cn(
                            "pointer-events-none absolute top-4 text-[11px] font-bold",
                            isSelected || isBooked ? "text-white" : "text-navy",
                          )}
                        >
                          {current}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
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
    <svg viewBox="0 0 40 44" fill="currentColor" stroke="rgba(15,23,42,0.18)" strokeWidth="1" className={className}>
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
