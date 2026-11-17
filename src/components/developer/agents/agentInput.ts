import type { Agent, AgentInput, AgentLevel, AgentsOverview } from "../../../services/api";

// What the agent form holds while it is being filled in, and the checks that turn it into what the server is sent.
export type Draft = {
  name: string;
  level: AgentLevel;
  allNumbers: boolean;
  picked: string[];
  allowGroups: boolean;
  sharePhones: boolean;
  disclose: boolean;
  perHour: string;
  perDay: string;
  perChatHour: string;
  /** "30", "90", "365", "never", or (when editing) "keep" */
  expiry: string;
};

export const draftOf = (o: AgentsOverview, a?: Agent): Draft => ({
  name: a?.name ?? "",
  level: a?.level ?? "reply",
  allNumbers: a ? a.numbers.length === 0 : true,
  picked: a?.numbers ?? [],
  allowGroups: a?.allowGroups ?? false,
  sharePhones: a?.sharePhones ?? false,
  disclose: a?.disclose ?? true,
  perHour: String(a?.limits.perHour ?? o.defaults.perHour),
  perDay: String(a?.limits.perDay ?? o.defaults.perDay),
  perChatHour: String(a?.limits.perChatHour ?? o.defaults.perChatHour),
  expiry: a ? "keep" : String(o.defaults.expiresInDays),
});

/** What the form holds, checked: the thing to send, or what to put right. */
export function buildInput(o: AgentsOverview, d: Draft, editing: boolean): { value?: AgentInput; problem?: string } {
  const name = d.name.replace(/\s+/g, " ").trim();
  if (!name) return { problem: "Give the agent a name, for example Claude support helper." };
  if (name.length > 80) return { problem: "The name can be up to 80 characters." };
  const whole = (raw: string, [lo, hi]: [number, number], what: string) => {
    const n = Number(raw);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : `${what} must be a whole number from ${lo} to ${hi}.`;
  };
  const perHour = whole(d.perHour, o.bounds.perHour, "Messages an hour");
  const perDay = whole(d.perDay, o.bounds.perDay, "Messages a day");
  const perChatHour = whole(d.perChatHour, o.bounds.perChatHour, "Messages to one chat an hour");
  for (const x of [perHour, perDay, perChatHour]) if (typeof x === "string") return { problem: x };
  if (!d.allNumbers && !d.picked.length) return { problem: "Pick at least one number, or choose all numbers." };
  const base = {
    name,
    level: d.level,
    numbers: d.allNumbers ? [] : d.picked,
    allowGroups: d.allowGroups,
    sharePhones: d.sharePhones,
    disclose: d.disclose,
    perHour: perHour as number,
    perDay: perDay as number,
    perChatHour: perChatHour as number,
  };
  if (editing && d.expiry === "keep") return { value: base };
  return { value: { ...base, expiresInDays: d.expiry === "never" ? null : Number(d.expiry) } };
}
