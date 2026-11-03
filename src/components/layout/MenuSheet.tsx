import type { ReactNode } from "react";
import { ChevronRight, Lock, Search } from "lucide-react";
import { SheetShell } from "../ui/Sheet";
import { Avatar } from "../ui/Avatar";
import { lockedHint, type NavItem } from "./navigation";

// The Menu: everything that is not one of the four tabs, as a plain list, in the order people reach for it. Search is the first
// row; the places visited last come next (a habit gets one tap); then the work screens, then the company's own.

function Row({ item, locked, active, onOpen }: { item: NavItem; locked: boolean; active: boolean; onOpen: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onOpen}
      title={locked ? lockedHint(item) : undefined}
      aria-current={active ? "page" : undefined}
      className="hit-none group relative w-full min-h-[56px] flex items-center gap-3 px-4 text-left active:bg-surface-2 hover:bg-surface-2 transition-colors"
    >
      <span className={`h-9 w-9 shrink-0 rounded-xl grid place-items-center ${active ? "bg-brand-solid text-white" : "bg-surface-2 text-fg-2"}`}>
        <Icon className="w-[19px] h-[19px]" strokeWidth={1.9} aria-hidden />
      </span>
      <span className={`flex-1 min-w-0 truncate text-[16px] ${locked ? "text-fg-2" : "text-fg"}`}>{item.label}</span>
      {locked && <Lock data-testid={`locked-${item.key}`} aria-hidden="true" className="w-4 h-4 text-fg-3" strokeWidth={2.2} />}
      <ChevronRight className="w-4 h-4 text-fg-3 shrink-0" aria-hidden />
      {/* the line between rows starts under the label, as in a phone's own settings lists */}
      <span aria-hidden className="absolute bottom-0 left-16 right-0 h-px bg-fg/10 group-last:hidden" />
    </button>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      {title && <h3 className="px-4 mb-1.5 text-[12.5px] font-semibold text-fg-3 tracking-wide">{title}</h3>}
      <div className="rounded-2xl bg-surface-2/60 overflow-hidden">{children}</div>
    </section>
  );
}

export function MenuSheet({
  open,
  onClose,
  work,
  company,
  recent,
  isActive,
  isLocked,
  onNavigate,
  onSearch,
  account,
}: {
  open: boolean;
  onClose: () => void;
  work: NavItem[];
  company: NavItem[];
  /** the places visited last, most recent first */
  recent: NavItem[];
  isActive: (item: NavItem) => boolean;
  isLocked?: (item: NavItem) => boolean;
  onNavigate: (item: NavItem) => void;
  onSearch: () => void;
  /** the person at the top, opening their account */
  account?: { name: string; company?: string | null; onOpen: () => void };
}) {
  const go = (item: NavItem) => {
    onClose();
    onNavigate(item);
  };
  return (
    <SheetShell open={open} onClose={onClose} label="Menu" className="sm:max-w-md">
      {(drag) => (
        <>
          <div {...drag.handlers} className="shrink-0" style={{ touchAction: "none" }}>
            <div className="sm:hidden mx-auto pt-3 pb-1 grid place-items-center" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-fg/15" />
            </div>
            <h2 className="px-6 pt-3 sm:pt-7 pb-2 text-[22px] font-semibold text-fg">Menu</h2>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4 sm:px-6 pb-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSearch();
              }}
              className="w-full h-12 rounded-2xl bg-surface-2 flex items-center gap-3 px-4 text-[15.5px] text-fg-2 text-left"
            >
              <Search className="w-[18px] h-[18px]" aria-hidden />
              Search or jump to…
            </button>

            {recent.length > 0 && (
              <section className="mt-5" aria-label="Recent">
                <h3 className="px-1 mb-1.5 text-[12.5px] font-semibold text-fg-3 tracking-wide">Recent</h3>
                <div className="chip-row -mx-4 px-4">
                  {recent.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.key} type="button" onClick={() => go(item)} className="press h-11 shrink-0 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 text-[14.5px] font-medium text-fg">
                        <Icon className="w-[17px] h-[17px] text-fg-2" aria-hidden />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {work.length > 0 && (
              <Group title="Work">
                {work.map((item) => (
                  <Row key={item.key} item={item} locked={Boolean(isLocked?.(item))} active={isActive(item)} onOpen={() => go(item)} />
                ))}
              </Group>
            )}
            {company.length > 0 && (
              <Group title="Company">
                {company.map((item) => (
                  <Row key={item.key} item={item} locked={Boolean(isLocked?.(item))} active={isActive(item)} onOpen={() => go(item)} />
                ))}
              </Group>
            )}

            {account && (
              <Group>
                <button type="button" onClick={account.onOpen} className="hit-none w-full min-h-[64px] flex items-center gap-3 px-4 text-left active:bg-surface-2 hover:bg-surface-2 transition-colors">
                  <Avatar name={account.name} className="h-10 w-10 shrink-0 rounded-full" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[16px] text-fg font-medium">{account.name}</span>
                    {account.company && <span className="block truncate text-[13px] text-fg-2">{account.company}</span>}
                  </span>
                  <span className="text-[13.5px] text-fg-2">Account</span>
                  <ChevronRight className="w-4 h-4 text-fg-3 shrink-0" aria-hidden />
                </button>
              </Group>
            )}
          </div>
        </>
      )}
    </SheetShell>
  );
}

/** The account sheet: whatever the app puts in it (who is signed in, the workspace, the look, sign out) */
export function AccountSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <SheetShell open={open} onClose={onClose} label="Account" className="sm:max-w-md">
      {(drag) => (
        <>
          <div {...drag.handlers} className="shrink-0" style={{ touchAction: "none" }}>
            <div className="sm:hidden mx-auto pt-3 pb-1 grid place-items-center" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-fg/15" />
            </div>
            <h2 className="px-6 pt-3 sm:pt-7 pb-2 text-[22px] font-semibold text-fg">Account</h2>
          </div>
          <div className="overflow-y-auto overscroll-contain px-6 pb-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
            {children}
          </div>
        </>
      )}
    </SheetShell>
  );
}
