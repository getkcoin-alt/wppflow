import { handoffLabel } from "./handoff";
import { formatDuration } from "./duration";
import type { ChatThread } from "../types";

export interface ChatSignal {
  key: "asked" | "waiting" | "late";
  text: string;
  tone: "danger" | "warn";
}

/**
 * The one thing a chat row says about urgency, and nothing otherwise: a person was asked for, or the customer has been waiting
 * for a reply (amber, then red once it is past the team's reply target). A row with a signal is the row to open first.
 */
export function chatSignal(
  chat: Pick<ChatThread, "needsHuman" | "needsHumanReason" | "isClosed" | "awaitingSince" | "isGroup">,
  nowMs: number,
  replyTargetMinutes = 30,
): ChatSignal | null {
  if (chat.isClosed) return null;
  if (chat.needsHuman) return { key: "asked", text: handoffLabel(chat.needsHumanReason).label, tone: "danger" };
  if (chat.awaitingSince && !chat.isGroup) {
    const waited = Math.max(0, nowMs / 1000 - chat.awaitingSince);
    if (waited < 60) return null;
    const late = waited > replyTargetMinutes * 60;
    return { key: late ? "late" : "waiting", text: `Waiting ${formatDuration(waited)}`, tone: late ? "danger" : "warn" };
  }
  return null;
}

/** How many chats have a customer waiting on a reply (not resolved, not a group) */
export const waitingCount = (chats: Pick<ChatThread, "awaitingSince" | "isClosed" | "isGroup" | "needsHuman">[]) =>
  chats.filter((c) => !c.isClosed && !c.isGroup && (c.needsHuman || c.awaitingSince)).length;
