import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Settings most people never change, folded away under one line that says what is inside. */
export function MoreOptions({ title, hint, defaultOpen = false, children }: { title: string; hint?: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="group rounded-2xl ring-1 ring-line" open={defaultOpen}>
      <summary className="cursor-pointer select-none list-none min-h-11 px-4 py-2.5 flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[14.5px] font-medium text-fg">{title}</span>
          {hint && <span className="block text-[12.5px] text-fg-3">{hint}</span>}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-fg-3 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-4">{children}</div>
    </details>
  );
}

/** The steps of what a recipe does: open while making one, folded away when changing one the person already knows. */
export function HowItWorks({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <details className="group mb-5" open={open}>
      <summary className="cursor-pointer select-none list-none min-h-11 flex items-center gap-2 text-[14px] font-medium text-fg-2 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="w-4 h-4 text-fg-3 transition -rotate-90 group-open:rotate-0" aria-hidden />
        How this works
      </summary>
      <div className="mt-1">{children}</div>
    </details>
  );
}
