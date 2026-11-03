import { useEffect } from "react";

// On iOS the keyboard shrinks the visual viewport but not the layout viewport, so a full-height app is left with its bottom hidden
// behind the keyboard. This keeps `--vvh` equal to the height that is really visible; `.h-app` uses it. Android (which resizes the
// layout itself, see the viewport meta) and desktops simply see the same number as 100dvh.
export function useViewportHeight(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    if (!vv) return;
    const apply = () => {
      root.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      // iOS scrolls the page itself to bring a focused field into view; the app does its own scrolling
      if (vv.offsetTop > 0 && window.scrollY > 0) window.scrollTo(0, 0);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      root.style.removeProperty("--vvh");
    };
  }, [enabled]);
}
