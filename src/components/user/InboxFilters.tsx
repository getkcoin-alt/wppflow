import { Funnel } from "lucide-react";
import type { Label } from "../../services/api";
import { LabelFilter } from "../labels/LabelFilter";

export interface InboxExtraFilters {
  /** Label ids */
  labels: string[];
  labelMode: "any" | "all";
  /** "me", "none" (nobody) or "" for anyone */
  assigned: "" | "me" | "none";
  /** Only chats active within this many days; "" for any time */
  activeDays: "" | "1" | "7" | "30";
}
export const NO_EXTRA: InboxExtraFilters = { labels: [], labelMode: "any", assigned: "", activeDays: "" };
export const countExtra = (f: InboxExtraFilters) => (f.labels.length ? 1 : 0) + (f.assigned ? 1 : 0) + (f.activeDays ? 1 : 0);

const chip = (on: boolean) =>
  `shrink-0 h-8 px-3 rounded-full text-[13px] font-medium inline-flex items-center gap-2 ring-1 transition ${on ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 text-fg-2 ring-line hover:text-fg"}`;

// The toggle button for the filter panel, with how many filters are on.
export function FiltersToggle({ open, count, onToggle }: { open: boolean; count: number; onToggle: () => void }) {
  return (
    <button type="button" aria-expanded={open} onClick={onToggle} className={chip(open || count > 0)}>
      <Funnel className="w-3.5 h-3.5" aria-hidden />
      Filters
      {count > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 text-[11px] grid place-items-center num">{count}</span>}
    </button>
  );
}

// Narrow the chat list by label, who has the chat, and how recently it was active. They combine.
export function InboxFilters({ labels, value, onChange }: { labels: Label[]; value: InboxExtraFilters; onChange: (v: InboxExtraFilters) => void }) {
  const set = (patch: Partial<InboxExtraFilters>) => onChange({ ...value, ...patch });
  return (
    <div className="rounded-2xl bg-surface-2 p-3 space-y-3" role="group" aria-label="Chat filters">
      {labels.length > 0 && (
        <div className="space-y-1.5">
          <p className="eyebrow">Label</p>
          <LabelFilter labels={labels} value={value.labels} mode={value.labelMode} onChange={(labels) => set({ labels })} onMode={(labelMode) => set({ labelMode })} />
        </div>
      )}
      <div className="space-y-1.5">
        <p className="eyebrow">Who has it</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Assigned to">
          {([["", "Anyone"], ["me", "Assigned to me"], ["none", "Unassigned"]] as const).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={value.assigned === key} onClick={() => set({ assigned: key })} className={chip(value.assigned === key)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="eyebrow">Last active</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Last active">
          {([["", "Any time"], ["1", "Today"], ["7", "7 days"], ["30", "30 days"]] as const).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={value.activeDays === key} onClick={() => set({ activeDays: key })} className={chip(value.activeDays === key)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {countExtra(value) > 0 && (
        <button type="button" onClick={() => onChange(NO_EXTRA)} className="text-[13px] text-fg-2 hover:text-fg underline">
          Clear all filters
        </button>
      )}
    </div>
  );
}
