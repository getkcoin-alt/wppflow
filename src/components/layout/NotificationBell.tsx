import { useEffect, useRef, useState } from "react";
import { AtSign, Bell, NotebookPen, Smartphone, UserCheck } from "lucide-react";
import type { AppNotification } from "../../types";
import { timeAgo } from "../../utils/timeAgo";

const ICON: Record<string, typeof Bell> = {
  note: NotebookPen,
  mention: AtSign,
  assignment: UserCheck,
  session: Smartphone,
};

export function NotificationBell({
  items,
  unreadCount,
  onOpen,
  onMarkAllRead,
  desktop,
  onEnableDesktop,
}: {
  items: AppNotification[];
  unreadCount: number;
  onOpen: (n: AppNotification) => void;
  onMarkAllRead: () => void;
  desktop: "granted" | "denied" | "default" | "unsupported";
  onEnableDesktop: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        aria-label={
          unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl bg-[#202c33] border border-[#2a3942] hover:border-emerald-500/50 text-slate-300"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 max-w-[92vw] bg-[#182229] border border-[#2a3942] rounded-2xl shadow-2xl z-50 text-xs overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a3942]">
            <span className="font-bold text-white">Notifications</span>
            <button
              disabled={!unreadCount}
              onClick={onMarkAllRead}
              className="text-emerald-400 disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-slate-400">
                You're all caught up. Team notes, mentions and assignments show
                up here.
              </li>
            )}
            {items.map((n) => {
              const Icon = ICON[n.type] || Bell;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      onOpen(n);
                    }}
                    className={`w-full text-left px-3 py-2.5 flex gap-2.5 hover:bg-[#202c33] border-b border-[#2a3942]/60 ${n.read ? "opacity-70" : ""}`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-slate-100 font-semibold leading-snug">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="block text-slate-400 truncate">
                          {n.body}
                        </span>
                      )}
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span
                        aria-label="unread"
                        className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {desktop === "default" && (
            <button
              onClick={onEnableDesktop}
              className="w-full px-3 py-2 text-emerald-400 hover:bg-[#202c33] text-left"
            >
              Turn on desktop alerts for when this tab is in the background
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationToasts({
  toasts,
  onOpen,
  onDismiss,
}: {
  toasts: AppNotification[];
  onOpen: (n: AppNotification) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] space-y-2 w-80 max-w-[92vw]"
      aria-live="polite"
    >
      {toasts.map((n) => (
        <div
          key={n.id}
          role="status"
          className="bg-[#182229] border border-emerald-500/40 rounded-xl shadow-2xl p-3 text-xs"
        >
          <button className="text-left w-full" onClick={() => onOpen(n)}>
            <span className="block font-semibold text-white">{n.title}</span>
            {n.body && (
              <span className="block text-slate-400 truncate">{n.body}</span>
            )}
          </button>
          <button
            aria-label="Dismiss"
            onClick={() => onDismiss(n.id)}
            className="absolute top-1.5 right-2 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
