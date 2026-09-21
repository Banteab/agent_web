"use client";

import { cn, remainingLabel } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Countdown({
  endTime,
  onExpire,
}: {
  endTime?: number;
  onExpire?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState<number>();

  useEffect(() => {
    if (!endTime) return;
    Promise.resolve().then(() => setRemainingMs(endTime - Date.now()));
    const id = window.setInterval(() => {
      const left = endTime - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [endTime, onExpire]);

  if (!endTime) return null;

  const urgent = remainingMs != null && remainingMs <= 60_000;

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold transition-colors",
        urgent ? "animate-pulse bg-danger text-white" : "bg-navy text-gold",
      )}
    >
      {remainingLabel(endTime)}
    </span>
  );
}
