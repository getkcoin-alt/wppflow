import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { haptic } from "../../utils/haptics";
import { usePrefersReducedMotion } from "../../hooks/useMedia";

export interface SwipeAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  tone?: "ok" | "info" | "warn" | "danger" | "neutral" | "brand";
  onTrigger: () => void;
}

const TONE: Record<NonNullable<SwipeAction["tone"]>, string> = {
  ok: "bg-ok text-white",
  info: "bg-info text-white",
  warn: "bg-warn text-white",
  danger: "bg-danger text-white",
  neutral: "bg-fg-3 text-white",
  brand: "bg-brand-solid text-white",
};

export const SWIPE = {
  /** how far a finger moves before we decide whether it is a swipe or a scroll */
  slop: 8,
  /** the width of one revealed action */
  actionWidth: 76,
  /** past this share of the revealed width, letting go keeps the actions open */
  openShare: 0.4,
  /** a flick this fast (px per ms) opens them even from a short pull */
  flick: 0.45,
};

// Only one row is open at a time: opening another closes the one that was.
let openRow: { id: number; close: () => void } | null = null;
let nextId = 1;

/** The distance at which a pull goes all the way and does the first action: half the row, and always further than the trays. */
export const fullSwipeAt = (rowWidth: number, reveal: number) => Math.max(reveal * 1.6, rowWidth * 0.5);

/** How far the row follows the finger: all the way up to the tray, then a little heavier, never beyond the row. */
export function followFinger(raw: number, reveal: number, rowWidth: number) {
  const a = Math.abs(raw);
  const max = Math.max(reveal, 0);
  const drag = a <= max ? a : max + (a - max) * 0.85;
  return Math.sign(raw) * Math.min(drag, rowWidth * 0.92);
}

/** What letting go does, given how far the finger went (not how far the row followed): close, stay open on the tray, or run the first action. */
export function settle(travel: number, velocity: number, reveal: number, rowWidth: number): "close" | "open" | "full" {
  const a = Math.abs(travel);
  if (reveal <= 0) return "close";
  if (a >= fullSwipeAt(rowWidth, reveal)) return "full";
  const flicking = Math.abs(velocity) >= SWIPE.flick && a > 24 && Math.sign(velocity) === Math.sign(travel);
  return a >= reveal * SWIPE.openShare || flicking ? "open" : "close";
}

/**
 * A list row that slides sideways to show what can be done with it, the way a phone's mail and messages lists do: pull a
 * little to see the actions and tap one, or pull all the way to do the first at once. Vertical movement is left to the page,
 * so scrolling never fights it. It only does anything for a finger or pen on a phone (`enabled`); elsewhere it is the row.
 */
export function Swipeable({
  children,
  leading = [],
  trailing = [],
  enabled = true,
  className = "",
  background = "bg-app",
  onOpenChange,
}: {
  children: ReactNode;
  /** shown when the row is pulled to the right */
  leading?: SwipeAction[];
  /** shown when the row is pulled to the left */
  trailing?: SwipeAction[];
  enabled?: boolean;
  className?: string;
  /** the row's own background, which must match the list it sits in so the trays are what is revealed, nothing else */
  background?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  if (!enabled || (!leading.length && !trailing.length)) return <div className={className}>{children}</div>;
  return (
    <SwipeRow leading={leading} trailing={trailing} className={className} background={background} onOpenChange={onOpenChange}>
      {children}
    </SwipeRow>
  );
}

function SwipeRow({ children, leading, trailing, className, background, onOpenChange }: { children: ReactNode; leading: SwipeAction[]; trailing: SwipeAction[]; className: string; background: string; onOpenChange?: (open: boolean) => void }) {
  const reduced = usePrefersReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const id = useRef(nextId++);
  const gesture = useRef<{ x: number; y: number; lastX: number; lastT: number; v: number; pointer: number; locked: "h" | "v" | null; base: number; raw: number } | null>(null);
  const crossed = useRef({ open: false, full: false });
  const moved = useRef(false);
  const onOpen = useRef(onOpenChange);
  onOpen.current = onOpenChange;

  const widthOf = (n: number) => n * SWIPE.actionWidth;
  const side = (o: number) => (o > 0 ? leading : trailing);
  const rest = offset === 0;

  const close = () => {
    setOffset(0);
    if (openRow?.id === id.current) openRow = null;
    onOpen.current?.(false);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  // tapping or touching anywhere else puts an open row away
  useEffect(() => {
    if (offset === 0) return;
    const away = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) closeRef.current();
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [offset === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (openRow?.id === id.current) openRow = null;
    },
    [],
  );

  const rowWidth = () => box.current?.offsetWidth || 360;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    if (gesture.current) return;
    gesture.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastT: e.timeStamp, v: 0, pointer: e.pointerId, locked: null, base: offset, raw: offset };
    crossed.current = { open: false, full: false };
    moved.current = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.locked) {
      if (Math.abs(dx) < SWIPE.slop && Math.abs(dy) < SWIPE.slop) return;
      g.locked = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
      if (g.locked === "v") {
        gesture.current = null;
        return;
      }
      if (openRow && openRow.id !== id.current) openRow.close();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragging(true);
    }
    moved.current = true;
    // the event's own time (when the finger moved), so a busy page does not turn a flick into a slow drag
    g.v = (e.clientX - g.lastX) / Math.max(1, e.timeStamp - g.lastT);
    g.lastX = e.clientX;
    g.lastT = e.timeStamp;

    const raw = g.base + dx;
    g.raw = raw;
    const trays = raw > 0 ? leading : trailing;
    if (!trays.length) {
      setOffset(0);
      return;
    }
    const reveal = widthOf(trays.length);
    const w = rowWidth();
    setOffset(followFinger(raw, reveal, w));
    const a = Math.abs(raw);
    if (!crossed.current.open && a >= reveal * SWIPE.openShare) {
      crossed.current.open = true;
      haptic.tick();
    } else if (crossed.current.open && a < reveal * SWIPE.openShare * 0.9) crossed.current.open = false;
    const full = a >= fullSwipeAt(w, reveal);
    if (full && !crossed.current.full) {
      crossed.current.full = true;
      haptic.open();
    } else if (!full && crossed.current.full) crossed.current.full = false;
  };

  const finish = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (g.locked !== "h") return;
    // the click some browsers send when the finger lifts after a drag is swallowed; a later, real tap is not
    window.setTimeout(() => {
      moved.current = false;
    }, 80);
    const trays = side(g.raw);
    const reveal = widthOf(trays.length);
    const action = cancelled ? "close" : settle(g.raw, g.v, reveal, rowWidth());
    if (action === "full") {
      const first = trays[0];
      close();
      if (first) {
        haptic.success();
        first.onTrigger();
      }
    } else if (action === "open") {
      setOffset((g.raw > 0 ? 1 : -1) * reveal);
      openRow = { id: id.current, close: () => closeRef.current() };
      onOpen.current?.(true);
    } else close();
  };

  // a drag that ends on the row is not a tap on what it holds; and a tap on an open row only puts it away
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
      return;
    }
    if (offset !== 0) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  const trayFor = (list: SwipeAction[], from: "left" | "right") => {
    const visible = (from === "left" ? offset > 0 : offset < 0) && list.length > 0;
    const style: CSSProperties = { width: Math.abs(offset), [from]: 0 };
    return (
      <div className={`absolute inset-y-0 flex overflow-hidden ${visible ? "" : "invisible"}`} style={style} aria-hidden={!visible}>
        {list.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              tabIndex={visible ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                close();
                haptic.success();
                a.onTrigger();
              }}
              className={`hit-none flex-1 min-w-0 flex flex-col items-center justify-center gap-1 text-[12px] font-semibold ${TONE[a.tone || "neutral"]}`}
            >
              {Icon && <Icon className="w-5 h-5" aria-hidden />}
              <span className="truncate max-w-full px-1">{a.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={box} className={`relative overflow-hidden ${className}`}>
      {trayFor(leading, "left")}
      {trayFor(trailing, "right")}
      <div
        className={`relative ${background}`}
        style={{
          transform: rest ? undefined : `translateX(${offset}px)`,
          transition: dragging || reduced ? "none" : "transform 0.22s cubic-bezier(0.2, 0, 0, 1)",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finish(e, false)}
        onPointerCancel={(e) => finish(e, true)}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
