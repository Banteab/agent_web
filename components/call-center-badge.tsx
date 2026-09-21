"use client";

import { useI18n } from "@/lib/i18n";

const CALL_CENTER_NUMBER = "8744";

export function CallCenterBadge({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <a
      href={`tel:${CALL_CENTER_NUMBER}`}
      className={`group absolute z-10 flex items-center gap-2.5 rounded-full border border-white/25 bg-white/15 py-2 pl-2.5 pr-4 shadow-lg shadow-navy/20 backdrop-blur-md transition hover:bg-white/25 sm:gap-3 sm:py-2.5 sm:pl-3 sm:pr-5 ${className ?? ""}`}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 sm:h-10 sm:w-10">
        <span className="absolute inline-flex h-full w-full animate-[pulseRing_1.8s_ease-out_infinite] rounded-full bg-[#7ef0d8]/70" />
        <HeadsetIcon className="relative animate-[floatY_3s_ease-in-out_infinite] text-white" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
          {t("call_center_label")}
        </span>
        <span className="block text-base font-extrabold tracking-wide text-white sm:text-lg">{CALL_CENTER_NUMBER}</span>
      </span>
    </a>
  );
}

function HeadsetIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M19.5 19v.5a3 3 0 0 1-3 3h-3" />
    </svg>
  );
}
