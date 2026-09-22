"use client";

import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/lib/toast-context";
import { DevToolsGuard } from "./devtools-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <DevToolsGuard>{children}</DevToolsGuard>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
