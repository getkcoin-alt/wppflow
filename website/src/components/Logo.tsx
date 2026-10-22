export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3E3BC" />
          <stop offset=".55" stopColor="#D2B06A" />
          <stop offset="1" stopColor="#A8843F" />
        </linearGradient>
        <linearGradient id="lg-t" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#202427" />
          <stop offset="1" stopColor="#0A0B0C" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill="url(#lg-t)" />
      <path d="M10 14.5H17.5L22 31.5L26.5 21L31 31.5L38 14.5" fill="none" stroke="url(#lg-g)" strokeWidth="3.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
