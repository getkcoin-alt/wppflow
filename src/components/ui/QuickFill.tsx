import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import type { Understood } from "../../utils/quickFill";

// "Say it in one line": the top of a form. The person types the way they talk ("2 bed Marina 1.8M, call tomorrow"); as they
// type, it shows what it understood, and one tap (or Enter) fills the boxes below. They can still change anything. It runs
// in the browser: nothing is sent anywhere and nothing is saved until the person saves the form.
export function QuickFill<T>({
  label = "Say it in one line",
  example,
  understand,
  onApply,
}: {
  label?: string;
  /** a real-looking example, shown as the placeholder */
  example: string;
  understand: (text: string) => Understood<T>;
  onApply: (fields: Partial<T>) => void;
}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const u = text.trim() ? understand(text) : null;
  const ready = Boolean(u && Object.keys(u.fields).length > 0);
  const apply = () => {
    if (!u || !ready) return;
    onApply(u.fields);
    setDone(true);
    setText("");
    window.setTimeout(() => setDone(false), 2500);
  };
  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand/10 via-surface-2 to-gold/10 ring-1 ring-line p-3.5">
      <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-fg-2 mb-1.5 ml-1">
        <Sparkles className="w-3.5 h-3.5 text-gold" aria-hidden /> {label}
      </label>
      <div className="flex gap-2">
        <input
          aria-label={label}
          value={text}
          placeholder={example}
          maxLength={300}
          onChange={(e) => {
            setText(e.target.value);
            setDone(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          className="flex-1 min-w-0 h-11 rounded-2xl bg-surface px-4 text-[14.5px] ring-1 ring-line focus:ring-gold/60 outline-none"
          dir="auto"
        />
        <button type="button" onClick={apply} disabled={!ready} className="h-11 px-4 rounded-full bg-brand-solid text-white text-[13.5px] font-semibold disabled:opacity-40 hover:bg-brand-hover transition-colors">
          Fill
        </button>
      </div>
      <div className="mt-2 min-h-[24px] flex flex-wrap items-center gap-1.5 ml-1" aria-live="polite">
        {done ? (
          <span className="inline-flex items-center gap-1 text-[13px] text-ok font-medium">
            <Check className="w-3.5 h-3.5" aria-hidden /> Filled. Check the boxes below and change anything.
          </span>
        ) : u && u.chips.length > 0 ? (
          <>
            <span className="text-[12px] text-fg-3">Understood:</span>
            {u.chips.map((c) => (
              <span key={c} className="rounded-full bg-surface ring-1 ring-line px-2.5 h-6 inline-flex items-center text-[12.5px]">
                {c}
              </span>
            ))}
          </>
        ) : u ? (
          <span className="text-[12.5px] text-fg-3">Nothing to fill from that yet. Try a price, a place, a day or a time.</span>
        ) : (
          <span className="text-[12.5px] text-fg-3">Or skip this and fill the boxes yourself.</span>
        )}
      </div>
    </div>
  );
}
