import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsSheet, usePrefersReducedMotion } from "../../hooks/useMedia";
import { useBackClose } from "../../hooks/useBackClose";
import { haptic } from "../../utils/haptics";

// While any sheet is open the page behind it does not scroll. A count, so two sheets stacked do not unlock it early.
let locks = 0;
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      locks -= 1;
      if (locks <= 0) {
        locks = 0;
        document.body.style.overflow = "";
      }
    };
  }, [active]);
}

// A press that began before a sheet opened (a long-press is what opens a menu) must not click what appears under the finger when it
// lifts: the browser sends that click to whatever is there by then, which would close the menu it just opened, or pick its first row.
let lastPress = 0;
let lastOpened = 0;
if (typeof document !== "undefined") document.addEventListener("pointerdown", () => (lastPress = performance.now()), true);
/** True for a click that belongs to a press which started before the newest sheet opened. Keyboard clicks (detail 0) are never stray. */
export const strayClick = (e: { detail: number }) => e.detail > 0 && lastPress < lastOpened;

export interface SheetDrag {
  /** put these on the part of the sheet the finger may pull: the grabber and the title */
  handlers: Record<string, unknown>;
  style: CSSProperties;
  /** how far the sheet has been pulled, 0 to 1, for fading the backdrop */
  progress: number;
}

// Pull a sheet down to put it away: it follows the finger, and goes if it was pulled far enough or flicked.
function useSheetDrag(enabled: boolean, onClose: () => void, reduced: boolean): SheetDrag {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  // times are the events' own (when the finger moved), not when the page got round to handling them: a busy page must not read a flick as a slow drag
  const start = useRef<{ y: number; t: number; id: number } | null>(null);
  const leaving = useRef(false);

  // A sheet stays mounted while it is shut, so what a drag left behind (pulled off the screen, "on its way out") must be cleared,
  // or the next time it opens it would sit below the screen and refuse to be touched.
  useEffect(() => {
    if (enabled) return;
    start.current = null;
    leaving.current = false;
    setDy(0);
    setDragging(false);
  }, [enabled]);

  const handlers = enabled
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
          if (leaving.current) return;
          if ((e.target as HTMLElement).closest?.("button,a,input,select,textarea")) return; // a tap on a control is a tap
          if (e.pointerType === "mouse" && e.button !== 0) return;
          start.current = { y: e.clientY, t: e.timeStamp, id: e.pointerId };
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setDragging(true);
        },
        onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
          const s = start.current;
          if (!s || s.id !== e.pointerId) return;
          setDy(Math.max(0, e.clientY - s.y));
        },
        onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
          const s = start.current;
          start.current = null;
          setDragging(false);
          if (!s) return;
          const dist = Math.max(0, e.clientY - s.y);
          const speed = dist / Math.max(1, e.timeStamp - s.t);
          if (dist > 110 || (speed > 0.6 && dist > 30)) {
            leaving.current = true;
            haptic.tick();
            setDy(typeof window !== "undefined" ? window.innerHeight : 800);
            window.setTimeout(onClose, reduced ? 0 : 170);
          } else setDy(0);
        },
        onPointerCancel: () => {
          start.current = null;
          setDragging(false);
          setDy(0);
        },
      }
    : {};
  return {
    handlers,
    style: enabled && dy > 0 ? { transform: `translateY(${dy}px)`, transition: dragging || reduced ? "none" : "transform 0.18s cubic-bezier(0.2, 0, 0, 1)" } : enabled ? { transition: "transform 0.18s cubic-bezier(0.2, 0, 0, 1)" } : {},
    progress: enabled ? Math.min(1, dy / 320) : 0,
  };
}

/**
 * The frame every dialog shares: a bottom sheet on a phone (pull it down to put it away, Back closes it, the page behind stays
 * still, it keeps clear of the keyboard and the home bar) and a centred dialog on a bigger screen.
 */
export function SheetShell({
  open,
  onClose,
  label,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  /** width and height classes for the dialog on bigger screens */
  className?: string;
  children: (drag: SheetDrag) => ReactNode;
}) {
  const isSheet = useIsSheet();
  const reduced = usePrefersReducedMotion();
  useBackClose(open && isSheet, onClose);
  useScrollLock(open && isSheet);
  useEffect(() => {
    if (open) lastOpened = performance.now();
  }, [open]);
  const drag = useSheetDrag(open && isSheet, onClose, reduced);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  // Portalled to <body>: an ancestor with a transform or backdrop filter would otherwise
  // become the containing block of this fixed overlay and clip it.
  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center sm:p-6">
      <button
        aria-label="Close"
        onClick={(e) => {
          if (!strayClick(e)) onClose();
        }}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade"
        style={drag.progress ? { opacity: 1 - drag.progress * 0.7 } : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full ${className} flex flex-col bg-surface rounded-t-[32px] sm:rounded-[32px] pop animate-rise`}
        style={{ maxHeight: isSheet ? "min(92dvh, calc(var(--vvh, 100dvh) - 12px))" : "92dvh", ...drag.style }}
      >
        {children(drag)}
      </div>
    </div>,
    document.body,
  );
}

// Forms and details open in a centred dialog on desktop and slide up as a sheet on phones.
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** a big dialog for screens with two columns */
  wide?: boolean;
}) {
  return (
    <SheetShell open={open} onClose={onClose} label={title} className={wide ? "sm:max-w-5xl" : "sm:max-w-lg"}>
      {(drag) => (
        <>
          <div {...drag.handlers} className="shrink-0" style={{ touchAction: "none" }}>
            <div className="sm:hidden mx-auto pt-3 pb-1 grid place-items-center" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-fg/15" />
            </div>
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-3 sm:pt-8 pb-2">
              <div className="min-w-0">
                <h2 className="text-[22px] font-semibold text-fg">{title}</h2>
                {subtitle && <p className="text-[14.5px] text-fg-2 mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-surface-2 text-fg-2 hover:text-fg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain px-6 sm:px-8 py-4" style={footer ? undefined : { paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            {children}
          </div>
          {footer && (
            <div className="px-6 sm:px-8 pt-3 pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}>
              {footer}
            </div>
          )}
        </>
      )}
    </SheetShell>
  );
}
