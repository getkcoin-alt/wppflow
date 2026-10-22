import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AtSign,
  Bell,
  NotebookPen,
  Smartphone,
  UserCheck,
  X,
} from "lucide-react";
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
  placement = "dock",
}: {
  items: AppNotification[];
  unreadCount: number;
  onOpen: (n: AppNotification) => void;
  onMarkAllRead: () => void;
  desktop: "granted" | "denied" | "default" | "unsupported";
  onEnableDesktop: () => void;
  /** dock: opens beside the left dock; tab: opens as a sheet above the phone tab bar */
  placement?: "dock" | "tab";
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !sheet.current?.contains(t))
        setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const panel = (
    <>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[16px] font-semibold text-fg">Notifications</h2>
        <button
          disabled={!unreadCount}
          onClick={onMarkAllRead}
          className="text-[13px] font-medium text-gold disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>
      <ul className="max-h-[60dvh] lg:max-h-96 overflow-y-auto px-2 pb-2">
        {items.length === 0 && (
          <li className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 h-11 w-11 rounded-full bg-surface-2 grid place-items-center text-fg-3">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-[14px] font-medium text-fg">
              You're all caught up
            </p>
            <p className="text-[13px] text-fg-2 mt-1">
              Team notes, mentions and assignments will appear here.
            </p>
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
                className={`w-full text-left px-3 py-3 rounded-2xl flex gap-3 hover:bg-surface-2 transition ${n.read ? "opacity-60" : ""}`}
              >
                <span className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-surface-2 grid place-items-center text-gold">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-fg font-medium leading-snug">
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="block text-[13px] text-fg-2 truncate">
                      {n.body}
                    </span>
                  )}
                  <span className="block text-[12px] text-fg-3 mt-0.5">
                    {timeAgo(n.createdAt)}
                  </span>
                </span>
                {!n.read && (
                  <span
                    aria-label="unread"
                    className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0"
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
          className="w-[calc(100%-1rem)] mx-2 mb-2 px-3 py-2.5 rounded-2xl bg-surface-2 text-[13px] text-fg-2 hover:text-fg text-left"
        >
          Get desktop alerts when this tab is in the background
        </button>
      )}
    </>
  );

  return (
    <div className="relative" ref={box}>
      <button
        aria-label={
          unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative grid place-items-center text-fg-2 hover:text-fg transition ${
          placement === "dock"
            ? "h-11 w-11 rounded-full hover:bg-surface-2"
            : "h-11 w-11 rounded-full"
        }`}
      >
        <Bell className="w-[22px] h-[22px]" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-solid text-[10px] font-semibold text-white grid place-items-center ring-2 ring-surface num"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open &&
        (placement === "dock" ? (
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute left-full ml-3 bottom-0 w-[22rem] glass ring-1 ring-line rounded-3xl pop z-50 animate-rise"
          >
            {panel}
          </div>
        ) : (
          createPortal(
            <div className="fixed inset-0 z-50 flex items-end" ref={sheet}>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade"
              />
              <div
                role="dialog"
                aria-label="Notifications"
                className="relative w-full bg-surface rounded-t-[32px] pop animate-rise"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
                }}
              >
                <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-fg/15" />
                {panel}
              </div>
            </div>,
            document.body,
          )
        ))}
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
      className="fixed top-4 right-4 left-4 sm:left-auto z-[60] space-y-2 sm:w-96 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((n) => (
        <div
          key={n.id}
          role="status"
          className="relative glass ring-1 ring-line rounded-3xl pop p-4 pr-11 animate-rise pointer-events-auto"
        >
          <button className="text-left w-full" onClick={() => onOpen(n)}>
            <span className="block text-[14px] font-semibold text-fg">
              {n.title}
            </span>
            {n.body && (
              <span className="block text-[13px] text-fg-2 truncate mt-0.5">
                {n.body}
              </span>
            )}
          </button>
          <button
            aria-label="Dismiss"
            onClick={() => onDismiss(n.id)}
            className="absolute top-3 right-3 h-7 w-7 grid place-items-center rounded-full text-fg-3 hover:text-fg hover:bg-surface-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
