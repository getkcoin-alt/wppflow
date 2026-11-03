import { Check, CheckCheck, Clock, Pin, Users } from "lucide-react";
import type { ChatThread } from "../../../types";
import { Avatar } from "../../ui/Avatar";
import { Swipeable, type SwipeAction } from "../../mobile/Swipeable";
import { useLongPress } from "../../../hooks/useLongPress";
import type { ChatSignal } from "../../../utils/chatSignal";

const TICK: Record<string, string> = { read: "text-info" };

/**
 * One conversation in the phone list. Who, what they last said, when, and at most one thing that is urgent. Pull it right to take
 * it or clear it, left to finish it; hold it for everything else. Labels, the assignee and the number are not here: they are in the
 * hold menu and in the chat, where they are useful.
 */
export function ChatRow({
  chat,
  title,
  time,
  signal,
  active,
  leading,
  trailing,
  onOpen,
  onMenu,
}: {
  chat: ChatThread;
  title: string;
  time: string;
  signal: ChatSignal | null;
  active?: boolean;
  leading: SwipeAction[];
  trailing: SwipeAction[];
  onOpen: () => void;
  onMenu: () => void;
}) {
  const press = useLongPress(onMenu);
  const unread = chat.unreadCount > 0;
  const out = Boolean(chat.lastMessage?.fromMe);
  const status = chat.lastMessage?.status;
  return (
    <Swipeable leading={leading} trailing={trailing} background="bg-surface">
      <div
        role="button"
        tabIndex={0}
        aria-current={active ? "true" : undefined}
        {...press}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen();
        }}
        className="hit-none group relative flex items-center gap-3 px-4 min-h-[76px] select-none active:bg-surface-2 transition-colors"
      >
        <div className="relative shrink-0">
          <Avatar
            src={chat.avatar}
            name={title}
            isGroup={chat.isGroup}
            className={`w-[52px] h-[52px] rounded-full object-cover ${chat.needsHuman && !chat.isClosed ? "ring-2 ring-danger ring-offset-2 ring-offset-surface" : ""}`}
          />
          {chat.isGroup && (
            <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center w-[18px] h-[18px] rounded-full bg-surface ring-2 ring-surface text-fg-2">
              <Users className="w-2.5 h-2.5" aria-hidden />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 py-2.5">
          <div className="flex items-baseline gap-2">
            <span className={`min-w-0 truncate text-[16.5px] leading-tight ${unread ? "font-semibold" : "font-medium"} text-fg`}>{title}</span>
            {chat.isPinned && <Pin className="w-3.5 h-3.5 shrink-0 text-gold self-center" aria-label="Pinned" />}
            <span className={`ml-auto shrink-0 text-[12.5px] num ${unread ? "text-brand font-semibold" : "text-fg-3"}`}>{time}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`min-w-0 flex-1 truncate text-[14.5px] leading-snug flex items-center gap-1 ${unread ? "text-fg" : "text-fg-2"}`}>
              {out && (
                <span className="shrink-0">
                  {status === "sending" ? <Clock className="w-3.5 h-3.5" aria-label="Sending" /> : status === "read" || status === "delivered" ? <CheckCheck className={`w-4 h-4 ${TICK[status] || "text-fg-3"}`} aria-label={status === "read" ? "Read" : "Delivered"} /> : <Check className="w-4 h-4 text-fg-3" aria-label="Sent" />}
                </span>
              )}
              <span className="truncate">{chat.lastMessage?.text || "No messages yet"}</span>
            </span>
            {unread && <span className="shrink-0 bg-brand-solid text-white text-[12px] font-semibold px-1.5 rounded-full min-w-[22px] h-[22px] grid place-items-center num">{chat.unreadCount > 99 ? "99+" : chat.unreadCount}</span>}
          </div>
          {signal && <div className={`mt-1 truncate text-[13px] font-medium ${signal.tone === "danger" ? "text-danger" : "text-warn"}`}>{signal.text}</div>}
        </div>
        <span aria-hidden className="absolute bottom-0 left-[80px] right-0 h-px bg-fg/[0.07]" />
      </div>
    </Swipeable>
  );
}
