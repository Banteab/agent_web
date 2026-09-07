"use client";

import {
  daysInEthiopianMonth,
  ETHIOPIAN_MONTH_NAMES_AM,
  fromEthiopianDate,
  toEthiopianDate,
} from "@/lib/ethiopian-calendar";
import { cn, formatDateISO } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAY_INITIALS_AM = ["እ", "ሰ", "ማ", "ረ", "ሐ", "ዓ", "ቅ"];

/**
 * A trigger (passed as children) that opens an Ethiopian-calendar popover on
 * click. `value`/`onChange` and `min` are still plain Gregorian ISO date
 * strings — this only changes how the date is *picked*, not what's stored.
 */
export function EthiopianDatePicker({
  value,
  onChange,
  min,
  children,
  triggerClassName,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => (value ? new Date(`${value}T00:00:00`) : new Date()), [value]);
  const selectedEth = useMemo(() => toEthiopianDate(selectedDate), [selectedDate]);
  const todayEth = useMemo(() => toEthiopianDate(new Date()), []);
  const minEth = useMemo(() => (min ? toEthiopianDate(new Date(`${min}T00:00:00`)) : null), [min]);

  const [viewYear, setViewYear] = useState(selectedEth.year);
  const [viewMonth, setViewMonth] = useState(selectedEth.month);
  const [wasOpen, setWasOpen] = useState(false);

  // Jump the calendar view back to the selected date each time it opens —
  // done during render (comparing to the previous open state) rather than
  // in an effect, so it happens in the same commit as the open toggle.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setViewYear(selectedEth.year);
      setViewMonth(selectedEth.month);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function changeMonth(delta: number) {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 1) {
      nextMonth = 13;
      nextYear -= 1;
    } else if (nextMonth > 13) {
      nextMonth = 1;
      nextYear += 1;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }

  function isBeforeMin(year: number, month: number, day: number) {
    if (!minEth) return false;
    if (year !== minEth.year) return year < minEth.year;
    if (month !== minEth.month) return month < minEth.month;
    return day < minEth.day;
  }

  function selectDay(day: number) {
    const gregorian = fromEthiopianDate(viewYear, viewMonth, day);
    onChange(formatDateISO(gregorian));
    setOpen(false);
  }

  const dayCount = daysInEthiopianMonth(viewYear, viewMonth);
  const firstWeekday = fromEthiopianDate(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: dayCount }, (_, i) => i + 1),
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn("w-full text-left", triggerClassName)}>
        {children}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-navy">
              {ETHIOPIAN_MONTH_NAMES_AM[viewMonth - 1]} {viewYear}
            </p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_INITIALS_AM.map((label, i) => (
              <span key={`${label}-${i}`} className="py-1 text-[11px] font-semibold text-text-faint">
                {label}
              </span>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} />;
              const isSelected = day === selectedEth.day && viewMonth === selectedEth.month && viewYear === selectedEth.year;
              const isToday = day === todayEth.day && viewMonth === todayEth.month && viewYear === todayEth.year;
              const disabled = isBeforeMin(viewYear, viewMonth, day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition disabled:cursor-not-allowed disabled:text-text-faint/50",
                    isSelected && "bg-primary text-white",
                    !isSelected && isToday && "border border-primary text-primary",
                    !isSelected && !isToday && !disabled && "text-text hover:bg-surface-muted",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A boxed trigger matching the look of the shared `Input` component, for use as EthiopianDatePicker's children. */
export function DateTriggerBox({ label }: { label: string }) {
  return (
    <span className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm text-text transition hover:border-primary/40">
      <span className="truncate">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-faint">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    </span>
  );
}
