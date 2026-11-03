import { useRef, type MouseEvent, type PointerEvent } from "react";
import { haptic } from "../utils/haptics";

// Hold a finger on something to open its menu. Moving the finger (to scroll or swipe) cancels it. On Android the browser's own
// "context menu" gesture and the keyboard's menu key do the same, so there is a way in without a touch screen too.
export function useLongPress(onLongPress: () => void, { ms = 450, tolerance = 9, enabled = true }: { ms?: number; tolerance?: number; enabled?: boolean } = {}) {
  const timer = useRef<number | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const stop = () => {
    window.clearTimeout(timer.current);
    origin.current = null;
  };
  const fire = () => {
    fired.current = true;
    haptic.open();
    onLongPress();
  };
  return {
    onPointerDown: (e: PointerEvent) => {
      if (!enabled || e.pointerType === "mouse") return;
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(fire, ms);
    },
    onPointerMove: (e: PointerEvent) => {
      const o = origin.current;
      if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > tolerance) stop();
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onContextMenu: (e: MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
      if (!fired.current) fire();
    },
    // the tap that ends a long-press is not a tap
    onClickCapture: (e: MouseEvent) => {
      if (fired.current) {
        e.preventDefault();
        e.stopPropagation();
        fired.current = false;
      }
    },
  };
}
