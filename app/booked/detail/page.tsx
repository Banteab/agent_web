"use client";

import { BrandLogo } from "@/components/brand-logo";
import { Protected } from "@/components/protected";
import { Button, Card, DetailRow, Input, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { TicketListItem } from "@/lib/types";
import { formatMoney, parseSelectedRoute, qrSrc } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookedDetailPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketListItem | null>(null);
  const [passenger, setPassenger] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("ticketDetail");
    if (!raw) {
      router.replace("/booked");
      return;
    }
    const data = JSON.parse(raw) as TicketListItem;
    setTicket(data);
    setPassenger(data.passenger || "");
    setPhone(data.booking?.phoneNumber || "");
  }, [router]);

  if (!ticket) return null;
  const route = ticket.booking?.parseSelectedRoute || parseSelectedRoute(ticket.booking?.selectedRoute);

  async function save() {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await api.updateTicket(ticket.id, passenger, phone);
      toast.success(res.message || t("update"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking_could_not_updated"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Protected>
      <div className="mx-auto min-h-dvh max-w-3xl bg-page px-4 py-4">
        <PageHeader title={t("booking_detail")} backHref="/booked" />
        <Card className="space-y-3">
          <BrandLogo className="mx-auto" imgClassName="h-16" />
          {ticket.ticketNo ? <img src={qrSrc(ticket.ticketNo)} alt="QR" className="mx-auto h-28 w-28" /> : null}
          <DetailRow label={t("ticket_no")} value={ticket.ticketNo} />
          <DetailRow label={t("from")} value={route?.from || ticket.booking?.trip?.from} />
          <DetailRow label={t("to")} value={route?.to || ticket.booking?.trip?.to} />
          <DetailRow label={t("seat")} value={ticket.seat} />
          <DetailRow label={t("price")} value={formatMoney(ticket.booking?.trip?.price || route?.price)} />
          <Input value={passenger} onChange={(e) => setPassenger(e.target.value)} placeholder={t("passenger")} />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone")} />
        </Card>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" loading={saving} onClick={save}>
            {t("update")}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => router.push(`/cancel/summary?ticket=${encodeURIComponent(ticket.ticketNo || "")}`)}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </Protected>
  );
}
