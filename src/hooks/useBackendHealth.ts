import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/api";
import { pollInterval } from "../services/polling";

export type EngineState = "unknown" | "ok" | "down";

// Polls the public health endpoint so the shell can show a quiet "all good / reconnecting" dot. Once a minute while all is well (and
// less when nobody is at the page, or the server is struggling), every 15 s while it is down so the dot recovers soon, and not at all
// while the tab is hidden (it looks again the moment the tab is shown).
export function useBackendHealth(intervalMs = 60000): EngineState {
  const [state, setState] = useState<EngineState>("unknown");
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (next: EngineState) => {
      timer = setTimeout(() => {
        if (document.visibilityState === "hidden") return schedule(next);
        void poll();
      }, next === "down" ? 15000 : pollInterval(intervalMs));
    };
    const poll = async () => {
      const data = await checkBackendHealth();
      if (!alive) return;
      const next: EngineState = data?.status === "ok" ? "ok" : "down";
      setState(next);
      schedule(next);
    };
    const onShow = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void poll();
    };
    void poll();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [intervalMs]);
  return state;
}
