import { Check, Minus } from "lucide-react";
import { Pill } from "../ui/Page";

// What the company's plan includes, so owners can see it instead of finding out from a locked screen.
const FEATURES: [string, string][] = [
  ["broadcasts", "Broadcasts to opted-in contacts"],
  ["automations", "Keyword automations"],
  ["audit", "Audit log"],
  ["api", "API keys and webhooks"],
  ["ai", "Riwo, the AI assistant"],
];

export interface PlanInfo {
  name: string;
  restricted: boolean;
  seats?: number | null;
  features: Record<string, boolean>;
}

export function PlanCard({
  plan,
  numbersLimit,
  numbersUsed,
}: {
  plan?: PlanInfo;
  numbersLimit?: number | null;
  numbersUsed?: number;
}) {
  if (!plan) return null;
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] text-fg-2">Your plan</p>
          <h2 className="mt-1 text-[22px] font-semibold flex items-center gap-3">
            {plan.name}
            {!plan.restricted && <Pill tone="neutral">Everything included</Pill>}
          </h2>
        </div>
        {numbersLimit != null && (
          <div className="text-right">
            <p className="text-[13.5px] text-fg-2">WhatsApp numbers</p>
            <p className="mt-1 text-[22px] font-semibold num">
              {numbersUsed !== undefined && <>{numbersUsed} <span className="text-fg-3 text-[16px] font-normal">of</span> </>}
              {numbersLimit}
            </p>
          </div>
        )}
      </div>
      {plan.seats === 1 && <p className="mt-3 text-[14px] text-fg-2">This plan is for one person.</p>}
      <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
        {FEATURES.map(([key, label]) => {
          const included = plan.features[key] !== false;
          return (
            <li key={key} className={`flex items-center gap-2 ${included ? "text-fg" : "text-fg-3"}`}>
              {included ? (
                <Check className="w-4 h-4 text-ok shrink-0" aria-label="Included" />
              ) : (
                <Minus className="w-4 h-4 shrink-0" aria-label="Not included" />
              )}
              {label}
            </li>
          );
        })}
      </ul>
      {plan.restricted && Object.values(plan.features).some((v) => !v) && (
        <p className="mt-4 text-[13px] text-fg-3">
          To add what's not included, ask the Scriwo team to move your company to a bigger plan. It switches on straight away.{" "}
          <a href="https://www.scriwo.com/pricing" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            See the plans
          </a>
        </p>
      )}
    </section>
  );
}
