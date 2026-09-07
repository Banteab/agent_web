"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

export function Button({
  children,
  className,
  variant = "primary",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-primary text-gold hover:bg-primary-dark",
        variant === "secondary" && "bg-navy text-white hover:bg-navy/90",
        variant === "ghost" && "bg-white text-navy ring-1 ring-slate-200 hover:bg-slate-50",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-semibold text-slate-600">{label}</span> : null}
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-12 w-full rounded-full border border-transparent bg-slate-100 px-4 text-sm text-slate-800 outline-none ring-primary/0 transition placeholder:text-slate-500 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-12 w-full rounded-full border border-transparent bg-slate-100 px-4 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20",
        props.className,
      )}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5", className)}>
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-primary">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      {label ? <p className="text-sm text-slate-500">{label}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gold shadow-sm ring-1 ring-slate-100"
          >
            ←
          </Link>
        ) : null}
        <h1 className="text-lg font-bold text-navy sm:text-xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}
