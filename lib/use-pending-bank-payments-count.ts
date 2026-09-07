"use client";

import { useEffect, useState } from "react";
import { PENDING_BANK_PAYMENTS_EVENT, getPendingBankPayments } from "./storage";

export function usePendingBankPaymentsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getPendingBankPayments().length);
    sync();
    window.addEventListener(PENDING_BANK_PAYMENTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PENDING_BANK_PAYMENTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return count;
}
