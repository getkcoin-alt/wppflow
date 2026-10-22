import type { OpeningHours, RuleAction, RuleDraft, RuleTrigger } from "../services/api";

export const DEFAULT_HOURS: OpeningHours = { timezone: "Asia/Dubai", days: [1, 2, 3, 4, 5, 6], start: "09:00", end: "18:00" };

export const TRIGGER_LABELS: Record<RuleTrigger, string> = {
  keyword: "A message contains certain words",
  first_message: "Someone writes for the first time",
  after_hours: "Someone writes outside opening hours",
};
export const ACTION_LABELS: Record<RuleAction, string> = {
  reply_text: "Send a reply",
  assign_agent: "Assign the chat to a teammate",
  add_tag: "Add a tag to the customer",
  opt_in: "Record permission for broadcasts",
  opt_out: "Take them off broadcasts",
};
export const MATCH_LABELS = {
  contains: "Contains the words",
  word: "Contains the whole word",
  exact: "Is exactly the words",
} as const;
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const keywordList = (condition: string): string[] =>
  condition
    .split(/[\n,;،]+/)
    .map((k) => k.trim())
    .filter(Boolean);

/** Monday–Friday, Mon–Sat, every day, or the days named. */
export function describeDays(days: number[]): string {
  const sorted = [...days].sort();
  const key = sorted.join("");
  if (key === "1234567") return "every day";
  if (key === "12345") return "Monday to Friday";
  if (key === "123456") return "Monday to Saturday";
  return sorted.map((d) => DAY_NAMES[d - 1]).join(", ");
}
export const describeHours = (h: OpeningHours): string =>
  `${describeDays(h.days)}, ${h.start}–${h.end} (${h.timezone.replace(/_/g, " ")})`;

const quote = (words: string[], limit = 4) => {
  const shown = words.slice(0, limit).map((w) => `“${w}”`);
  return words.length > limit ? `${shown.join(", ")} and ${words.length - limit} more` : shown.join(", ");
};
const clip = (text: string, n = 120) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

/** A rule in a sentence a customer-service person can check at a glance. */
export function describeRule(rule: Pick<RuleDraft, "triggerType" | "triggerCondition" | "actionType" | "actionSummary" | "config">): {
  when: string;
  then: string;
} {
  const c = rule.config || {};
  const words = keywordList(rule.triggerCondition || "");
  const when =
    rule.triggerType === "first_message"
      ? "When someone writes for the first time"
      : rule.triggerType === "after_hours"
        ? `When someone writes outside ${c.hours ? describeHours(c.hours) : "opening hours"}`
        : c.match === "exact"
          ? `When the message is exactly ${quote(words) || "…"}`
          : c.match === "word"
            ? `When a message has the word ${quote(words) || "…"}`
            : `When a message contains ${quote(words) || "…"}`;
  const reply = c.reply ? ` and replies “${clip(c.reply, 70)}”` : "";
  const then =
    rule.actionType === "reply_text"
      ? rule.actionSummary
        ? `replies “${clip(rule.actionSummary)}”`
        : "replies with the answer you write below"
      : rule.actionType === "assign_agent"
        ? `assigns the chat to ${rule.actionSummary || "a teammate"}${reply}`
        : rule.actionType === "add_tag"
          ? `tags the customer “${rule.actionSummary || "…"}”${reply}`
          : rule.actionType === "opt_in"
            ? `records their permission for broadcasts${reply}`
            : `takes them off broadcasts${reply}`;
  return { when, then };
}

/** Time zones people choose between, plus their own if it isn't listed. */
export const TIMEZONES = [
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Europe/London",
  "Europe/Istanbul",
  "Asia/Singapore",
  "Asia/Manila",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];
export const browserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const blankRule = (): RuleDraft => ({
  name: "",
  triggerType: "keyword",
  triggerCondition: "",
  actionType: "reply_text",
  actionSummary: "",
  config: { match: "contains" },
});

/** A ready-made rule's opening hours are in the company's likely zone: start from the person's own. */
export function withOwnTimezone(rule: RuleDraft): RuleDraft {
  return rule.triggerType === "after_hours" && rule.config.hours
    ? { ...rule, config: { ...rule.config, hours: { ...rule.config.hours, timezone: browserTimezone() } } }
    : rule;
}

/** A sentence ends with a full stop, unless it already ends with a closing quote. */
export const endSentence = (text: string): string => (/[”.!?]$/.test(text) ? text : `${text}.`);
