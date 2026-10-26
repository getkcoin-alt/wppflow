import { useState, type ReactNode } from "react";
import { Lock, MoreHorizontal, X } from "lucide-react";
import {
  NAV,
  NAV_SECONDARY,
  isActive,
  lockedHint,
  type NavItem,
  type UserSubTab,
  type View,
} from "./navigation";

const PRIMARY_KEYS = ["inbox", "sessions", "contacts"];

// Phone navigation: three primary destinations, alerts, and a "More" sheet for the rest.
export function TabBar({
  view,
  tab,
  onNavigate,
  unreadChats,
  manager,
  bell,
  sheetExtras,
  isLocked,
}: {
  view: View;
  tab: UserSubTab;
  onNavigate: (item: NavItem) => void;
  unreadChats: number;
  manager: boolean;
  bell: ReactNode;
  sheetExtras: ReactNode;
  /** True for a screen the company's plan doesn't include */
  isLocked?: (item: NavItem) => boolean;
}) {
  const [more, setMore] = useState(false);
  const visible = (i: NavItem) => !i.manager || manager;
  const primary = NAV.filter((i) => PRIMARY_KEYS.includes(i.key));
  const rest = [
    ...NAV.filter((i) => !PRIMARY_KEYS.includes(i.key)),
    ...NAV_SECONDARY,
  ].filter(visible);
  const moreActive = rest.some((i) => isActive(i, view, tab));

  return (
    <>
      <nav
        aria-label="Main"
        className="lg:hidden glass border-t border-line shrink-0 grid grid-cols-5 items-center px-2 pt-1.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, view, tab);
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item)}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 ${active ? "text-fg" : "text-fg-3"}`}
            >
              <span className="relative">
                <Icon className="w-6 h-6" strokeWidth={active ? 2.1 : 1.8} />
                {item.key === "inbox" && unreadChats > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-brand-solid text-white text-[10px] font-semibold grid place-items-center num">
                    {unreadChats > 99 ? "99+" : unreadChats}
                  </span>
                )}
              </span>
              <span className="text-[10.5px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <div className="flex justify-center">{bell}</div>
        <button
          onClick={() => setMore(true)}
          aria-label="More"
          className={`flex flex-col items-center gap-0.5 py-1.5 ${moreActive ? "text-fg" : "text-fg-3"}`}
        >
          <MoreHorizontal className="w-6 h-6" />
          <span className="text-[10.5px] font-medium">More</span>
        </button>
      </nav>

      {more && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <button
            aria-label="Close"
            onClick={() => setMore(false)}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade"
          />
          <div
            role="dialog"
            aria-label="More"
            className="relative w-full bg-surface rounded-t-[32px] pop p-5 animate-rise max-h-[85dvh] overflow-y-auto"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-fg/15" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[18px] font-semibold">More</h2>
              <button
                onClick={() => setMore(false)}
                aria-label="Close"
                className="h-9 w-9 grid place-items-center rounded-full bg-surface-2 text-fg-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {rest.map((item) => {
                const Icon = item.icon;
                const locked = isLocked?.(item);
                return (
                  <button
                    key={item.key}
                    title={locked ? lockedHint(item) : undefined}
                    onClick={() => {
                      setMore(false);
                      onNavigate(item);
                    }}
                    className="relative rounded-2xl bg-surface-2 py-4 flex flex-col items-center gap-2 text-fg"
                  >
                    {locked && <Lock data-testid={`locked-${item.key}`} aria-hidden="true" className="absolute top-2 right-2 w-3.5 h-3.5 text-fg-3" strokeWidth={2.2} />}
                    <Icon className={`w-6 h-6 ${locked ? "text-fg-3" : ""}`} />
                    <span className="text-[12.5px] font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {sheetExtras}
          </div>
        </div>
      )}
    </>
  );
}
