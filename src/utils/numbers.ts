import type { WhatsAppSession } from "../types";

/** "+91 98100 11122" style text for whatever the server knows about a number ("9198…@c.us", "+9198…"). */
export function phoneText(phone?: string | null): string {
  const digits = String(phone || "")
    .replace(/@.*$/, "")
    .replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

/** What people call a number: its owner ("Sam", "Olivia (you)"), else its phone, else its name. */
export function numberName(
  session: WhatsAppSession,
  currentUserId?: number | string | null,
): string {
  const owner = String(session.ownerName || "").trim();
  if (owner) {
    const first = owner.split(/\s+/)[0];
    return currentUserId != null &&
      String(session.ownerUserId) === String(currentUserId)
      ? `${first} (you)`
      : first;
  }
  return phoneText(session.phone) || session.displayName || "Number";
}

/** The number a chat came in on, by the key the server stores on every conversation. */
export const sessionOfChat = (
  sessions: WhatsAppSession[],
  chat: { channel?: string; sessionKey?: string },
) =>
  sessions.find(
    (s) => s.sessionKey === (chat.sessionKey || chat.channel),
  );
