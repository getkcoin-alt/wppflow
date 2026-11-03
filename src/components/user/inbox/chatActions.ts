import { CheckCircle2, CheckCheck, MessageSquare, Pin, PinOff, RotateCcw, UserCheck, UserMinus, Users } from "lucide-react";
import type { ChatThread } from "../../../types";
import type { SheetAction } from "../../mobile/ActionSheet";
import type { SwipeAction } from "../../mobile/Swipeable";

// What can be done with a chat from the list, as one set that feeds both the swipe trays and the long-press menu, so the two never
// disagree. Only what the screen has a handler for is offered.
export interface ChatActionHandlers {
  /** the signed-in person, if known among the teammates */
  me?: { id: number | string; name: string } | null;
  canPickTeammate?: boolean;
  onOpen: (chat: ChatThread) => void;
  onAssign?: (chat: ChatThread, name: string) => void;
  onPickAssignee?: (chat: ChatThread) => void;
  onMarkRead?: (chat: ChatThread) => void;
  onTogglePin?: (chat: ChatThread, pinned: boolean) => void;
  onToggleDone?: (chat: ChatThread) => void;
  onMore: (chat: ChatThread) => void;
}

export const isMine = (chat: ChatThread, me?: { name: string } | null) => Boolean(me && chat.assignedTo && chat.assignedTo === me.name);

/** The long-press menu */
export function chatMenu(chat: ChatThread, h: ChatActionHandlers): SheetAction[] {
  const out: SheetAction[] = [{ key: "open", label: "Open chat", icon: MessageSquare, onSelect: () => h.onOpen(chat) }];
  if (h.onAssign && h.me && !isMine(chat, h.me)) out.push({ key: "mine", label: "Assign to me", icon: UserCheck, onSelect: () => h.onAssign!(chat, h.me!.name) });
  if (h.onPickAssignee && h.canPickTeammate) out.push({ key: "assign", label: "Assign to…", icon: Users, hint: chat.assignedTo ? `Now: ${chat.assignedTo}` : undefined, onSelect: () => h.onPickAssignee!(chat) });
  if (h.onAssign && chat.assignedTo) out.push({ key: "unassign", label: "Unassign", icon: UserMinus, onSelect: () => h.onAssign!(chat, "Unassigned") });
  if (h.onMarkRead && chat.unreadCount > 0) out.push({ key: "read", label: "Mark as read", icon: CheckCheck, onSelect: () => h.onMarkRead!(chat) });
  if (h.onTogglePin) out.push({ key: "pin", label: chat.isPinned ? "Unpin from the top" : "Pin to the top", icon: chat.isPinned ? PinOff : Pin, onSelect: () => h.onTogglePin!(chat, !chat.isPinned) });
  if (h.onToggleDone) out.push({ key: "done", label: chat.isClosed ? "Reopen" : "Mark as done", icon: chat.isClosed ? RotateCcw : CheckCircle2, onSelect: () => h.onToggleDone!(chat) });
  return out;
}

/** Pulled to the right: take it, or clear its badge */
export function leadingSwipes(chat: ChatThread, h: ChatActionHandlers): SwipeAction[] {
  const out: SwipeAction[] = [];
  if (h.onAssign && h.me && !isMine(chat, h.me)) out.push({ key: "mine", label: "Mine", icon: UserCheck, tone: "brand", onTrigger: () => h.onAssign!(chat, h.me!.name) });
  if (h.onMarkRead && chat.unreadCount > 0) out.push({ key: "read", label: "Read", icon: CheckCheck, tone: "info", onTrigger: () => h.onMarkRead!(chat) });
  return out;
}

/** Pulled to the left: done with it, or more */
export function trailingSwipes(chat: ChatThread, h: ChatActionHandlers): SwipeAction[] {
  const out: SwipeAction[] = [];
  if (h.onToggleDone) out.push({ key: "done", label: chat.isClosed ? "Reopen" : "Done", icon: chat.isClosed ? RotateCcw : CheckCircle2, tone: "ok", onTrigger: () => h.onToggleDone!(chat) });
  out.push({ key: "more", label: "More", tone: "neutral", onTrigger: () => h.onMore(chat) });
  return out;
}
