import { Check, ChevronRight } from "lucide-react";
import type { HomeData } from "../../services/api";

type Setup = NonNullable<HomeData["setup"]>;

/** A few steps that make a new workspace useful, each one tap away. */
export function SetupCoach({ setup, onStep }: { setup: Setup; onStep: (key: Setup["steps"][number]["key"]) => void }) {
  const pct = Math.round((setup.done / setup.total) * 100);
  return (
    <section aria-labelledby="setup-title" className="rounded-3xl bg-surface border border-line p-5 sm:p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="setup-title" className="text-[17px] font-semibold text-fg">
          Get set up
        </h2>
        <span className="text-[13px] text-fg-3 num">
          {setup.done} of {setup.total}
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={setup.total} aria-valuenow={setup.done}>
        <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 divide-y divide-line/60">
        {setup.steps.map((step) => (
          <li key={step.key}>
            <button
              type="button"
              disabled={step.done}
              onClick={() => onStep(step.key)}
              className="w-full flex items-center gap-3 py-3 text-left disabled:cursor-default group"
            >
              <span className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${step.done ? "bg-ok/15 text-ok" : "ring-1 ring-line text-transparent"}`}>
                <Check className="w-3.5 h-3.5" aria-hidden />
              </span>
              <span className={`flex-1 text-[14.5px] ${step.done ? "text-fg-3 line-through" : "text-fg font-medium"}`}>{step.label}</span>
              {!step.done && <ChevronRight className="w-4 h-4 text-fg-3 group-hover:translate-x-0.5 transition-transform" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
