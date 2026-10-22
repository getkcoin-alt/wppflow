import { timeAgo } from "../../utils/timeAgo";

// Categories describe what a teammate does. Permissions still come from the role.
export const CATEGORIES = [
  { key: "general", label: "General" },
  { key: "sales", label: "Sales" },
  { key: "support", label: "Support" },
  { key: "billing", label: "Billing" },
  { key: "operations", label: "Operations" },
  { key: "marketing", label: "Marketing" },
] as const;

export const categoryLabel = (key?: string) =>
  CATEGORIES.find((c) => c.key === key)?.label ||
  (key ? key[0].toUpperCase() + key.slice(1) : "General");

// The role dropdown is one control: "admin", or "agent:<category>".
export const choiceOf = (role: string, category?: string) =>
  role === "admin" ? "admin" : `agent:${category || "general"}`;

export const parseChoice = (choice: string) =>
  choice === "admin"
    ? { role: "admin", category: "general" }
    : { role: "agent", category: choice.split(":")[1] || "general" };

export const roleText = (role: string, category?: string) =>
  role === "owner"
    ? "Owner"
    : role === "admin"
      ? "Administrator"
      : `Agent · ${categoryLabel(category)}`;

export interface InviteMail {
  status: "sent" | "failed" | "not_configured" | "unknown";
  sentAt?: string | null;
  error?: string | null;
  attempts?: number;
}

export type MailTone = "ok" | "warn" | "danger" | "neutral";

// One plain sentence about what happened to an invitation email.
export function mailLine(
  mail: InviteMail,
  expired: boolean,
  now = Date.now(),
): { tone: MailTone; text: string } {
  if (mail.status === "failed")
    return {
      tone: "danger",
      text: `Email not delivered${mail.error ? `: ${mail.error}` : ""}`,
    };
  if (mail.status === "not_configured")
    return {
      tone: "warn",
      text: "Email isn't set up, so share the link yourself",
    };
  if (mail.status === "sent") {
    if (expired) return { tone: "warn", text: "Link expired. Send a new one" };
    return {
      tone: "ok",
      text: `Email sent${mail.sentAt ? ` ${timeAgo(mail.sentAt, now)}` : ""}`,
    };
  }
  return {
    tone: expired ? "warn" : "neutral",
    text: expired ? "Link expired. Send a new one" : "Email status unknown",
  };
}
