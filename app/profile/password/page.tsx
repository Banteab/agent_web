"use client";

import { Protected } from "@/components/protected";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { FormEvent, useState } from "react";

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const toast = useToast();
  const { logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error(t("password_can_not_be_empty"));
      return;
    }
    if (newPassword !== confirm) {
      toast.error(t("password_does_not_match"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.updatePassword(oldPassword, newPassword);
      toast.success(res.message || t("password_changed"));
      logout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("change_password")} backHref="/profile" />
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input type="password" placeholder={t("old_password")} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <Input type="password" placeholder={t("new_password")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input type="password" placeholder={t("confirm_new_password")} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" className="w-full" loading={loading}>
              {t("update_password")}
            </Button>
          </form>
        </Card>
      </div>
    </Protected>
  );
}
