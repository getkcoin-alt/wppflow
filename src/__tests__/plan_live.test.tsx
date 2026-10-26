import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

// A socket that remembers who is listening, so the test can send the events the server would.
const sock = vi.hoisted(() => {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    handlers,
    on: (e: string, fn: (p?: unknown) => void) => void (handlers.get(e) ?? handlers.set(e, new Set()).get(e)!).add(fn),
    off: (e: string, fn: (p?: unknown) => void) => void handlers.get(e)?.delete(fn),
    send: (e: string, p?: unknown) => handlers.get(e)?.forEach((fn) => fn(p)),
  };
});
vi.mock("../services/socket", () => ({ getSocket: () => sock }));
vi.mock("../services/api", async (original) => ({
  ...(await original<typeof import("../services/api")>()),
  fetchConversationChanges: vi.fn().mockResolvedValue({ hasMore: false, conversations: [], serverTime: new Date().toISOString() }),
}));
import { useInboxRealtime } from "../hooks/useInboxRealtime";

let qc: QueryClient;
let invalidated: string[][];
beforeEach(() => {
  sock.handlers.clear();
  qc = new QueryClient();
  invalidated = [];
  vi.spyOn(qc, "invalidateQueries").mockImplementation(((f: { queryKey: string[] }) => {
    invalidated.push(f.queryKey);
    return Promise.resolve();
  }) as never);
  renderHook(() => useInboxRealtime({ enabled: true, qc, tenant: "t1", selected: null }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const asked = (key: string) => invalidated.some((k) => k[0] === key && k[1] === "t1");

describe("a plan changed by the platform admin reaches an open browser", () => {
  it("looks at the company's plan again when the server says it changed, so a screen locks or unlocks without a refresh", () => {
    expect(asked("capabilities")).toBe(false);
    sock.send("plan:changed", { plan: "growth", added: [], removed: ["automations"] });
    expect(asked("capabilities")).toBe(true);
    expect(asked("billing")).toBe(true);
  });

  it("looks again after a reconnect, and when the tab comes back, in case the event was missed while away", () => {
    sock.send("connect");
    expect(asked("capabilities")).toBe(true);
    invalidated.length = 0;
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(asked("capabilities")).toBe(false);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(asked("capabilities")).toBe(true);
  });

  it("only the plan is looked at again for it: the chat lists are not reloaded", () => {
    invalidated.length = 0;
    sock.send("plan:changed", { plan: "growth", added: ["broadcasts"], removed: [] });
    expect(invalidated.map((k) => k[0]).sort()).toEqual(["billing", "capabilities"]);
  });
});
