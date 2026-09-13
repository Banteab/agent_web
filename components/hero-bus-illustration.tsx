export function HeroBusIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 300" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="busBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#254a7a" />
          <stop offset="100%" stopColor="#122a52" />
        </linearGradient>
        <linearGradient id="busGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf1f6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8fb4d6" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="headlightGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6df" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff6df" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="215" cy="262" rx="150" ry="16" fill="#122a52" fillOpacity="0.18" />

      {/* bus body — tilted 3/4 view for depth */}
      <g transform="translate(58 70)">
        <rect x="0" y="40" width="300" height="100" rx="20" fill="url(#busBody)" />
        <path d="M0 60 L26 18 Q34 8 48 8 H260 Q272 8 278 20 L300 60Z" fill="url(#busBody)" />

        {/* windshield + windows */}
        <path d="M14 58 L34 22 Q39 14 48 14 H96 V58Z" fill="url(#busGlass)" />
        <rect x="108" y="14" width="52" height="44" rx="6" fill="url(#busGlass)" />
        <rect x="168" y="14" width="52" height="44" rx="6" fill="url(#busGlass)" />
        <rect x="228" y="14" width="52" height="44" rx="6" fill="url(#busGlass)" />

        {/* teal accent stripe */}
        <rect x="0" y="88" width="300" height="10" fill="#0d9488" />

        {/* door */}
        <rect x="18" y="66" width="26" height="70" rx="4" fill="#122a52" stroke="#0d9488" strokeOpacity="0.5" />

        {/* headlight + glow */}
        <circle cx="310" cy="118" r="40" fill="url(#headlightGlow)" />
        <circle cx="290" cy="118" r="7" fill="#ffffff" />

        {/* wheels */}
        <circle cx="70" cy="142" r="24" fill="#122a52" stroke="#254a7a" strokeWidth="6" />
        <circle cx="70" cy="142" r="9" fill="#5b6c72" />
        <circle cx="234" cy="142" r="24" fill="#122a52" stroke="#254a7a" strokeWidth="6" />
        <circle cx="234" cy="142" r="9" fill="#5b6c72" />
      </g>

      {/* motion lines */}
      <g stroke="#0d9488" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round">
        <path d="M20 130h34" />
        <path d="M10 152h26" />
        <path d="M28 174h20" />
      </g>
    </svg>
  );
}
