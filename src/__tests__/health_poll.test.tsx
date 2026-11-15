import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const check = vi.fn();
vi.mock("../services/api", async (orig) => ({ ...(await orig<typeof import("../services/api")>()), checkBackendHealth: () => check() }));
import { useBackendHealth } from "../hooks/useBackendHealth";
import { resetPolling } from "../services/polling";

const visibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("the quiet 'all good / reconnecting' dot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetPolling();
    check.mockReset();
    visibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
    visibility("visible");
  });
  const calls = () => check.mock.calls.length;

  it("looks at once, then once a minute while all is well", async () => {
    check.mockResolvedValue({ status: "ok" });
    const { result } = renderHook(() => useBackendHealth());
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(result.current).toBe("ok");
    expect(calls()).toBe(1);
    await act(async () => void (await vi.advanceTimersByTimeAsync(59_000)));
    expect(calls()).toBe(1);
    await act(async () => void (await vi.advanceTimersByTimeAsync(2_000)));
    expect(calls()).toBe(2);
  });

  it("looks again within 15 seconds while the server is down, so the dot recovers soon", async () => {
    check.mockResolvedValueOnce(null).mockResolvedValue({ status: "ok" });
    const { result } = renderHook(() => useBackendHealth());
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(result.current).toBe("down");
    await act(async () => void (await vi.advanceTimersByTimeAsync(15_000)));
    expect(calls()).toBe(2);
    expect(result.current).toBe("ok");
  });

  it("does not look while the tab is hidden, and looks at once when it is shown", async () => {
    check.mockResolvedValue({ status: "ok" });
    renderHook(() => useBackendHealth());
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(calls()).toBe(1);
    visibility("hidden");
    await act(async () => void (await vi.advanceTimersByTimeAsync(5 * 60_000)));
    expect(calls()).toBe(1);
    visibility("visible");
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(calls()).toBe(2);
  });

  it("stops looking when the screen goes away", async () => {
    check.mockResolvedValue({ status: "ok" });
    const { unmount } = renderHook(() => useBackendHealth());
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    unmount();
    await act(async () => void (await vi.advanceTimersByTimeAsync(10 * 60_000)));
    expect(calls()).toBe(1);
  });
});
