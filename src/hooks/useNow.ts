import { useEffect, useState } from "react";

// The current time, moved on every so often, so "checked 2 minutes ago" stays true while a screen is open.
export function useNow(everyMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}
