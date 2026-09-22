"use client";

import { useAuth } from "@/lib/auth-context";
import { DEVTOOLS_GUARD_ENABLED } from "@/lib/constants";
import { isDevToolsLikelyOpen } from "@/lib/devtools-guard";
import { useI18n } from "@/lib/i18n";
import { getToken } from "@/lib/storage";
import { useEffect, useState } from "react";

function readBlocked() {
  return DEVTOOLS_GUARD_ENABLED && isDevToolsLikelyOpen();
}

export function DevToolsGuard({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { logoutOnDevTools } = useAuth();
  const [blocked, setBlocked] = useState(
    () => typeof window !== "undefined" && readBlocked(),
  );

  useEffect(() => {
    if (!DEVTOOLS_GUARD_ENABLED) return;

    const check = () => {
      const detected = isDevToolsLikelyOpen();
      setBlocked(detected);
      if (detected && getToken()) {
        logoutOnDevTools();
      }
    };

    check();
    const timer = window.setInterval(check, 500);
    window.addEventListener("resize", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", check);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [logoutOnDevTools]);

  if (!DEVTOOLS_GUARD_ENABLED) return <>{children}</>;

  return (
    <>
      <div
        aria-hidden={blocked}
        className={blocked ? "pointer-events-none select-none" : undefined}
      >
        {children}
      </div>
      {blocked ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="devtools-block-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/95 p-6 text-center text-white"
        >
          <div className="max-w-md space-y-3">
            <h2 id="devtools-block-title" className="text-xl font-bold">
              {t("devtools_blocked_title")}
            </h2>
            <p className="text-sm text-white/80">{t("devtools_blocked_message")}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
