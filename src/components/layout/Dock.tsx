import type { ReactNode } from "react";
import { Lock, Search } from "lucide-react";
import { ScriwoMark } from "../brand/Logo";
import {
  NAV,
  NAV_SECONDARY,
  isActive,
  lockedHint,
  navVisible,
  type NavItem,
  type UserSubTab,
  type View,
} from "./navigation";

function DockButton({
  item,
  active,
  badge,
  locked = false,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  /** The company's plan doesn't include this screen: it stays in the list, marked, and opens an explanation */
  locked?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      aria-label={item.label}
      title={locked ? lockedHint(item) : undefined}
      aria-current={active ? "page" : undefined}
      className={`group relative w-[68px] py-2.5 [@media(max-height:760px)]:py-1.5 rounded-2xl flex flex-col items-center gap-1 transition-colors shrink-0 ${
        active
          ? "bg-surface-2 text-fg"
          : "text-fg-3 hover:text-fg hover:bg-surface-2/60"
      }`}
    >
      {active && (
        <span className="absolute left-[-9px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gold-gradient" />
      )}
      <span className="relative">
        <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.1 : 1.8} />
        {locked && (
          <span data-testid={`locked-${item.key}`} aria-hidden="true" className="absolute -top-1.5 -right-2.5 h-[17px] w-[17px] rounded-full bg-surface-2 text-fg-3 grid place-items-center ring-2 ring-surface">
            <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
          </span>
        )}
        {!!badge && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-solid text-white text-[10px] font-semibold grid place-items-center ring-2 ring-surface num">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium leading-none">{item.label}</span>
    </button>
  );
}

// The desktop navigation: a quiet column of icons with small labels, like a device dock.
export function Dock({
  view,
  tab,
  onNavigate,
  unreadChats,
  manager,
  bell,
  profile,
  onSearch,
  isLocked,
  solutions = [],
}: {
  view: View;
  tab: UserSubTab;
  onNavigate: (item: NavItem) => void;
  unreadChats: number;
  manager: boolean;
  bell: ReactNode;
  profile: ReactNode;
  onSearch: () => void;
  /** True for a screen the company's plan doesn't include */
  isLocked?: (item: NavItem) => boolean;
  /** The industry solutions the company has */
  solutions?: string[];
}) {
  const visible = (i: NavItem) => navVisible(i, { manager, solutions });
  return (
    <aside className="hidden lg:flex w-[92px] shrink-0 h-full min-h-0 flex-col items-center pt-5 [@media(max-height:760px)]:pt-3 pb-3 border-r border-line bg-surface">
      <div className="mb-3 shrink-0">
        <ScriwoMark size={44} />
      </div>
      {/* The screens scroll on their own when the window is short, so the top and the bottom buttons are always in reach. */}
      <div data-testid="dock-scroll" className="dock-scroll flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1 py-2">
        <nav className="flex flex-col items-center gap-1" aria-label="Main">
          {NAV.filter(visible).map((item) => (
            <DockButton
              key={item.key}
              item={item}
              active={isActive(item, view, tab)}
              badge={item.key === "inbox" ? unreadChats : undefined}
              locked={isLocked?.(item)}
              onClick={() => onNavigate(item)}
            />
          ))}
        </nav>
        <div className="my-1.5 h-px w-8 bg-line shrink-0" />
        <nav className="flex flex-col items-center gap-1" aria-label="Workspace">
          {NAV_SECONDARY.filter(visible).map((item) => (
            <DockButton
              key={item.key}
              item={item}
              active={isActive(item, view, tab)}
              locked={isLocked?.(item)}
              onClick={() => onNavigate(item)}
            />
          ))}
        </nav>
      </div>
      <div className="shrink-0 w-full pt-2 flex flex-col items-center gap-1.5 border-t border-line/70">
        <button
          onClick={onSearch}
          aria-label="Search and commands (Command K)"
          title="Search  ⌘K"
          className="h-11 w-11 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9 rounded-full grid place-items-center text-fg-2 hover:text-fg hover:bg-surface-2 transition"
        >
          <Search className="w-[21px] h-[21px]" strokeWidth={1.8} />
        </button>
        {bell}
        {profile}
      </div>
    </aside>
  );
}
