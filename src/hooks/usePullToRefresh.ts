import { useEffect, useRef, useState, type RefObject } from "react";
import { haptic } from "../utils/haptics";

// Pull a list down from its top to refresh it. Works on the scroller you give it; shows how far it has been pulled. The page's own
// overscroll is held back while pulling, so it never reloads the app.
export const PULL_TO_REFRESH = { trigger: 64, max: 96, rest: 56, resistance: 0.5 };

export function usePullToRefresh(ref: RefObject<HTMLElement | null>, onRefresh: () => Promise<unknown> | void, enabled = true) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let startY = 0;
    let active = false;
    let distance = 0;
    const start = (e: TouchEvent) => {
      if (busy.current || el.scrollTop > 0 || e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      active = true;
      distance = 0;
    };
    const move = (e: TouchEvent) => {
      if (!active) return;
      const dy = e.touches[0].clientY - startY;
      if (el.scrollTop > 0 || dy <= 0) {
        if (distance) setPull(0);
        distance = 0;
        if (el.scrollTop > 0) active = false;
        return;
      }
      if (e.cancelable) e.preventDefault();
      distance = Math.min(dy * PULL_TO_REFRESH.resistance, PULL_TO_REFRESH.max);
      setPull(distance);
    };
    const end = async () => {
      if (!active) return;
      active = false;
      if (distance >= PULL_TO_REFRESH.trigger) {
        busy.current = true;
        setRefreshing(true);
        setPull(PULL_TO_REFRESH.rest);
        haptic.tick();
        try {
          await refresh.current();
        } finally {
          busy.current = false;
          setRefreshing(false);
          setPull(0);
        }
      } else setPull(0);
      distance = 0;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [ref, enabled]);

  return { pull, refreshing };
}
