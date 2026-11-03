import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Menu as MenuIcon } from "lucide-react";
import { NAV, NAV_SECONDARY, isActive, navVisible, type NavItem, type UserSubTab, type View } from "./navigation";
import { AccountSheet, MenuSheet } from "./MenuSheet";

// Phone navigation. Four places that never move: Today, Inbox, one more, and the Menu. The "one more" is chosen from what the
// company has: its industry solution if it has one, otherwise the pipeline if the plan includes it, otherwise Contacts. Because it
// follows the company and not what the person did last, the bar is the same every day, which is what makes it a habit.
const KEY_TODAY = "dashboard";
const KEY_INBOX = "inbox";

export function thirdTab(solutions: string[], isLocked?: (item: NavItem) => boolean): NavItem {
  const find = (key: string) => NAV.find((i) => i.key === key)!;
  const estate = find("realestate");
  if (navVisible(estate, { manager: true, solutions })) return estate;
  const pipeline = find("pipeline");
  if (!isLocked?.(pipeline)) return pipeline;
  return find("contacts");
}

// the places visited last that live in the Menu (the bar already has its own), newest first
const RECENT_KEY = "scriwo_recent_places";
function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}
function writeRecent(keys: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(keys.slice(0, 6)));
  } catch {
    /* private mode: the row is simply not remembered */
  }
}

export function TabBar({
  view,
  tab,
  onNavigate,
  unreadChats,
  manager,
  isLocked,
  solutions = [],
  onSearch = () => {},
  account,
  hidden = false,
}: {
  view: View;
  tab: UserSubTab;
  onNavigate: (item: NavItem) => void;
  unreadChats: number;
  manager: boolean;
  /** True for a screen the company's plan doesn't include */
  isLocked?: (item: NavItem) => boolean;
  /** The industry solutions the company has */
  solutions?: string[];
  onSearch?: () => void;
  /** the signed-in person: their name and company, and what the Account sheet holds (workspace, look, sign out) */
  account?: { name: string; company?: string | null; panel: ReactNode };
  /** slide away: a chat is open, or the keyboard is up */
  hidden?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);

  const visible = (i: NavItem) => navVisible(i, { manager, solutions });
  const third = useMemo(() => thirdTab(solutions, isLocked), [solutions, isLocked]);
  const tabs = useMemo(() => [KEY_TODAY, KEY_INBOX, third.key].map((k) => NAV.find((i) => i.key === k)!), [third]);
  const tabKeys = tabs.map((t) => t.key);

  const inMenu = useMemo(() => [...NAV, ...NAV_SECONDARY].filter((i) => !tabKeys.includes(i.key)).filter(visible), [manager, solutions, third]); // eslint-disable-line react-hooks/exhaustive-deps
  const work = inMenu.filter((i) => i.view === "user");
  const company = inMenu.filter((i) => i.view !== "user");
  const menuActive = inMenu.some((i) => isActive(i, view, tab));

  // remember the places visited from the Menu, so the next visit is one tap
  const [recentKeys, setRecentKeys] = useState<string[]>(readRecent);
  const here = inMenu.find((i) => isActive(i, view, tab));
  useEffect(() => {
    if (!here) return;
    setRecentKeys((prev) => {
      if (prev[0] === here.key) return prev;
      const next = [here.key, ...prev.filter((k) => k !== here.key)];
      writeRecent(next);
      return next;
    });
  }, [here?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const recent = recentKeys
    .map((k) => inMenu.find((i) => i.key === k))
    .filter((i): i is NavItem => Boolean(i) && !isActive(i!, view, tab))
    .slice(0, 3);

  // the bar's height is shared with whatever sits above it (the round button, the toast), and is zero while it is away
  useLayoutEffect(() => {
    const root = document.documentElement;
    const el = nav.current;
    if (hidden || !el) {
      root.style.setProperty("--tabbar-h", "0px");
      return;
    }
    const set = () => root.style.setProperty("--tabbar-h", `${el.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.setProperty("--tabbar-h", "0px");
    };
  }, [hidden]);

  return (
    <>
      <nav
        ref={nav}
        aria-label="Main"
        aria-hidden={hidden || undefined}
        inert={hidden}
        data-hidden={hidden || undefined}
        className={`lg:hidden glass border-t border-line shrink-0 grid grid-cols-4 items-start px-1 pt-1.5 overflow-hidden transition-[max-height,opacity,padding] duration-200 ease-out motion-reduce:transition-none ${hidden ? "max-h-0 opacity-0 !pt-0 !border-t-0" : "max-h-28 opacity-100"}`}
        style={{ paddingBottom: hidden ? 0 : "max(env(safe-area-inset-bottom), 6px)" }}
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, view, tab);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item)}
              aria-current={active ? "page" : undefined}
              className={`press relative min-h-[52px] flex flex-col items-center justify-center gap-0.5 ${active ? "text-fg" : "text-fg-3"}`}
            >
              <span className={`relative h-8 w-14 rounded-full grid place-items-center transition-colors ${active ? "bg-fg/[0.09]" : ""}`}>
                <Icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {item.key === KEY_INBOX && unreadChats > 0 && (
                  <span className="absolute top-0 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-solid text-white text-[10.5px] font-semibold grid place-items-center num ring-2 ring-surface">
                    {unreadChats > 99 ? "99+" : unreadChats}
                  </span>
                )}
              </span>
              <span className={`text-[11px] leading-none ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Menu"
          aria-haspopup="dialog"
          className={`press relative min-h-[52px] flex flex-col items-center justify-center gap-0.5 ${menuActive ? "text-fg" : "text-fg-3"}`}
        >
          <span className={`h-8 w-14 rounded-full grid place-items-center transition-colors ${menuActive ? "bg-fg/[0.09]" : ""}`}>
            <MenuIcon className="w-6 h-6" strokeWidth={menuActive ? 2.2 : 1.8} aria-hidden />
          </span>
          <span className={`text-[11px] leading-none ${menuActive ? "font-semibold" : "font-medium"}`}>Menu</span>
        </button>
      </nav>

      <MenuSheet
        open={menu}
        onClose={() => setMenu(false)}
        work={work}
        company={company}
        recent={recent}
        isActive={(i) => isActive(i, view, tab)}
        isLocked={isLocked}
        onNavigate={onNavigate}
        onSearch={onSearch}
        account={
          account
            ? {
                name: account.name,
                company: account.company,
                // the Menu hands over to the Account sheet; the two are never stacked
                onOpen: () => {
                  setMenu(false);
                  setAccountOpen(true);
                },
              }
            : undefined
        }
      />
      {account && (
        <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)}>
          {account.panel}
        </AccountSheet>
      )}
    </>
  );
}
