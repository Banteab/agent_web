"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" && "min-h-10 px-4",
        size === "sm" && "min-h-8 px-3 text-[13px]",
        variant === "primary" && "bg-primary text-white hover:bg-primary-dark",
        variant === "secondary" && "bg-navy text-white hover:bg-navy/90",
        variant === "ghost" && "border border-border bg-surface text-text hover:bg-surface-muted",
        variant === "danger" && "bg-danger text-white hover:bg-danger/90",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        children
      )}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-[13px] font-medium text-text-muted">
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? <span className="block text-xs text-text-faint">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-10 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text outline-none transition placeholder:text-text-faint focus:border-primary focus:ring-[3px] focus:ring-primary-soft",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-text-faint focus:border-primary focus:ring-[3px] focus:ring-primary-soft",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "min-h-10 w-full appearance-none rounded-lg border border-border bg-surface pl-3.5 pr-9 text-sm text-text outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary-soft",
          props.className,
        )}
      />
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed py-14 text-center">
      <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-text-faint">
        {icon || <DefaultEmptyIcon />}
      </span>
      <p className="text-sm font-semibold text-text">{title}</p>
      {hint ? <p className="max-w-xs text-sm text-text-muted">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 10h18M8 4h8" />
    </svg>
  );
}

export function ErrorState({
  title,
  hint,
  onRetry,
}: {
  title: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 border-danger-soft bg-danger-soft/40 py-14 text-center">
      <p className="text-sm font-semibold text-danger">{title}</p>
      {hint ? <p className="max-w-xs text-sm text-text-muted">{hint}</p> : null}
      {onRetry ? (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

const badgeTones = {
  neutral: "bg-surface-muted text-text-muted",
  info: "bg-info-soft text-info",
  pending: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "primary" | "gold";
  hint?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex items-start gap-3 border-t-[3px] transition hover:-translate-y-0.5 hover:shadow-md",
        tone === "primary" && "border-t-primary",
        tone === "gold" && "border-t-gold",
        tone === "neutral" && "border-t-border-strong",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" && "bg-primary-soft text-primary",
            tone === "gold" && "bg-gold/10 text-gold",
            tone === "neutral" && "bg-surface-muted text-text-muted",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-text-faint">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-navy">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
      </div>
    </Card>
  );
}

export function DetailRow({
  label,
  value,
  strong = true,
}: {
  label: string;
  value?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className={cn("text-right", strong ? "font-semibold text-text" : "text-text-muted")}>
        {value || value === 0 ? value : "-"}
      </span>
    </div>
  );
}

export function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">{children}</h2>
      {action}
    </div>
  );
}

const STATUS_TONE: Record<string, keyof typeof badgeTones> = {
  ACTIVE: "success",
  BOOKED: "success",
  PAID: "success",
  CONFIRMED: "success",
  SEAT_ADDED: "info",
  PENDING: "pending",
  PENDING_PAYMENT: "pending",
  CANCELLED: "danger",
  CANCELED: "danger",
  REJECTED: "danger",
  EXPIRED: "danger",
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge tone="neutral">-</Badge>;
  const key = status.trim().toUpperCase().replace(/\s+/g, "_");
  const tone = STATUS_TONE[key] || "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

export function TableFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-navy/45" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90dvh] w-full animate-[modalIn_180ms_ease-out] flex-col rounded-t-2xl border border-border bg-surface shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-text">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-surface-muted hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-primary">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      {label ? <p className="text-sm text-text-muted">{label}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
        ) : null}
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-navy sm:text-xl">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
