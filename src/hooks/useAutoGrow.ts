import { useCallback, useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * Makes a text box as tall as what is written in it, up to `maxHeight` pixels, after which it scrolls. It is refitted when the text
 * changes and when the box becomes wider or narrower (a window resized, a side panel opened), because the lines wrap differently.
 * An empty box goes back to its one-row height, so a long placeholder cannot make it taller.
 */
export function useAutoGrow(ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>, value: string, maxHeight: number) {
  const fit = useCallback(
    (el: HTMLTextAreaElement | HTMLInputElement) => {
      if (!el.value) {
        el.style.height = "";
        return;
      }
      el.style.height = "auto";
      // measured only when it can be: a box inside a hidden screen measures 0 and would stay collapsed once it is shown
      const h = el.scrollHeight;
      el.style.height = h > 0 ? `${Math.min(h, maxHeight)}px` : "";
    },
    [maxHeight],
  );
  useLayoutEffect(() => {
    if (ref.current) fit(ref.current);
  }, [value, fit, ref]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = el.clientWidth;
    const watch = new ResizeObserver(() => {
      // only a change of width matters; setting the height here must not start another round
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit(el);
    });
    watch.observe(el);
    return () => watch.disconnect();
  }, [fit, ref]);
}
