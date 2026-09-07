"use client";

import { remainingLabel } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Countdown({
  endTime,
  onExpire,
}: {
  endTime?: number;
  onExpire?: () => void;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
      if (Date.now() >= endTime) {
        window.clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [endTime, onExpire]);

  if (!endTime) return null;

  return (
    <span className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-gold">
      {remainingLabel(endTime)}
    </span>
  );
}
