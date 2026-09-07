"use client";

import { Protected } from "@/components/protected";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { api } from "@/lib/api";
import { BANKS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { FormEvent, useState } from "react";

export default function TopUpPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [bank, setBank] = useState<string>(BANKS[0].id);
  const [depositor, setDepositor] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!depositor || !reference || !amount) {
      toast.error(t("error"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendTopUp({
        bank,
        depositor,
        reference_number: reference,
        amount: Number(amount),
      });
      toast.success(res.message || t("booking_added"));
      setDepositor("");
      setReference("");
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title="Top up" backHref="/profile" />
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Select value={bank} onChange={(e) => setBank(e.target.value)}>
              {BANKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Input placeholder={t("name")} value={depositor} onChange={(e) => setDepositor(e.target.value)} />
            <Input placeholder={t("reference_number")} value={reference} onChange={(e) => setReference(e.target.value)} />
            <Input type="number" placeholder={t("price")} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button type="submit" className="w-full" loading={loading}>
              {t("save")}
            </Button>
          </form>
        </Card>
      </div>
    </Protected>
  );
}
