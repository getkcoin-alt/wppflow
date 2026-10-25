import { Check, Minus } from "lucide-react";
import { Pill } from "../ui/Page";
import type { AiStatus } from "../../services/api";

// What the company's plan includes, so owners can see it instead of finding out from a locked screen.
const FEATURES: [string, string][] = [
  ["broadcasts", "Broadcasts to opted-in contacts"],
  ["automations", "Keyword automations"],
  ["leads", "Sales pipeline and follow-ups"],
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

// How much of Riwo the company has used: today against its daily allowance, and the month so far.
function AiUsage({ ai }: { ai: AiStatus }) {
  if (ai.reason === "plan") return null;
  if (ai.reason === "not_configured")
    return <p className="mt-4 text-[13.5px] text-fg-3">Riwo isn't switched on for this server yet, so there is nothing to count.</p>;
  const percent = Math.min(100, Math.round((ai.used / Math.max(ai.limit, 1)) * 100));
  const resets = ai.resetsAt ? new Date(ai.resetsAt) : null;
  return (
    <div className="mt-5 border-t border-line pt-4" data-testid="ai-usage">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13.5px] text-fg-2">Riwo requests today</p>
        <p className="num text-[15px] text-fg">
          <span className="font-semibold">{ai.used.toLocaleString()}</span> of {ai.limit.toLocaleString()}
        </p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden" role="img" aria-label={`${percent}% of today's Riwo allowance used`}>
        <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-700" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[12.5px] text-fg-3">
        {ai.custom ? "An allowance agreed for your company. " : "Your plan's allowance. "}
        Shared by everyone in your company
        {resets && !Number.isNaN(resets.getTime()) ? (
          <>
            ; starts again at {resets.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (midnight UTC)
          </>
        ) : (
          "; it starts again at midnight UTC"
        )}
        .
      </p>
      {ai.month && (
        <p className="mt-1 text-[13.5px] text-fg-2">
          <span className="num font-semibold text-fg">{ai.month.requests.toLocaleString()}</span> requests this month
        </p>
      )}
      {!ai.enabled && <p className="mt-1 text-[13px] text-fg-3">Riwo is switched off for your company, so nobody can use it until an owner or administrator turns it on.</p>}
    </div>
  );
}

export function PlanCard({
  plan,
  numbersLimit,
  numbersUsed,
  ai,
}: {
  plan?: PlanInfo;
  numbersLimit?: number | null;
  numbersUsed?: number;
  ai?: AiStatus;
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
      {ai && plan.features.ai !== false && <AiUsage ai={ai} />}
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
