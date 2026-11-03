import { useSyncExternalStore } from "react";

// What kind of screen this is. With no window or no matchMedia (a server, a test) it is a desktop, so every phone variant is opt-in.
const subscribers = new Map<string, (cb: () => void) => () => void>();
function subscribeTo(query: string) {
  let sub = subscribers.get(query);
  if (!sub) {
    sub = (cb) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const m = window.matchMedia(query);
      if (typeof m.addEventListener === "function") {
        m.addEventListener("change", cb);
        return () => m.removeEventListener("change", cb);
      }
      m.addListener?.(cb);
      return () => m.removeListener?.(cb);
    };
    subscribers.set(query, sub);
  }
  return sub;
}

export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? Boolean(window.matchMedia(query)?.matches) : fallback),
    () => fallback,
  );
}

/** Below the width where the desktop layout (dock on the left, two panes) takes over: phones and tablets in portrait */
export const PHONE_QUERY = "(max-width: 1023px)";
/** Sheets are bottom sheets below this width and centred dialogs above it */
export const SHEET_QUERY = "(max-width: 639px)";
export const useIsPhone = () => useMediaQuery(PHONE_QUERY);
export const useIsSheet = () => useMediaQuery(SHEET_QUERY);
/** A finger, not a mouse */
export const useIsTouch = () => useMediaQuery("(pointer: coarse)");
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
