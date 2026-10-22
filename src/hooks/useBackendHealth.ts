import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/api";

export type EngineState = "unknown" | "ok" | "down";

// Polls the public health endpoint so the shell can show a quiet "all good / reconnecting" dot.
export function useBackendHealth(intervalMs = 20000): EngineState {
  const [state, setState] = useState<EngineState>("unknown");
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const data = await checkBackendHealth();
      if (alive) setState(data?.status === "ok" ? "ok" : "down");
    };
    void poll();
    const t = setInterval(poll, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [intervalMs]);
  return state;
}
