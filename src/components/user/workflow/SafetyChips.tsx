import { ShieldCheck } from "lucide-react";

/** The safety every workflow carries, said in plain words, so the owner can see it was not forgotten */
export function SafetyChips({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <section aria-label="Safety Riwo added" className="rounded-2xl ring-1 ring-line p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold">
        <ShieldCheck className="w-4 h-4 text-ok" aria-hidden /> Safety Riwo added
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {lines.map((l) => (
          <li key={l} className="text-[13px] text-fg-2 leading-snug flex gap-2">
            <span className="text-ok mt-px" aria-hidden>
              ✓
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
