"use client";

import { Button, Field, Modal, StatusBadge, Textarea } from "@/components/ui";
import { useState } from "react";

/**
 * The "Request Cancellation" action from Booking Detail — same reason-first
 * flow as the old standalone /cancel/summary page, just surfaced as a modal
 * over the booking you're already looking at instead of a separate page you
 * navigate to with a ticket number in the URL.
 */
export function CancelReasonPanel({
  open,
  ticketNo,
  status,
  cancelling,
  onCancel,
  onClose,
  t,
}: {
  open: boolean;
  ticketNo?: string;
  status?: string;
  cancelling: boolean;
  onCancel: (reason: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("request_cancellation")}
      subtitle={ticketNo ? `${t("ticket_no")} ${ticketNo}` : undefined}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={cancelling}>
            {t("cancel_button")}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={cancelling}
            disabled={!reason.trim()}
            onClick={() => onCancel(reason.trim())}
          >
            {t("cancel_this_ticket")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-faint">{t("status")}</span>
          <StatusBadge status={status} />
        </div>
        <Field label={t("cancellation_reason")} required>
          <Textarea
            placeholder={t("cancellation_reason_placeholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </Field>
      </div>
    </Modal>
  );
}
