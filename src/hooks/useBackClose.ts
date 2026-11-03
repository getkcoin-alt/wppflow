import { useEffect, useRef } from "react";

// The Back button (Android), the edge swipe (iOS) and the browser's own Back should close the top thing, a sheet or an open chat,
// and not leave the app. Each open overlay adds one history entry; going back removes the newest overlay; closing an overlay any
// other way (its X, a drag, a tap outside) removes its entry so Back does not later do nothing. Overlays stack: a sheet over a chat
// closes first.
//
// history.back() is not instant. When one overlay hands over to another (an action sheet that opens a form) the new entry is pushed
// only after the old one has gone, so the two never cross.

interface Entry {
  id: number;
  close: () => void;
  /** the browser already moved back for this one */
  popped: boolean;
  /** its history entry exists */
  pushed: boolean;
}
const stack: Entry[] = [];
const waiting: Entry[] = [];
let sequence = 0;
let backs = 0; // history.back() calls we made that have not been answered yet
let listening = false;

function push(entry: Entry) {
  entry.pushed = true;
  window.history.pushState({ ...(window.history.state || {}), scriwoOverlay: entry.id }, "");
}

function onPop() {
  if (backs > 0) {
    backs -= 1; // our own history.back(), made to remove an entry
    if (backs === 0) waiting.splice(0).forEach(push);
    return;
  }
  const top = stack.pop();
  if (top) {
    top.popped = true;
    top.close();
  }
}

export function useBackClose(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.history) return;
    if (!listening) {
      window.addEventListener("popstate", onPop);
      listening = true;
    }
    const entry: Entry = { id: ++sequence, close: () => close.current(), popped: false, pushed: false };
    stack.push(entry);
    if (backs > 0) waiting.push(entry);
    else push(entry);
    return () => {
      if (entry.popped) return;
      const at = stack.indexOf(entry);
      if (at >= 0) stack.splice(at, 1);
      const queued = waiting.indexOf(entry);
      if (queued >= 0) waiting.splice(queued, 1);
      // closed some other way: take our entry out of the history, if it is still the one on top
      if (entry.pushed && window.history.state?.scriwoOverlay === entry.id) {
        backs += 1;
        window.history.back();
      }
    };
  }, [open]);
}

/** For tests: forget every open overlay */
export const resetBackStack = () => {
  stack.length = 0;
  waiting.length = 0;
  backs = 0;
};
