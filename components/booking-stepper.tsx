"use client";

import { cn } from "@/lib/utils";

export type BookingStep = "seats" | "passengers" | "payment" | "done";

const STEPS: BookingStep[] = ["seats", "passengers", "payment", "done"];

const STEP_LABEL_KEY: Record<BookingStep, string> = {
  seats: "step_seats",
  passengers: "step_passengers",
  payment: "step_payment",
  done: "step_done",
};

export function BookingStepper({ current, t }: { current: BookingStep; t: (key: string) => string }) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <ol className="mb-6 flex items-center" aria-label="Booking progress">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STEPS.length - 1;
        return (
          <li key={step} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                  isDone && "border-success bg-success text-white",
                  isCurrent && "animate-[dropIn_280ms_ease-out] border-primary bg-primary text-white ring-4 ring-primary/15",
                  !isDone && !isCurrent && "border-border bg-surface text-text-faint",
                )}
              >
                {isDone ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="animate-[scaleCheck_320ms_ease-out]"
                  >
                    <path d="m5 13 4 4 10-10" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  isCurrent ? "text-primary" : isDone ? "text-success" : "text-text-faint",
                )}
              >
                {t(STEP_LABEL_KEY[step])}
              </span>
            </div>
            {!isLast ? (
              <span
                className={cn(
                  "mx-1.5 mb-4 h-0.5 flex-1 rounded-full transition-colors sm:mx-2.5",
                  isDone ? "bg-success" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
