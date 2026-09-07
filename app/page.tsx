"use client";

import { BrandLogo } from "@/components/brand-logo";
import { SupportIllustration } from "@/components/support-illustration";
import { Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const { t } = useI18n();
  const { login, ready, token } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && token) router.replace("/home");
  }, [ready, token, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      toast.error("Email or password can't be null");
      return;
    }
    setLoading(true);
    try {
      const message = await login(phone.trim(), password);
      toast.success(message);
      router.replace("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh bg-surface">
      <div className="relative hidden w-[38%] shrink-0 flex-col overflow-hidden bg-navy px-6 py-6 text-white sm:px-8 sm:py-8 md:flex lg:w-[42%] lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <BrandLogo compact imgClassName="h-9 w-9" />
            <span className="text-base font-semibold tracking-tight">Biftu Bus</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gold">
            <PhoneIcon />
            {t("call_center_line")} 8477
          </span>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 py-6">
          <SupportIllustration className="h-40 w-full max-w-[220px] lg:h-56 lg:max-w-xs" />
          <div className="max-w-sm text-center">
            <p className="text-xl font-semibold leading-snug tracking-tight lg:text-2xl">
              {t("login_hero_title")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{t("login_hero_subtitle")}</p>
          </div>
        </div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Biftu Bus. {t("login_footer")}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <BrandLogo compact imgClassName="h-9 w-9" />
            <span className="text-base font-semibold tracking-tight text-navy">Biftu Bus</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-navy">{t("log_in")}</h1>
          <p className="mt-1.5 text-sm text-text-muted">{t("login_prompt")}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label={t("phone_no")}>
              <Input
                inputMode="numeric"
                placeholder={t("phone_no")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label={t("pass_word")}>
              <Input
                type="password"
                placeholder={t("pass_word")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" loading={loading} className="mt-2 w-full">
              {t("log_in")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">{t("acount")}</p>
        </div>
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5c0 8.284 6.716 15 15 15l2-4-6-2-2 2c-2.5-1-4-2.5-5-5l2-2-2-6-4 2Z" />
    </svg>
  );
}
