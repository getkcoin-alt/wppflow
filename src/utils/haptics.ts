// A small physical tick for the moments that deserve one: a swipe reaching its action, a long-press opening a menu, a message sent.
// It uses the browser's vibration where there is one (Android) and does nothing elsewhere (iOS Safari has none), and never when the
// person asked their device for less motion.
const can = () => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  try {
    return !(typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch {
    return true;
  }
};
const buzz = (pattern: number | number[]) => {
  if (can()) navigator.vibrate(pattern);
};
export const haptic = {
  /** a light touch: a threshold was crossed */
  tick: () => buzz(8),
  /** something opened */
  open: () => buzz(14),
  /** it worked */
  success: () => buzz([10, 40, 12]),
  /** it could not be done */
  warn: () => buzz([18, 50, 18]),
};
