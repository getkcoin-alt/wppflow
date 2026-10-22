import { useId } from "react";

// The Scriwo mark: a single gold stroke that begins as the top bar of a "Z" and flows into the
// zigzag of a "W". Built from one path so it stays crisp from 16px (favicon) to a billboard.
export function ScriwoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Scriwo"
      className={className}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3E3BC" />
          <stop offset=".55" stopColor="#D2B06A" />
          <stop offset="1" stopColor="#A8843F" />
        </linearGradient>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#202427" />
          <stop offset="1" stopColor="#0A0B0C" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill={`url(#t${id})`} />
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="12.5"
        fill="none"
        stroke="rgba(255,255,255,.14)"
      />
      <path
        d="M10 14.5 H17.5 L22 31.5 L26.5 21 L31 31.5 L38 14.5"
        fill="none"
        stroke={`url(#g${id})`}
        strokeWidth={size < 24 ? 3.9 : 3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-medium uppercase tracking-[0.34em] text-fg ${className}`}
      style={{ marginRight: "-0.34em" }}
    >
      Scriwo
    </span>
  );
}

export function ScriwoLogo({
  size = 32,
  showWord = true,
  className = "",
}: {
  size?: number;
  showWord?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <ScriwoMark size={size} />
      {showWord && <Wordmark className="leading-none" />}
    </span>
  );
}
