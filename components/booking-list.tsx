"use client";

import { Card, StatusBadge, TableFrame } from "@/components/ui";
import type { BookingRow } from "@/lib/booking-rows";
import { formatDisplayDateValue, formatMoney } from "@/lib/utils";

function reservationLabel(row: BookingRow) {
  return row.refNumber || row.ticketNo || (row.bookingId ? `#${row.bookingId}` : "-");
}

function routeLabel(row: BookingRow) {
  if (!row.from && !row.to) return "-";
  return `${row.from || "-"} → ${row.to || "-"}`;
}

type ListProps = {
  rows: BookingRow[];
  onSelect: (row: BookingRow) => void;
  showAgentColumn: boolean;
  t: (key: string) => string;
  locale?: string;
};

export function BookingTable({ rows, onSelect, showAgentColumn, t, locale }: ListProps) {
  return (
    <TableFrame className="hidden md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-faint">
          <tr>
            <th className="px-4 py-3">{t("reservation_no")}</th>
            <th className="px-4 py-3">{t("passenger")}</th>
            <th className="px-4 py-3">{t("phone")}</th>
            <th className="px-4 py-3">
              {t("from")}/{t("to")}
            </th>
            <th className="px-4 py-3">{t("travel_date")}</th>
            {showAgentColumn ? <th className="px-4 py-3">{t("agent")}</th> : null}
            <th className="px-4 py-3">{t("status")}</th>
            <th className="px-4 py-3 text-right">{t("amount")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => (
            <tr
              key={row.key}
              onClick={() => onSelect(row)}
              className="cursor-pointer align-middle text-text opacity-0 transition hover:bg-surface-muted/60 animate-[riseIn_320ms_ease-out_forwards]"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <td className="px-4 py-3 font-semibold text-navy">{reservationLabel(row)}</td>
              <td className="px-4 py-3">{row.passenger}</td>
              <td className="px-4 py-3 text-text-muted">{row.phone || "-"}</td>
              <td className="px-4 py-3">{routeLabel(row)}</td>
              <td className="px-4 py-3 text-text-muted">{formatDisplayDateValue(row.travelDate, locale)}</td>
              {showAgentColumn ? (
                <td className="px-4 py-3 text-text-muted">
                  {row.isOwn ? <span className="font-semibold text-primary">{t("you")}</span> : row.agentName || "-"}
                </td>
              ) : null}
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-right font-semibold text-navy">{formatMoney(row.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}

export function BookingCardList({ rows, onSelect, showAgentColumn, t, locale }: ListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row, index) => (
        <Card
          key={row.key}
          className="cursor-pointer space-y-2 text-sm opacity-0 transition animate-[riseIn_320ms_ease-out_forwards]"
          style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
          onClick={() => onSelect(row)}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-navy">{reservationLabel(row)}</p>
              <p className="text-text-muted">{row.passenger}</p>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-text-muted">
            <span>
              {t("from")}/{t("to")}
            </span>
            <span className="text-right font-semibold text-navy">{routeLabel(row)}</span>
            <span>{t("phone")}</span>
            <span className="text-right font-semibold text-navy">{row.phone || "-"}</span>
            <span>{t("travel_date")}</span>
            <span className="text-right font-semibold text-navy">{formatDisplayDateValue(row.travelDate, locale)}</span>
            {showAgentColumn ? (
              <>
                <span>{t("agent")}</span>
                <span className="text-right font-semibold text-navy">
                  {row.isOwn ? <span className="text-primary">{t("you")}</span> : row.agentName || "-"}
                </span>
              </>
            ) : null}
            <span>{t("amount")}</span>
            <span className="text-right font-semibold text-navy">{formatMoney(row.price)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
