"use client";

import { BookingDetailModal } from "@/components/booking-detail-modal";
import { BookingCardList, BookingTable } from "@/components/booking-list";
import { DateTriggerBox, EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { Card, EmptyState, Input, PageHeader, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  fromPendingBooking,
  fromSearchBooking,
  fromTicket,
  isClosedStatus,
  type BookingRow,
} from "@/lib/booking-rows";
import { formatEthiopianDate } from "@/lib/ethiopian-calendar";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { formatDateISO } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type StatusFilter = "" | "booked" | "pending" | "cancelled";

function matchesStatusFilter(row: BookingRow, filter: StatusFilter) {
  if (!filter) return true;
  if (filter === "pending") return row.kind === "pending";
  if (filter === "cancelled") return isClosedStatus(row.status);
  return row.kind === "ticket" && !isClosedStatus(row.status);
}

function ManageBookings() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [ownRows, setOwnRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "",
  );
  const [routeFilter, setRouteFilter] = useState("");
  const [travelDate, setTravelDate] = useState("");

  const [searchAllAgents, setSearchAllAgents] = useState(false);
  const [searchRows, setSearchRows] = useState<BookingRow[]>([]);
  const [searchRawByKey, setSearchRawByKey] = useState<Map<string, Booking>>(new Map());
  const [searching, setSearching] = useState(false);
  const [searchUnavailable, setSearchUnavailable] = useState(false);

  const [modalBooking, setModalBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getBookedTickets(), api.getCancelledTickets(), api.getPendingBankPayments()])
      .then(([booked, cancelled, pending]) => {
        setOwnRows([
          ...booked.map(fromTicket),
          ...cancelled.map(fromTicket),
          ...pending.map(fromPendingBooking),
        ]);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : t("error_occured")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownBookingIds = useMemo(() => new Set(ownRows.map((r) => r.bookingId).filter(Boolean)), [ownRows]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!searchAllAgents || !trimmed) {
      setSearchRows([]);
      setSearchRawByKey(new Map());
      setSearchUnavailable(false);
      return;
    }
    const isPhoneLike = /^[\d+][\d\s-]{3,}$/.test(trimmed);
    setSearching(true);
    setSearchUnavailable(false);
    const params = isPhoneLike ? { phone: trimmed } : { passenger: trimmed };
    api
      .searchBookings(params)
      .then((results) => {
        const filtered = results.filter((b) => !ownBookingIds.has(b.id));
        setSearchRows(filtered.map((b) => fromSearchBooking(b, profile?.id)));
        setSearchRawByKey(new Map(filtered.map((b) => [`search-${b.id}`, b])));
      })
      .catch(() => {
        setSearchUnavailable(true);
        setSearchRows([]);
        setSearchRawByKey(new Map());
      })
      .finally(() => setSearching(false));
  }, [searchAllAgents, query, ownBookingIds, profile?.id]);

  const routeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of ownRows) {
      if (row.from || row.to) set.add(`${row.from || "-"} → ${row.to || "-"}`);
    }
    return Array.from(set).sort();
  }, [ownRows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const combined = [...ownRows, ...searchRows];
    return combined.filter((row) => {
      if (!matchesStatusFilter(row, statusFilter)) return false;
      if (routeFilter && `${row.from || "-"} → ${row.to || "-"}` !== routeFilter) return false;
      if (travelDate && (row.travelDate || "").slice(0, 10) !== travelDate) return false;
      if (!needle) return true;
      const haystack = [row.refNumber, row.ticketNo, row.passenger, row.phone, row.bookingId ? String(row.bookingId) : ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [ownRows, searchRows, query, statusFilter, routeFilter, travelDate]);

  function openRow(row: BookingRow) {
    if (row.viaSearch) {
      setModalBooking(searchRawByKey.get(row.key) || null);
      return;
    }
    if (row.kind === "ticket" && row.ticketNo) {
      router.push(`/bookings/ticket/${encodeURIComponent(row.ticketNo)}`);
    } else if (row.kind === "pending" && row.bookingId) {
      router.push(`/bookings/pending/${row.bookingId}`);
    }
  }

  const showAgentColumn = searchRows.length > 0;
  const isBusy = loading || searching;

  return (
    <div>
      <PageHeader title={t("manage_bookings")} subtitle={t("manage_bookings_subtitle")} />

      <Card className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder={t("search_bookings_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="">{t("all_statuses")}</option>
            <option value="booked">{t("booked")}</option>
            <option value="pending">{t("pending_payment")}</option>
            <option value="cancelled">{t("cancelled")}</option>
          </Select>
          <Select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
            <option value="">{t("filter_by_route")}</option>
            {routeOptions.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </Select>
          {locale?.startsWith("am") ? (
            <div className="flex items-center gap-1.5">
              <EthiopianDatePicker value={travelDate || formatDateISO(new Date())} onChange={setTravelDate}>
                <DateTriggerBox
                  label={travelDate ? formatEthiopianDate(new Date(`${travelDate}T00:00:00`)) : t("travel_date")}
                />
              </EthiopianDatePicker>
              {travelDate ? (
                <button
                  type="button"
                  onClick={() => setTravelDate("")}
                  aria-label={t("clear")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-surface-muted hover:text-danger"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : (
            <Input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              aria-label={t("travel_date")}
            />
          )}
        </div>
        <label className="flex items-center gap-2 text-[13px] font-medium text-text-muted">
          <input
            type="checkbox"
            checked={searchAllAgents}
            onChange={(e) => setSearchAllAgents(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary-soft"
          />
          {t("search_all_agents")}
        </label>
        {searchAllAgents && searchUnavailable ? (
          <p className="text-xs text-text-faint">{t("cross_agent_search_unavailable")}</p>
        ) : null}
      </Card>

      {isBusy ? <Spinner label={t("manage_bookings")} /> : null}

      {!isBusy && !filtered.length ? (
        <EmptyState title={t("no_bookings_found")} hint={t("no_bookings_found_hint")} />
      ) : null}

      {!isBusy && filtered.length ? (
        <>
          <BookingTable rows={filtered} onSelect={openRow} showAgentColumn={showAgentColumn} t={t} locale={locale} />
          <BookingCardList rows={filtered} onSelect={openRow} showAgentColumn={showAgentColumn} t={t} locale={locale} />
        </>
      ) : null}

      <BookingDetailModal
        booking={modalBooking}
        onClose={() => setModalBooking(null)}
        t={t}
        locale={locale}
        own={profile?.id != null && modalBooking?.agent?.id === profile.id}
        onCancelTicket={(ticketNo) => {
          setModalBooking(null);
          router.push(ticketNo ? `/bookings/ticket/${encodeURIComponent(ticketNo)}` : "/bookings");
        }}
        onViewPendingPayment={() => {
          setModalBooking(null);
          if (modalBooking?.id) router.push(`/bookings/pending/${modalBooking.id}`);
        }}
      />
    </div>
  );
}

export default function ManageBookingsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ManageBookings />
    </Suspense>
  );
}
