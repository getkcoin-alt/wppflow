import type { Lead, StageKind } from "../services/api";

/** An amount in the company's currency, without cents: "AED 1,400,000". */
export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0, currencyDisplay: "code" })
      .format(value)
      .replace(/ /g, " ");
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en")}`;
  }
}
/** A short amount for a column header: "1.4M", "850K". */
export function shortMoney(value: number): string {
  if (value >= 1e6) return `${+(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${+(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
}

/** Whole days since something happened. */
export const daysSince = (iso: string, now = Date.now()): number => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86_400_000));
export const inStage = (lead: Lead, now = Date.now()): string => {
  const d = daysSince(lead.stageChangedAt, now);
  return d === 0 ? "Today" : d === 1 ? "1 day" : `${d} days`;
};

/** When a follow-up is due, in words: "Overdue 2 days", "Today 4:30 PM", "Tomorrow", "Mon 27 Oct". */
export function dueLabel(iso: string, now = new Date()): { text: string; late: boolean } {
  const due = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(due) - startOf(now)) / 86_400_000);
  const time = due.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  if (due.getTime() < now.getTime()) {
    const late = Math.abs(days);
    return { text: late === 0 ? `Overdue since ${time}` : `Overdue ${late} day${late === 1 ? "" : "s"}`, late: true };
  }
  if (days === 0) return { text: `Today ${time}`, late: false };
  if (days === 1) return { text: `Tomorrow ${time}`, late: false };
  return { text: due.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" }), late: false };
}

/** The end of the person's own day, so "today" means their today and not the server's. */
export const endOfToday = (now = new Date()): Date => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

/** Ready-made follow-up times: tomorrow, in three days, next week, at nine in the morning. */
export function followUpOptions(now = new Date()): { key: string; label: string; at: Date }[] {
  const at = (days: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 9, 0, 0, 0);
  return [
    { key: "tomorrow", label: "Tomorrow", at: at(1) },
    { key: "3days", label: "In 3 days", at: at(3) },
    { key: "week", label: "Next week", at: at(7) },
  ];
}

/** Colour family for a step: open steps are neutral, won is green, lost is red. */
export const stageTone = (kind: StageKind): "neutral" | "ok" | "danger" => (kind === "won" ? "ok" : kind === "lost" ? "danger" : "neutral");

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Added by hand",
  chat: "From a chat",
  automation: "Automatic",
  import: "Imported",
  api: "From your website",
};

/** One line of a lead's history, in words. */
export function describeEvent(e: { type: string; actorName: string; detail: Record<string, any> }): string {
  const who = e.actorName || "Scriwo";
  switch (e.type) {
    case "created":
      return e.detail.source === "automation" ? "Added automatically" : `${who} added this lead`;
    case "stage":
      return `${who} moved it from ${e.detail.from} to ${e.detail.to}`;
    case "won":
      return `${who} marked it ${e.detail.to}`;
    case "lost":
      return `${who} marked it ${e.detail.to}${e.detail.reason ? `: ${e.detail.reason}` : ""}`;
    case "reopened":
      return `${who} reopened it in ${e.detail.to}`;
    case "owner":
      return e.detail.to ? `${who} gave it to ${e.detail.to}` : `${who} took the owner off`;
    case "value":
      return `${who} changed the value from ${e.detail.from} to ${e.detail.to}`;
    default:
      return who;
  }
}
