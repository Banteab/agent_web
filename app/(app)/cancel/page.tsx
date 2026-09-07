"use client";

import { Button, Card, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelTabPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [ticketNo, setTicketNo] = useState("");

  function search() {
    if (!ticketNo.trim()) {
      toast.error(t("can_not_be_empty"));
      return;
    }
    router.push(`/cancel/summary?ticket=${encodeURIComponent(ticketNo.trim())}`);
  }

  return (
    <Card className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-bold text-navy">{t("cancele_ticket")}</h2>
      <Input
        placeholder={t("tikect_number")}
        value={ticketNo}
        onChange={(e) => setTicketNo(e.target.value)}
      />
      <Button className="w-full" onClick={search}>
        {t("search")}
      </Button>
    </Card>
  );
}
