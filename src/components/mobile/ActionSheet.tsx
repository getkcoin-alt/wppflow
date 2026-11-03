import type { LucideIcon } from "lucide-react";
import { SheetShell, strayClick } from "../ui/Sheet";

export interface SheetAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** a destructive action is red, and is always asked about first by whoever handles it */
  tone?: "default" | "danger";
  /** a short line under the label */
  hint?: string;
  disabled?: boolean;
}

/**
 * The menu behind a long-press or a "⋯": a short list of things you can do, each one tap, nothing to read. It slides up on a
 * phone and is a small dialog elsewhere. Back, a tap outside or a pull down puts it away.
 */
export function ActionSheet({ open, onClose, title, subtitle, actions }: { open: boolean; onClose: () => void; title?: string; subtitle?: string; actions: SheetAction[] }) {
  return (
    <SheetShell open={open} onClose={onClose} label={title || "Actions"} className="sm:max-w-sm">
      {(drag) => (
        <>
          <div {...drag.handlers} className="shrink-0" style={{ touchAction: "none" }}>
            <div className="sm:hidden grid place-items-center pt-3 pb-1" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-fg/15" />
            </div>
            {(title || subtitle) && (
              <div className="px-5 pt-2 sm:pt-6 pb-2 min-w-0">
                {title && <h2 className="text-[17px] font-semibold text-fg truncate">{title}</h2>}
                {subtitle && <p className="text-[13.5px] text-fg-2 truncate mt-0.5">{subtitle}</p>}
              </div>
            )}
          </div>
          <ul className="overflow-y-auto overscroll-contain px-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }} aria-label={title || "Actions"}>
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.key}>
                  <button
                    type="button"
                    disabled={a.disabled}
                    onClick={(e) => {
                      if (strayClick(e)) return;
                      onClose();
                      a.onSelect();
                    }}
                    className={`hit-none press w-full min-h-[52px] px-3 rounded-2xl flex items-center gap-3.5 text-left text-[16px] disabled:opacity-40 active:bg-surface-2 hover:bg-surface-2 transition-colors ${a.tone === "danger" ? "text-danger" : "text-fg"}`}
                  >
                    {Icon && <Icon className={`w-[22px] h-[22px] shrink-0 ${a.tone === "danger" ? "" : "text-fg-2"}`} strokeWidth={1.8} aria-hidden />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{a.label}</span>
                      {a.hint && <span className="block text-[12.5px] text-fg-3 truncate">{a.hint}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </SheetShell>
  );
}
