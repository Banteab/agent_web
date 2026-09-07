"use client";

import { BrandLogo } from "@/components/brand-logo";
import { Button, Input } from "@/components/ui";
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
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <BrandLogo className="mx-auto mb-4" imgClassName="h-40 sm:h-48" />
        <p className="mb-2 text-center text-3xl font-black italic tracking-wide">
          <span className="text-[#002366]">BIFTU</span>{" "}
          <span className="text-[#f2b31a]">BUS</span>
        </p>
        <h1 className="mb-10 text-center text-lg font-semibold text-slate-600">{t("log_in")}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            inputMode="numeric"
            placeholder={t("phone_no")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t("pass_word")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="pt-8">
            <Button type="submit" loading={loading} className="w-full">
              {t("log_in")}
            </Button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">{t("acount")}</p>
      </div>
    </div>
  );
}
