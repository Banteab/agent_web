export function SupportIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 280" fill="none" className={className} aria-hidden="true">
      {/* backdrop card */}
      <rect x="18" y="18" width="284" height="244" rx="28" fill="white" fillOpacity="0.06" />
      <rect x="18" y="18" width="284" height="244" rx="28" stroke="white" strokeOpacity="0.14" />

      {/* soft glow accents */}
      <circle cx="252" cy="56" r="34" fill="#eab308" fillOpacity="0.18" />
      <circle cx="52" cy="216" r="26" fill="#dc2626" fillOpacity="0.16" />

      {/* agent shoulders + head */}
      <path d="M96 232c0-33.1 26.9-60 60-60s60 26.9 60 60" fill="white" fillOpacity="0.12" />
      <path d="M96 232c0-33.1 26.9-60 60-60s60 26.9 60 60" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="156" cy="122" r="38" fill="white" fillOpacity="0.14" />
      <circle cx="156" cy="122" r="38" stroke="white" strokeOpacity="0.35" strokeWidth="2" />

      {/* headset */}
      <path
        d="M118 112a38 38 0 0 1 76 0"
        stroke="#eab308"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="110" y="108" width="16" height="26" rx="8" fill="#eab308" />
      <rect x="186" y="108" width="16" height="26" rx="8" fill="#eab308" />
      <path d="M202 128c14 2 20 12 18 26" stroke="#eab308" strokeWidth="5" strokeLinecap="round" />
      <circle cx="220" cy="156" r="6" fill="#eab308" />

      {/* chat bubble */}
      <rect x="196" y="46" width="86" height="58" rx="16" fill="white" />
      <path d="M214 104l-10 16 22-10z" fill="white" />
      <circle cx="220" cy="75" r="5" fill="#0a5fa0" />
      <circle cx="239" cy="75" r="5" fill="#0a5fa0" />
      <circle cx="258" cy="75" r="5" fill="#dc2626" />

      {/* base line */}
      <path d="M50 262h220" stroke="white" strokeOpacity="0.16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
