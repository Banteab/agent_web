"use client";

import { DEVTOOLS_GUARD_ENABLED } from "@/lib/constants";
import { isDevToolsLikelyOpen } from "@/lib/devtools-guard";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";

export function DevToolsGuard({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { token, logoutOnDevTools } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const trippedRef = useRef(false);

  useEffect(() => {
    if (!DEVTOOLS_GUARD_ENABLED) return;

    const check = () => {
      const detected = isDevToolsLikelyOpen();
      setBlocked(detected);

      if (detected && !trippedRef.current) {
        trippedRef.current = true;
        logoutOnDevTools();
        return;
      }
      if (!detected) {
        trippedRef.current = false;
      }
    };

    check();
    const timer = window.setInterval(check, 800);
    window.addEventListener("resize", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", check);
    };
  }, [logoutOnDevTools, token]);

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
