"use client";

import { BRAND_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import biftuLogo from "@/app/assets/biftu-bus.png";

type BrandLogoProps = {
  className?: string;
  imgClassName?: string;
  onDark?: boolean;
};

export function BrandLogo({ className, imgClassName, onDark = false }: BrandLogoProps) {
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
        <span className="text-[#002366]">BIFTU</span>{" "}
        <span className="text-[#f2b31a]">BUS</span>
      </span>
    </span>
  );
}
