"use client";

import { useEffect, useRef } from "react";

/**
 * Layered, animated backdrop for the Home hero: gradient sky, drifting
 * clouds, a soft horizon glow, two mountain silhouettes, and a converging
 * road — each layer moves at a different rate on scroll for a cheap-but
 * -effective parallax. Purely decorative (aria-hidden); all real content
 * renders on top of it.
 */
export function CinematicSkyline() {
  const farRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = Math.min(window.scrollY, 600);
        if (farRef.current) farRef.current.style.transform = `translateY(${y * 0.08}px)`;
        if (nearRef.current) nearRef.current.style.transform = `translateY(${y * 0.16}px)`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* sky gradient — deep teal to a warm golden horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0e463f 0%, #146b5f 20%, #1c9484 42%, #5ecdb8 64%, #cdeee0 82%, #fdf3dd 100%)",
        }}
      />

      {/* soft horizon sun glow */}
      <div
        className="absolute left-1/2 top-[58%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full blur-3xl sm:h-[34rem] sm:w-[34rem]"
        style={{ background: "radial-gradient(circle, rgba(255,224,168,0.85) 0%, rgba(255,224,168,0) 70%)" }}
      />

      {/* drifting clouds */}
      <div className="absolute inset-x-0 top-[8%] h-24">
        <div className="absolute h-10 w-40 rounded-full bg-white/40 blur-xl animate-[cloudDriftSlow_50s_linear_infinite]" style={{ left: "-10%" }} />
        <div className="absolute h-8 w-32 rounded-full bg-white/30 blur-xl animate-[cloudDriftSlow_65s_linear_infinite]" style={{ left: "30%", animationDelay: "-20s" }} />
        <div className="absolute h-12 w-48 rounded-full bg-white/30 blur-2xl animate-[cloudDriftSlow_80s_linear_infinite]" style={{ left: "60%", animationDelay: "-40s" }} />
      </div>

      {/* far mountains */}
      <div ref={farRef} className="absolute inset-x-0 bottom-[22%] transition-transform duration-75 ease-out sm:bottom-[26%]">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="h-32 w-full sm:h-44">
          <path d="M0 200 L0 120 L180 60 L340 130 L520 40 L720 110 L900 30 L1100 120 L1260 70 L1440 130 L1440 200Z" fill="#1c9484" fillOpacity="0.35" />
        </svg>
      </div>

      {/* near mountains / hills */}
      <div ref={nearRef} className="absolute inset-x-0 bottom-[14%] transition-transform duration-75 ease-out sm:bottom-[17%]">
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="h-24 w-full sm:h-32">
          <path d="M0 160 L0 90 L220 40 L460 100 L680 30 L940 95 L1180 45 L1440 100 L1440 160Z" fill="#0e463f" fillOpacity="0.3" />
        </svg>
      </div>

      {/* atmospheric light rays */}
      <div
        className="absolute left-1/2 top-0 h-full w-[140%] -translate-x-1/2 opacity-[0.12]"
        style={{
          background:
            "repeating-linear-gradient(100deg, transparent 0, transparent 60px, rgba(255,255,255,0.6) 60px, transparent 130px)",
        }}
      />

      {/* road, converging toward the horizon */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] [perspective:500px] sm:h-[34%]">
        <div
          className="absolute inset-x-0 bottom-0 h-full origin-bottom"
          style={{
            background: "linear-gradient(180deg, rgba(14,70,63,0.75) 0%, rgba(10,42,82,0.92) 100%)",
            clipPath: "polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-full w-[6%] -translate-x-1/2 origin-bottom overflow-hidden"
          style={{ clipPath: "polygon(20% 0%, 80% 0%, 220% 100%, -120% 100%)" }}
        >
          <div
            className="absolute inset-0 animate-[roadDashes_1.1s_linear_infinite]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, #fdf3dd 0 10%, transparent 10% 26%)",
              backgroundSize: "100% 40px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
