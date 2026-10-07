"use client";

import { Button, Input, Modal, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { setBookingSession } from "@/lib/storage";
import type { RescheduleContext, Ticket } from "@/lib/types";
import { cn, formatMoney, parsePassengerNames, parseSelectedRoute } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "number" | "penalty";

/**
 * Entry point for rescheduling a ticket, used both from Booking Detail
 * (ticket already known — starts at the penalty step) and from Home (agent
 * types a ticket number first). Either way it ends by seeding a reschedule-
 * flagged booking session and sending the agent into the normal booking
 * flow (route/date → seats → passengers → payment) to pick the new trip.
 */
export function RescheduleEntryModal({
  open,
  onClose,
  ticket,
  onConfirmed,
}: {
  open: boolean;
  onClose: () => void;
  ticket?: Ticket;
  /** Called instead of navigating when the modal is already on /home. */
  onConfirmed?: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState<Step>(ticket ? "penalty" : "number");
  const [ticketNoInput, setTicketNoInput] = useState("");
  const [foundTicket, setFoundTicket] = useState<Ticket | null>(ticket ?? null);
  const [looking, setLooking] = useState(false);
  const [penalty, setPenalty] = useState<0 | 50>(0);

  function reset() {
    setStep(ticket ? "penalty" : "number");
    setTicketNoInput("");
    setFoundTicket(ticket ?? null);
    setPenalty(0);
  }

  function close() {
    reset();
    onClose();
  }

  async function findTicket() {
    const no = ticketNoInput.trim();
    if (!no) return;
    setLooking(true);
    try {
      const result = await api.getTicketByNumber(no);
      if (!result?.id) {
        toast.error(t("reschedule_ticket_not_found"));
        return;
      }
      setFoundTicket(result);
      setStep("penalty");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("reschedule_ticket_not_found"));
    } finally {
      setLooking(false);
    }
  }

  function confirm() {
    const target = foundTicket;
    if (!target) return;
    const booking = target.booking;
    const route = booking?.parseSelectedRoute || parseSelectedRoute(booking?.selectedRoute);
    const fromCity = route?.from || booking?.trip?.from || "";
    const toCity = route?.to || booking?.trip?.to || "";
    const originalPrice = booking?.trip?.price ?? route?.price;

    const reschedule: RescheduleContext = {
      originalTicketId: target.id,
      originalTicketNo: target.ticketNo,
      originalBookingId: booking?.id,
      penalty,
      originalPassengers: booking?.passengers,
      originalPhoneNumber: booking?.phoneNumber,
      originalPrice,
    };

    setBookingSession({
      fromCity,
      toCity,
      selectedSeats: [],
      reschedule,
    });
    close();
    if (onConfirmed) {
      onConfirmed();
    } else {
      router.push("/home");
    }
  }

  const passengerLabel = foundTicket
    ? foundTicket.passenger || parsePassengerNames(foundTicket.booking?.passengers).join(", ") || "-"
    : "-";
  const route = foundTicket
    ? foundTicket.booking?.parseSelectedRoute || parseSelectedRoute(foundTicket.booking?.selectedRoute)
    : undefined;
  const routeLabel = foundTicket ? `${route?.from || foundTicket.booking?.trip?.from || "-"} → ${route?.to || foundTicket.booking?.trip?.to || "-"}` : "-";
  const originalPrice = foundTicket?.booking?.trip?.price ?? route?.price ?? 0;
  const penaltyCharge = Math.round(originalPrice * 0.5);

  return (
    <Modal
      open={open}
      onClose={close}
      title={t("reschedule")}
      subtitle={step === "number" ? t("reschedule_find_ticket_subtitle") : foundTicket?.ticketNo}
      footer={
        step === "number" ? (
          <>
            <Button variant="ghost" className="flex-1" onClick={close}>
              {t("cancel_button")}
            </Button>
            <Button className="flex-1" loading={looking} disabled={!ticketNoInput.trim()} onClick={findTicket}>
              {t("find_ticket")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="flex-1" onClick={close}>
              {t("cancel_button")}
            </Button>
            <Button className="flex-1" onClick={confirm}>
              {t("reschedule_continue")}
            </Button>
          </>
        )
      }
    >
      {step === "number" ? (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">{t("reschedule_find_ticket_hint")}</p>
          <Input
            placeholder={t("tikect_number")}
            value={ticketNoInput}
            onChange={(e) => setTicketNoInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findTicket()}
            autoFocus
          />
          {looking ? <Spinner /> : null}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="space-y-1 rounded-lg border border-border p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{t("passenger")}</span>
              <span className="font-semibold text-navy">{passengerLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{`${t("from")}/${t("to")}`}</span>
              <span className="font-semibold text-navy">{routeLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{t("price")}</span>
              <span className="font-semibold text-navy">{formatMoney(originalPrice)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-navy">{t("reschedule_select_penalty")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([0, 50] as const).map((option) => {
                const active = penalty === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPenalty(option)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition",
                      active ? "border-primary bg-primary-soft/60" : "border-border hover:bg-surface-muted",
                    )}
                  >
                    <p className={cn("text-base font-bold", active ? "text-primary" : "text-navy")}>{option}%</p>
                    <p className="text-xs text-text-muted">
                      {option === 0 ? t("penalty_0_hint") : `${t("penalty_50_hint")} · ${formatMoney(penaltyCharge)}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
