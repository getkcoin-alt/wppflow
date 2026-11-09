import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Pill } from "../../ui/Page";

/** One numbered card of the setup. A tick when it is done; the first one that is not done is marked as the next thing to do. */
export function StepCard({ n, id, title, done = false, next = false, aside, children }: { n: number; id: string; title: string; done?: boolean; next?: boolean; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`card p-5 sm:p-6 ${next ? "ring-1 ring-gold/50" : ""}`}>
      <header className="flex items-center gap-3">
        <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-[14px] font-semibold ${done ? "bg-ok/15 text-ok" : "bg-surface-2 text-fg-2"}`} aria-hidden>
          {done ? <Check className="w-4 h-4" /> : n}
        </span>
        <h2 id={id} className="flex-1 min-w-0 text-[17px] font-semibold text-fg">
          {title}
        </h2>
        {done ? <Pill tone="ok">Done</Pill> : next ? <Pill tone="gold">Next</Pill> : null}
        {aside}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
