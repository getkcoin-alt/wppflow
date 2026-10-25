// How a company's subscription is described on screen, for the company's own "Your plan" card and the platform list.
export type SubscriptionStatus = "free" | "legacy" | "unrecorded" | "active" | "due_soon" | "overdue" | "expired" | "changing" | "cancelling";
export interface Subscription {
  status: SubscriptionStatus;
  plan: string;
  planId: string | null;
  cycle: "monthly" | "annual" | null;
  periodStart: string | null;
  periodEnd: string | null;
  /** Days until the renewal; negative once it has passed */
  daysLeft: number | null;
  scheduledPlan: { id: string; name: string } | null;
  /** The last day everything still works when the payment is late */
  graceEndsOn?: string | null;
  /** The paid features are off because the payment is more than the grace period late */
  lapsed?: boolean;
}

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
export const when = (daysLeft: number | null) =>
  daysLeft === null ? "" : daysLeft === 0 ? "today" : daysLeft > 0 ? `in ${days(daysLeft)}` : `${days(-daysLeft)} ago`;

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral" | "gold";
// `label` is the short badge; `detail` is the sentence under it. Nothing is said for plans with nothing to pay.
export function describeSubscription(sub: Subscription | undefined, audience: "company" | "platform"): { label: string; detail: string; tone: Tone } | null {
  if (!sub || sub.status === "free" || sub.status === "legacy") return null;
  const end = formatDate(sub.periodEnd);
  switch (sub.status) {
    case "unrecorded":
      return {
        label: "No payment recorded",
        tone: "warn",
        detail:
          audience === "company"
            ? "The Scriwo team hasn't recorded a payment for this plan yet. If you have paid, they will update it shortly."
            : "On a paid plan, but no payment has been recorded, so there is no renewal date.",
      };
    case "active":
      return { label: `Renews ${end}`, tone: "ok", detail: `Renews on ${end}, ${when(sub.daysLeft)}.` };
    case "due_soon":
      return {
        label: sub.daysLeft === 0 ? "Renews today" : `Renews ${when(sub.daysLeft)}`,
        tone: "gold",
        detail:
          audience === "company"
            ? `Renews on ${end}, ${when(sub.daysLeft)}. Renew from Plans & Billing, or wait for the invoice from the Scriwo team.`
            : `Renewal ${when(sub.daysLeft)}, on ${end}.`,
      };
    case "overdue":
      return {
        label: "Payment overdue",
        tone: "danger",
        detail:
          audience === "company"
            ? `Payment was due on ${end} (${when(sub.daysLeft)}). Everything keeps working until ${formatDate(sub.graceEndsOn)}; after that the paid features switch off (nothing is deleted). Please pay the invoice or message the Scriwo team.`
            : `Was due on ${end} (${when(sub.daysLeft)}). The paid features switch off after ${formatDate(sub.graceEndsOn)}.`,
      };
    case "expired":
      return {
        label: "Paid features off",
        tone: "danger",
        detail:
          audience === "company"
            ? `Payment was due on ${end}. Broadcasts, automations, the pipeline and the other paid features are off until it is received. Your numbers, conversations and contacts are untouched. Pay the invoice or message the Scriwo team and everything comes back at once.`
            : `Was due on ${end} (${when(sub.daysLeft)}). The grace period is over, so the paid features are off. A recorded payment switches them back on at once.`,
      };
    case "changing":
      return { label: `Moves to ${sub.scheduledPlan?.name}`, tone: "info", detail: `On ${end} (${when(sub.daysLeft)}) the plan moves from ${sub.plan} to ${sub.scheduledPlan?.name}. Nothing is deleted.` };
    case "cancelling":
      return {
        label: `Ends ${end}`,
        tone: "warn",
        detail: `The plan ends on ${end} (${when(sub.daysLeft)}). The company then moves to the Free plan: one WhatsApp number and one person. Conversations are kept.`,
      };
  }
}

// The same day next month (or next year); a month without that day ends on its last day. Mirrors the server.
export function addCycle(date: string, cycle: "monthly" | "annual") {
  const d = new Date(`${date}T00:00:00Z`);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (cycle === "annual" ? 12 : 1), 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}
export const todayIso = () => new Date().toISOString().slice(0, 10);
const gap = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
// Where a new period starts: where the last one ended, unless that was more than a month ago.
export const defaultPeriodStart = (lastEnd: string | null, today = todayIso()) => (lastEnd && gap(lastEnd, today) <= 31 ? lastEnd : today);

// Who needs attention, for the platform list: renewals within two weeks, overdue, and paid plans with no payment.
export type Attention = "all" | "overdue" | "soon" | "unrecorded";
export function needsAttention(sub: Subscription | undefined, filter: Attention) {
  if (!sub || filter === "all") return true;
  if (filter === "overdue") return sub.status === "overdue" || sub.status === "expired";
  if (filter === "unrecorded") return sub.status === "unrecorded";
  return ["due_soon", "changing", "cancelling"].includes(sub.status) && sub.daysLeft !== null && sub.daysLeft <= 14;
}
