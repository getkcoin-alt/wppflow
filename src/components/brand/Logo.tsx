// The Scriwo mark: a gold paper plane taking off from a chat bubble, from the brand lockup.
export function ScriwoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/brand/scriwo-mark.webp"
      width={size}
      height={size}
      alt="Scriwo"
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-extrabold tracking-[-0.02em] text-fg ${className}`}
      style={{ fontFamily: '"Montserrat", "Inter Variable", sans-serif' }}
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
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <ScriwoMark size={size} />
      {showWord && <Wordmark className="leading-none" />}
    </span>
  );
}
