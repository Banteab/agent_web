"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { PENDING_PAYMENTS_REFRESH_EVENT } from "./constants";

export function usePendingBankPaymentsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      api
        .getPendingBankPayments()
        .then((list) => {
          if (!cancelled) setCount(list.length);
        })
        .catch(() => {
          if (!cancelled) setCount(0);
        });
    };

    sync();
    const timer = window.setInterval(sync, 60_000);
    window.addEventListener(PENDING_PAYMENTS_REFRESH_EVENT, sync);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(PENDING_PAYMENTS_REFRESH_EVENT, sync);
    };
  }, []);

  return count;
}

export function notifyPendingPaymentsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PENDING_PAYMENTS_REFRESH_EVENT));
  }
}
