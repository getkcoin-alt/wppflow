import type { Label } from "../../services/api";
import { dotOf } from "./LabelChip";

// Pick labels to narrow a list. With two or more picked, choose whether a row needs any of them or all of them.
export function LabelFilter({
  labels,
  value,
  mode,
  onChange,
  onMode,
  allowNone = false,
}: {
  labels: Label[];
  value: string[];
  mode: "any" | "all";
  onChange: (ids: string[]) => void;
  onMode: (mode: "any" | "all") => void;
  /** Adds "No label" for finding contacts nobody has tagged */
  allowNone?: boolean;
}) {
  if (!labels.length && !allowNone) return null;
  const chip = (on: boolean) =>
    `shrink-0 h-8 px-3 rounded-full text-[13px] font-medium inline-flex items-center gap-2 ring-1 transition ${on ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 text-fg-2 ring-line hover:text-fg"}`;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value.filter((x) => x !== "none"), id]);
  const real = value.filter((x) => x !== "none");
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by label">
      {labels.map((l) => (
        <button key={l.id} type="button" aria-pressed={value.includes(l.id)} onClick={() => toggle(l.id)} className={chip(value.includes(l.id))}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${value.includes(l.id) ? "bg-white" : dotOf(l.color)}`} />
          {l.name}
        </button>
      ))}
      {allowNone && (
        <button type="button" aria-pressed={value.includes("none")} onClick={() => onChange(value.includes("none") ? [] : ["none"])} className={chip(value.includes("none"))}>
          No label
        </button>
      )}
      {real.length > 1 && (
        <span role="group" aria-label="Match" className="inline-flex rounded-full bg-surface-2 p-0.5 ring-1 ring-line">
          {(["any", "all"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => onMode(m)} className={`h-7 px-3 rounded-full text-[12.5px] font-medium ${mode === m ? "bg-surface text-fg shadow-card" : "text-fg-2"}`}>
              {m === "any" ? "Any of these" : "All of these"}
            </button>
          ))}
        </span>
      )}
      {value.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="h-8 px-2 text-[13px] text-fg-2 hover:text-fg underline">
          Clear
        </button>
      )}
    </div>
  );
}
