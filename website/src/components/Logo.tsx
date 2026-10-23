/** The Scriwo mark: a gold paper plane taking off from a chat bubble. */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a tiny static mark; next/image adds weight for nothing here
    <img src="/brand/scriwo-mark.webp" alt="" width={size} height={size} className={`logo-mark ${className}`} />
  );
}

/** Mark plus the "Scriwo" wordmark, and optionally the "Shared WhatsApp inbox" strapline from the brand lockup. */
export function Logo({ size = 36, tagline = false, className = "" }: { size?: number; tagline?: boolean; className?: string }) {
  return (
    <span className={`group inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="flex flex-col">
        <span className="font-display text-[1.45rem] font-extrabold leading-none tracking-[-0.02em] text-ink dark:text-fg">Scriwo</span>
        {tagline && (
          <span className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-[0.5rem] font-bold uppercase tracking-[0.12em] text-fg-2">
            <span className="h-px w-3 bg-gold" aria-hidden="true" />
            Shared WhatsApp inbox
            <span className="h-px w-3 bg-gold" aria-hidden="true" />
          </span>
        )}
      </span>
    </span>
  );
}
