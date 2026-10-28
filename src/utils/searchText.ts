import { useEffect, useState } from "react";

/** Waits for typing to pause before asking the server. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

export const MIN_SEARCH_CHARS = 2;
