import { useEffect, useRef } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import { countExtra, type InboxExtraFilters } from "../InboxFilters";
import { usePhoneChrome } from "../../mobile/PhoneChrome";

type Tab = "all" | "unread" | "groups";

const chip = (on: boolean) =>
  `press shrink-0 h-9 px-4 rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 transition-colors ${on ? "bg-fg text-app" : "bg-surface-2 text-fg-2"}`;

/** The filters that are not already a chip of their own, counted for the "Filters" chip */
export const otherFilters = (extra: InboxExtraFilters) => countExtra({ ...extra, waiting: extra.waiting === "waiting" ? "" : extra.waiting, assigned: extra.assigned === "me" ? "" : extra.assigned });

/**
 * The top of the phone inbox: the title and the two things a person reaches for (search, alerts), one line that appears only when
 * a number needs care, and one row of filters that scrolls. Everything else about narrowing the list is behind "Filters".
 */
export function PhoneListTop({
  searchOpen,
  onSearchOpen,
  query,
  onQuery,
  tab,
  onTab,
  extra,
  onExtra,
  unread,
  waiting,
  onOpenFilters,
  numbersDown,
  onOpenSessions,
  availability,
}: {
  searchOpen: boolean;
  onSearchOpen: (open: boolean) => void;
  query: string;
  onQuery: (q: string) => void;
  tab: Tab;
  onTab: (t: Tab) => void;
  extra: InboxExtraFilters;
  onExtra: (e: InboxExtraFilters) => void;
  unread: number;
  waiting: number;
  onOpenFilters: () => void;
  numbersDown: number;
  onOpenSessions?: () => void;
  availability?: { inRotation: boolean; available: boolean; onToggle: () => void } | null;
}) {
  const chrome = usePhoneChrome();
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) field.current?.focus();
  }, [searchOpen]);
  const showSearch = searchOpen || query.length > 0;
  const mine = extra.assigned === "me";
  const waitingOn = extra.waiting === "waiting";
  const plain = tab === "all" && !mine && !waitingOn;
  const others = otherFilters(extra);

  return (
    <div className="shrink-0 bg-surface">
      <div className="h-14 pl-5 pr-2 flex items-center gap-2">
        <h2 className="text-[28px] leading-none font-semibold text-fg">Inbox</h2>
        {availability?.inRotation && (
          <button
            type="button"
            role="switch"
            aria-checked={availability.available}
            aria-label="Taking new chats"
            onClick={availability.onToggle}
            className={`h-8 px-2.5 rounded-full text-[12.5px] font-medium inline-flex items-center gap-1.5 ${availability.available ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
            {availability.available ? "Taking chats" : "Away"}
          </button>
        )}
        <span className="flex-1" />
        <button type="button" onClick={() => onSearchOpen(true)} aria-label="Search" className="press h-11 w-11 grid place-items-center rounded-full text-fg-2">
          <Search className="w-[22px] h-[22px]" strokeWidth={1.9} aria-hidden />
        </button>
        {chrome?.bell}
      </div>

      {numbersDown > 0 && (
        <button type="button" onClick={onOpenSessions} className="mx-4 mb-2 w-[calc(100%-2rem)] h-10 rounded-xl bg-warn/10 text-warn text-[14px] font-medium flex items-center gap-2 px-3 text-left">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
          <span className="truncate">{numbersDown === 1 ? "A number is not connected" : `${numbersDown} numbers are not connected`}</span>
          {onOpenSessions && <span className="ml-auto font-semibold">Fix</span>}
        </button>
      )}

      {showSearch && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="relative flex-1 flex items-center bg-surface-2 rounded-xl h-11">
            <Search className="w-4 h-4 text-fg-3 ml-3.5 shrink-0" aria-hidden />
            <input
              ref={field}
              type="text"
              placeholder="Search conversations"
              aria-label="Search conversations"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              className="w-full bg-transparent pl-2.5 pr-9 text-[16px] focus:outline-none"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => onQuery("")} className="absolute right-2 h-8 w-8 grid place-items-center text-fg-3">
                <X className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onQuery("");
              onSearchOpen(false);
            }}
            className="h-11 px-2 text-[15px] font-medium text-brand"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="chip-row px-4 pb-2.5" role="group" aria-label="Show">
        <button type="button" aria-pressed={plain} onClick={() => { onTab("all"); onExtra({ ...extra, waiting: "", assigned: "" }); }} className={chip(plain)}>
          All
        </button>
        <button type="button" aria-pressed={tab === "unread"} onClick={() => onTab(tab === "unread" ? "all" : "unread")} className={chip(tab === "unread")}>
          Unread
          {unread > 0 && <span className="num opacity-80">{unread}</span>}
        </button>
        <button type="button" aria-pressed={waitingOn} onClick={() => onExtra({ ...extra, waiting: waitingOn ? "" : "waiting" })} className={chip(waitingOn)}>
          Waiting
          {waiting > 0 && <span className="num opacity-80">{waiting}</span>}
        </button>
        <button type="button" aria-pressed={mine} onClick={() => onExtra({ ...extra, assigned: mine ? "" : "me" })} className={chip(mine)}>
          Mine
        </button>
        <button type="button" aria-pressed={tab === "groups"} onClick={() => onTab(tab === "groups" ? "all" : "groups")} className={chip(tab === "groups")}>
          Groups
        </button>
        <button type="button" onClick={onOpenFilters} className={chip(others > 0)}>
          Filters
          {others > 0 && <span className="num opacity-80">{others}</span>}
        </button>
      </div>
    </div>
  );
}
