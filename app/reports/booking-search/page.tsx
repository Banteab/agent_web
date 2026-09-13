"use client";

import { Protected } from "@/components/protected";
import {
  Badge,
  Button,
  Card,
  DetailRow,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  SectionLabel,
  Spinner,
  StatusBadge,
  TableFrame,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { formatDisplayDateValue, formatMoney, parsePassengerNames } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const CLOSED_STATUSES = new Set(["CANCELLED", "CANCELED", "REJECTED", "EXPIRED"]);

function passengerLabel(booking: Booking) {
  return parsePassengerNames(booking.passengers).join(", ") || "-";
}

function routeLabel(booking: Booking) {
  const from = booking.trip?.from;
  const to = booking.trip?.to;
  if (!from && !to) return "-";
  return `${from || "-"} → ${to || "-"}`;
}

function agentLabel(booking: Booking) {
  const name = `${booking.agent?.firstName || ""} ${booking.agent?.lastName || ""}`.trim();
  return name || "-";
}

function isOwnBooking(booking: Booking, agentId?: number) {
  return agentId != null && booking.agent?.id === agentId;
}

export default function BookingSearchPage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [passenger, setPassenger] = useState("");
  const [results, setResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    const trimmedPassenger = passenger.trim();
    if (!trimmedPhone && !trimmedPassenger) {
      toast.error(t("booking_search_empty_query"));
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchBookings({ phone: trimmedPhone, passenger: trimmedPassenger });
      setResults(data);
      setSearched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <div className="mx-auto max-w-5xl">
        <PageHeader title={t("booking_search")} subtitle={t("booking_search_subtitle")} backHref="/menu" />

        <Card className="mb-4">
          <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={onSubmit}>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-text-muted">{t("phone")}</span>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("booking_search_phone_placeholder")}
                inputMode="tel"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-text-muted">{t("passenger_name")}</span>
              <Input
                value={passenger}
                onChange={(e) => setPassenger(e.target.value)}
                placeholder={t("booking_search_name_placeholder")}
              />
            </label>
            <Button type="submit" loading={loading}>
              {t("search")}
            </Button>
          </form>
        </Card>

        {loading ? <Spinner label={t("booking_search")} /> : null}

        {!loading && searched && !results.length ? (
          <EmptyState title={t("no_bookings_found")} hint={t("no_bookings_found_hint")} />
        ) : null}

        {!loading && !searched ? (
          <EmptyState title={t("booking_search_hint_title")} hint={t("booking_search_hint")} />
        ) : null}

        {!loading && results.length ? (
          <>
            <TableFrame className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
                  <tr>
                    <th className="px-4 py-3">{t("reservation_no")}</th>
                    <th className="px-4 py-3">{t("passenger")}</th>
                    <th className="px-4 py-3">{t("phone")}</th>
                    <th className="px-4 py-3">{t("from")}/{t("to")}</th>
                    <th className="px-4 py-3">{t("travel_date")}</th>
                    <th className="px-4 py-3">{t("agent")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("booking_date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => setSelected(booking)}
                      className="cursor-pointer align-middle text-text transition hover:bg-surface-muted/60"
                    >
                      <td className="px-4 py-3 font-semibold text-navy">{booking.refNumber || `#${booking.id}`}</td>
                      <td className="px-4 py-3">{passengerLabel(booking)}</td>
                      <td className="px-4 py-3 text-text-muted">{booking.phoneNumber || "-"}</td>
                      <td className="px-4 py-3">{routeLabel(booking)}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDisplayDateValue(booking.trip?.travelDate, locale)}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {isOwnBooking(booking, profile?.id) ? (
                          <span className="font-semibold text-primary">{t("you")}</span>
                        ) : (
                          agentLabel(booking)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDisplayDateValue(booking.firstSeatReserved, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableFrame>

            <div className="space-y-3 md:hidden">
              {results.map((booking) => (
                <Card
                  key={booking.id}
                  className="cursor-pointer space-y-2 text-sm"
                  onClick={() => setSelected(booking)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-navy">{booking.refNumber || `#${booking.id}`}</p>
                      <p className="text-text-muted">{passengerLabel(booking)}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-text-muted">
                    <span>{t("from")}/{t("to")}</span>
                    <span className="text-right font-semibold text-navy">{routeLabel(booking)}</span>
                    <span>{t("phone")}</span>
                    <span className="text-right font-semibold text-navy">{booking.phoneNumber || "-"}</span>
                    <span>{t("travel_date")}</span>
                    <span className="text-right font-semibold text-navy">
                      {formatDisplayDateValue(booking.trip?.travelDate, locale)}
                    </span>
                    <span>{t("agent")}</span>
                    <span className="text-right font-semibold text-navy">
                      {isOwnBooking(booking, profile?.id) ? (
                        <span className="text-primary">{t("you")}</span>
                      ) : (
                        agentLabel(booking)
                      )}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <BookingDetailModal
        booking={selected}
        onClose={() => setSelected(null)}
        t={t}
        locale={locale}
        own={selected ? isOwnBooking(selected, profile?.id) : false}
        onCancelTicket={(ticketNo) => {
          setSelected(null);
          router.push(ticketNo ? `/cancel/summary?ticket=${encodeURIComponent(ticketNo)}` : "/cancel");
        }}
        onViewPendingPayment={() => {
          setSelected(null);
          router.push("/pending-payments");
        }}
      />
    </Protected>
  );
}

function BookingDetailModal({
  booking,
  onClose,
  t,
  locale,
  own,
  onCancelTicket,
  onViewPendingPayment,
}: {
  booking: Booking | null;
  onClose: () => void;
  t: (key: string) => string;
  locale?: string;
  own: boolean;
  onCancelTicket: (ticketNo?: string) => void;
  onViewPendingPayment: () => void;
}) {
  if (!booking) return null;

  const status = (booking.status || "").toUpperCase();
  const isCancellable = own && !CLOSED_STATUSES.has(status);
  const isPendingPayment = own && status.includes("PENDING");

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title={t("reservation_detail")}
      subtitle={`${t("pnr")} ${booking.refNumber || `#${booking.id}`}`}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {t("close")}
          </Button>
          {isPendingPayment ? (
            <Button variant="secondary" className="flex-1" onClick={onViewPendingPayment}>
              {t("pending_payments")}
            </Button>
          ) : null}
          {isCancellable ? (
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => onCancelTicket(booking.ticketNumbers?.[0])}
            >
              {t("cancele_ticket")}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-faint">{t("status")}</span>
          <StatusBadge status={booking.status} />
        </div>

        {own ? (
          <p className="rounded-lg bg-primary-soft/60 px-3.5 py-2.5 text-xs font-medium text-primary">
            {t("your_booking_hint")}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3.5 py-2.5">
            <p className="text-xs font-medium text-text-muted">{t("other_agent_booking_hint")}</p>
            <Badge tone="neutral">{t("view_only")}</Badge>
          </div>
        )}

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <SectionLabel>{t("journey_detail")}</SectionLabel>
          <DetailRow label={t("passenger")} value={passengerLabel(booking)} />
          <DetailRow label={t("phone")} value={booking.phoneNumber} />
          <DetailRow label={`${t("from")}/${t("to")}`} value={routeLabel(booking)} />
          <DetailRow label={t("pickup")} value={booking.pickup} />
          <DetailRow label={t("dropoff")} value={booking.dropoff} />
          <DetailRow label={t("seat_no")} value={booking.seat} />
          <DetailRow label={t("travel_date")} value={formatDisplayDateValue(booking.trip?.travelDate, locale)} />
          <div className="my-1 border-t border-border" />
          <DetailRow label={t("price")} value={formatMoney(booking.price)} strong={false} />
        </div>

        <div className="space-y-1 rounded-lg border border-border p-3.5">
          <SectionLabel>{t("booking_date")}</SectionLabel>
          <DetailRow label={t("booking_date")} value={formatDisplayDateValue(booking.firstSeatReserved, locale)} />
          {booking.bank ? <DetailRow label={t("bank")} value={booking.bank} /> : null}
          {booking.bankReferenceNumber ? (
            <DetailRow label={t("bank_transaction_number")} value={booking.bankReferenceNumber} />
          ) : null}
        </div>

        <div className="space-y-1 rounded-lg border border-primary/20 bg-primary-soft/50 p-3.5">
          <SectionLabel>{t("agent")}</SectionLabel>
          <DetailRow label={t("name")} value={agentLabel(booking)} />
          <DetailRow label={t("phone")} value={booking.agent?.phoneNo} />
        </div>
      </div>
    </Modal>
  );
}
