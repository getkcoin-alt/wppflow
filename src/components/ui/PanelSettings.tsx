import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Settings2, X } from "lucide-react";

// Every panel (Pipeline, Real estate, …) has its own settings, opened from its own header and drawn as that panel's own drawer:
// its icon and colour, its name, and only its own options, in plain sections. Not one long settings page for everything.
export type Accent = "gold" | "brand" | "info";
const ACCENT: Record<Accent, { tile: string; band: string }> = {
  gold: { tile: "bg-gold/15 text-gold", band: "from-gold/15" },
  brand: { tile: "bg-brand/15 text-brand", band: "from-brand/15" },
  info: { tile: "bg-info/15 text-info", band: "from-info/15" },
};

/** The gear in a panel's header. Always says "Settings" and, to a screen reader, whose settings. */
export function SettingsButton({ panel, onClick, className = "" }: { panel: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${panel} settings`} className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-[14.5px] font-medium bg-surface-2 text-fg hover:bg-surface-3 transition ${className}`}>
      <Settings2 className="w-4 h-4" aria-hidden /> Settings
    </button>
  );
}

export function PanelSettings({
  open,
  onClose,
  panel,
  icon,
  accent = "brand",
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  /** the panel's name: "Pipeline" */
  panel: string;
  icon: ReactNode;
  accent?: Accent;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  const a = ACCENT[accent];
  return createPortal(
    <div className="fixed inset-0 z-[65] flex justify-end items-end sm:items-stretch">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade" />
      <aside role="dialog" aria-modal="true" aria-label={`${panel} settings`} className="relative w-full sm:w-[440px] max-h-[94dvh] sm:max-h-none flex flex-col bg-surface rounded-t-[32px] sm:rounded-none sm:rounded-l-[32px] pop animate-rise">
        <div className={`flex items-start gap-4 px-6 sm:px-7 pt-6 pb-5 bg-gradient-to-b ${a.band} to-transparent rounded-t-[32px] sm:rounded-tr-none sm:rounded-tl-[32px]`}>
          <div className={`h-12 w-12 shrink-0 grid place-items-center rounded-2xl ${a.tile}`} aria-hidden>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{panel}</p>
            <h2 className="text-[22px] font-semibold leading-tight">Settings</h2>
            {subtitle && <p className="text-[14px] text-fg-2 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-surface-2 text-fg-2 hover:text-fg">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 pb-4 space-y-7">{children}</div>
        {footer && (
          <div className="px-6 sm:px-7 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-line/10" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
            {footer}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}

/** A titled group of options inside a panel's settings. */
export function SettingsGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {hint && <p className="text-[13px] text-fg-3 mt-0.5">{hint}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

/** A number with ready-made choices as chips, so the usual answer is one tap and a different one is still possible. */
export function ChipNumber({ label, hint, value, choices, unit, min, max, onChange }: { label: string; hint?: string; value: number; choices: number[]; unit: string; min: number; max: number; onChange: (n: number) => void }) {
  const all = choices.includes(value) ? choices : [...choices, value].sort((a, b) => a - b);
  return (
    <div>
      <p className="text-[14px] font-medium">{label}</p>
      {hint && <p className="text-[12.5px] text-fg-3">{hint}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
        {all.map((n) => (
          <button key={n} type="button" aria-pressed={n === value} onClick={() => onChange(n)} className={`h-9 px-3.5 rounded-full text-[13.5px] transition ${n === value ? "bg-brand-solid text-white font-semibold" : "bg-surface-2 text-fg hover:bg-surface-3"}`}>
            {n} {unit}
          </button>
        ))}
        <input
          type="number"
          aria-label={`${label}, other`}
          min={min}
          max={max}
          placeholder="Other"
          className="h-9 w-20 rounded-full bg-surface-2 px-3 text-[13.5px] outline-none ring-1 ring-transparent focus:ring-gold/60"
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= min && n <= max) onChange(n);
          }}
        />
      </div>
    </div>
  );
}
