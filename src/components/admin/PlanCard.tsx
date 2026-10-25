import { Check, Minus } from "lucide-react";
import { Pill } from "../ui/Page";
import type { AiStatus, PlanUsage, UsageRow } from "../../services/api";
import { describeSubscription, type Subscription } from "../../utils/subscription";

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
  id?: string | null;
  name: string;
  restricted: boolean;
  seats?: number | null;
  /** Paid features are off because the payment is more than the grace period late */
  lapsed?: boolean;
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

const BAR = { ok: "bg-ok", near: "bg-warn", full: "bg-danger", unlimited: "bg-ok" } as const;

// One limit: how much is used, as a bar that turns amber at 80% and red at the limit.
function UsageLine({ label, row, note }: { label: string; row: UsageRow; note?: string }) {
  if (row.limit === null) return null;
  const percent = Math.min(100, Math.round((row.used / Math.max(row.limit, 1)) * 100));
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13.5px] text-fg-2">{label}</p>
        <p className="num text-[15px] text-fg">
          <span className={`font-semibold ${row.state === "full" ? "text-danger" : row.state === "near" ? "text-warn" : ""}`}>{row.used.toLocaleString()}</span> of {row.limit.toLocaleString()}
        </p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden" role="img" aria-label={`${label}: ${percent}% of the plan's limit used`}>
        <div className={`h-full rounded-full transition-[width] duration-700 ${BAR[row.state]}`} style={{ width: `${percent}%` }} />
      </div>
      {note && <p className="mt-1.5 text-[12.5px] text-fg-3">{note}</p>}
    </div>
  );
}

// Contacts and broadcasts against what the plan allows. Nothing shows for a plan with no limit on either.
export function PlanUsageBlock({ usage }: { usage?: PlanUsage }) {
  if (!usage || (usage.contacts.limit === null && usage.broadcasts.limit === null)) return null;
  const { contacts, broadcasts } = usage;
  return (
    <div className="mt-5 border-t border-line pt-4 space-y-4" data-testid="plan-usage">
      <UsageLine label="Contacts" row={contacts} />
      <UsageLine label="Broadcasts started this month" row={broadcasts} note={`Starts again on ${broadcasts.resets}.`} />
      {contacts.state === "near" && (
        <p className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-[14px]" role="status">
          You are using {contacts.used.toLocaleString()} of your {contacts.limit!.toLocaleString()} contacts. Choose a bigger plan below before you reach the limit.
        </p>
      )}
      {contacts.state === "full" && (
        <p className="rounded-2xl bg-danger/10 text-danger px-4 py-3 text-[14px]" role="alert">
          You have reached your contact limit. Your team can't add more until you remove some or choose a bigger plan. Customers can still message you and nothing is deleted.
        </p>
      )}
      {broadcasts.state === "full" && (
        <p className="rounded-2xl bg-danger/10 text-danger px-4 py-3 text-[14px]" role="alert">
          You have started all {broadcasts.limit} broadcasts your plan includes this month. You can start more from {broadcasts.resets}, or choose a bigger plan below.
        </p>
      )}
      {broadcasts.state === "near" && (
        <p className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-[14px]" role="status">
          You have started {broadcasts.used} of your {broadcasts.limit} broadcasts this month.
        </p>
      )}
    </div>
  );
}

export function PlanCard({
  plan,
  numbersLimit,
  numbersUsed,
  ai,
  subscription,
  usage,
}: {
  plan?: PlanInfo;
  usage?: PlanUsage;
  numbersLimit?: number | null;
  numbersUsed?: number;
  ai?: AiStatus;
  subscription?: Subscription;
}) {
  if (!plan) return null;
  const billing = describeSubscription(subscription, "company");
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
      {billing && subscription && (
        <div className="mt-4 rounded-2xl bg-surface-2 px-4 py-3" data-testid="subscription">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[13.5px] text-fg-2">
              Billing{subscription.cycle ? `: ${subscription.cycle === "annual" ? "yearly" : "monthly"}, paid in advance` : ""}
            </p>
            <Pill tone={billing.tone} dot>
              {billing.label}
            </Pill>
          </div>
          <p className="mt-1.5 text-[14px] text-fg">{billing.detail}</p>
        </div>
      )}
      {plan.lapsed && (
        <p className="mt-3 rounded-2xl bg-danger/10 text-danger px-4 py-3 text-[14px]" role="alert">
          The paid features of {plan.name} are off until the payment is received. Pay below or message the Scriwo team and they come back at once.
        </p>
      )}
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
      <PlanUsageBlock usage={usage} />
      {ai && plan.features.ai !== false && <AiUsage ai={ai} />}
      {plan.restricted && Object.values(plan.features).some((v) => !v) && (
        <p className="mt-4 text-[13px] text-fg-3">
          To add what's not included, choose a bigger plan below. It switches on straight away.
        </p>
      )}
    </section>
  );
}
