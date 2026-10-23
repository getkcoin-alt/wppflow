import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";

/** A gold paper plane (the logo's plane) that glides across the hero along a dashed trail. Decorative. */
export function PlaneTrail({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block ${className}`}>
      <svg viewBox="0 0 820 260" preserveAspectRatio="none" className="absolute left-0 top-10 h-[260px] w-full opacity-60">
        <path className="trail" d="M -40 220 C 120 120, 260 260, 420 140 S 700 40, 860 -30" fill="none" stroke="rgb(var(--c-gold))" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="absolute left-0 top-10 h-[260px] w-full">
        <svg className="plane absolute left-0 top-0 h-7 w-7" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="pl-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F3E3BC" />
              <stop offset=".6" stopColor="#D2B06A" />
              <stop offset="1" stopColor="#A8843F" />
            </linearGradient>
          </defs>
          <path d="M2 11.5 22 3l-6.5 18-4-7.2L2 11.5Z" fill="url(#pl-g)" />
          <path d="M11.5 13.8 22 3 9 12.4l2.5 1.4Z" fill="#2EBE68" fillOpacity=".85" />
        </svg>
      </div>
    </div>
  );
}

/** A slow ribbon of industries and cities we serve. Pauses on hover. */
export function Ribbon() {
  const items = [
    ...INDUSTRIES.map((i) => i.name),
    ...CITIES.map((c) => `WhatsApp CRM ${c.name}`),
  ];
  const row = (hidden: boolean) =>
    items.map((t, i) => (
      <span key={`${hidden}-${i}`} aria-hidden={hidden || undefined} className="whitespace-nowrap rounded-full bg-surface px-4 py-2 text-sm text-fg-2 hairline">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" />
        {t}
      </span>
    ));
  return (
    <div className="marquee overflow-hidden py-2">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
