import { useEffect, useRef, useState } from "react";

export type CopyState = "" | "copied" | "blocked";

/** Copies a text and says so for a moment. When the browser will not let a page use the clipboard the text can still be selected by hand. */
export function useCopy(text: string) {
  const [state, setState] = useState<CopyState>("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("blocked");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(""), 2600);
  };
  return { state, copy };
}
