"use client";

import { useI18n } from "@/lib/i18n";
import {
  getSessionRemainingSeconds,
  isAuthStorageKey,
  SESSION_COUNTDOWN_CHANNEL,
  SESSION_EXPIRY_CHANGED_EVENT,
} from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";

/** Re-render trigger — displayed seconds always come from shared localStorage expiry. */
export function SessionCountdown() {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);

    bump();
    const timer = window.setInterval(bump, 1000);

    const onStorage = (event: StorageEvent) => {
      if (isAuthStorageKey(event.key)) bump();
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SESSION_COUNTDOWN_CHANNEL);
      channel.onmessage = () => bump();
      channel.postMessage({ at: Date.now() });
    } catch {
      channel = null;
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(SESSION_EXPIRY_CHANGED_EVENT, bump);
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", bump);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SESSION_EXPIRY_CHANGED_EVENT, bump);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", bump);
      channel?.close();
    };
  }, []);

  const seconds = useMemo(() => getSessionRemainingSeconds(), [tick]);

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium">
      <span className="text-primary">{t("session_in_seconds")}</span>
      <span className="font-semibold tabular-nums text-danger">{seconds}</span>
    </span>
  );
}
