"use client";

import { BRAND_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import biftuLogo from "@/app/assets/biftu-bus.png";

type BrandLogoProps = {
  className?: string;
  imgClassName?: string;
  onDark?: boolean;
  /** Mark only, no wordmark underneath — for inline use next to separate text (sidebar/header). */
  compact?: boolean;
};

export function BrandLogo({ className, imgClassName, onDark = false, compact = false }: BrandLogoProps) {
  if (compact) {
    return (
      <Image
        src={biftuLogo}
        alt={BRAND_NAME}
        className={cn("h-8 w-8 shrink-0 rounded-lg object-contain", imgClassName, className)}
        priority
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center gap-2",
        onDark && "rounded-2xl bg-white px-3 py-2 shadow-sm",
        className,
      )}
    >
      <Image
        src={biftuLogo}
        alt={BRAND_NAME}
        className={cn("h-16 w-auto object-contain sm:h-20", imgClassName)}
        priority
      />
      <span className="text-xl font-black italic tracking-wide">
        <span className="text-navy">BIFTU</span> <span className="text-gold-ink">BUS</span>
      </span>
    </span>
  );
}
