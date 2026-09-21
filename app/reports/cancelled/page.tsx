"use client";

import { BookingCardList, BookingTable } from "@/components/booking-list";
import { DateTriggerBox, EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { Protected } from "@/components/protected";
import { Button, Card, EmptyState, Input, PageHeader, SectionLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fromTicket, type BookingRow } from "@/lib/booking-rows";
import { formatEthiopianDate } from "@/lib/ethiopian-calendar";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { formatDateISO, formatDisplayDateValue, formatMoney } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function CancelReportPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const today = formatDateISO(new Date());
  const [date, setDate] = useState(today);
  const [searchedDate, setSearchedDate] = useState<string | null>(null);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const all: Awaited<ReturnType<typeof api.getCancelledTickets>>["data"] = [];
      let page = 1;
      while (true) {
        const batch = await api.getCancelledTickets(page, 100);
        all.push(...batch.data);
        if (!batch.hasMore) break;
        page += 1;
      }
      setRows(all.map(fromTicket));
      setSearchedDate(date);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_occured"));
    } finally {
      setLoading(false);
    }
  }

  const dayRows = useMemo(
    () => rows.filter((row) => (row.travelDate || "").slice(0, 10) === searchedDate),
    [rows, searchedDate],
  );
  const dayTotal = useMemo(() => dayRows.reduce((sum, row) => sum + Number(row.price || 0), 0), [dayRows]);

  function openRow(row: BookingRow) {
    if (row.ticketNo) router.push(`/bookings/ticket/${row.ticketNo}`);
  }

  return (
    <Protected>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("cancel_report")} backHref="/home" />
        <Card className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          {locale?.startsWith("am") ? (
            <EthiopianDatePicker value={date} onChange={setDate}>
              <DateTriggerBox label={formatEthiopianDate(new Date(`${date}T00:00:00`))} />
            </EthiopianDatePicker>
          ) : (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
          <Button onClick={load} loading={loading}>
            {t("search")}
          </Button>
        </Card>

        {searchedDate ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>{formatDisplayDateValue(searchedDate, locale)}</SectionLabel>
              <div className="text-right">
                <p className="text-xs font-medium text-text-faint">
                  {dayRows.length} {t("ticket")}
                </p>
                <p className="font-bold text-danger">{formatMoney(dayTotal)}</p>
              </div>
            </div>
            {loading ? <Spinner /> : null}
            {!loading && !dayRows.length ? <EmptyState title={t("no_cancel_report")} /> : null}
            {!loading && dayRows.length ? (
              <>
                <BookingTable rows={dayRows} onSelect={openRow} showAgentColumn={false} t={t} locale={locale} />
                <BookingCardList rows={dayRows} onSelect={openRow} showAgentColumn={false} t={t} locale={locale} />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </Protected>
  );
}
