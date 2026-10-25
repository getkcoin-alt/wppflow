import type { LabelColor } from "../../services/api";

// Each label colour as text on a soft tint of itself, readable in the light and the dark theme.
const TINT: Record<LabelColor, string> = {
  slate: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  amber: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  green: "bg-green-500/15 text-green-700 dark:text-green-300",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  indigo: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  purple: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
};
export const DOT: Record<LabelColor, string> = {
  slate: "bg-slate-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};
export const tintOf = (color: string) => TINT[color as LabelColor] ?? TINT.slate;
export const dotOf = (color: string) => DOT[color as LabelColor] ?? DOT.slate;

// A label as a small coloured pill. Colour is never the only signal: the name is always written.
export function LabelChip({ label, size = "md", onRemove }: { label: { name: string; color: string }; size?: "sm" | "md"; onRemove?: () => void }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium max-w-full ${tintOf(label.color)} ${size === "sm" ? "h-5 px-2 text-[11.5px]" : "h-6 px-2.5 text-[12.5px]"}`}
      data-label={label.name}
    >
      <span className="truncate">{label.name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${label.name}`} className="-mr-1 h-4 w-4 grid place-items-center rounded-full hover:bg-black/10 dark:hover:bg-white/15">
          ×
        </button>
      )}
    </span>
  );
}
