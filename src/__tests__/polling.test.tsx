import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  idleFactor,
  noteResponse,
  pollInterval,
  released,
  resetPolling,
  serverStress,
  setJitter,
  setStageDelays,
  startInputTracking,
  useStage,
} from "../services/polling";
import { apiRequest } from "../services/api";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-14T10:00:00Z"));
  resetPolling();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  setStageDelays([0, 0, 0]);
  setJitter(0);
  resetPolling();
});

describe("how often the app asks the server in the background", () => {
  it("asks at the stated pace while all is well, and never more often than every 15 seconds", () => {
    expect(pollInterval(60_000)).toBe(60_000);
    expect(pollInterval(30_000)).toBe(30_000);
    expect(pollInterval(1_000)).toBe(15_000);
  });

  it("asks less when nobody has touched the page for a while, and goes back at the first touch", () => {
    const stop = startInputTracking();
    expect(idleFactor()).toBe(1);
    vi.advanceTimersByTime(4 * 60_000);
    expect(pollInterval(60_000)).toBe(60_000);
    vi.advanceTimersByTime(2 * 60_000); // six quiet minutes
    expect(idleFactor()).toBe(3);
    expect(pollInterval(60_000)).toBe(180_000);
    vi.advanceTimersByTime(10 * 60_000); // sixteen
    expect(idleFactor()).toBe(6);
    expect(pollInterval(60_000)).toBe(360_000);

    window.dispatchEvent(new Event("pointerdown")); // a person is back
    expect(idleFactor()).toBe(1);
    expect(pollInterval(60_000)).toBe(60_000);
    stop();
    expect(idleFactor()).toBe(1);
  });

  it("a stream of scroll events counts as one touch, and keys, taps and the wheel count too", () => {
    startInputTracking();
    for (const type of ["keydown", "touchstart", "wheel", "scroll"]) {
      vi.advanceTimersByTime(6 * 60_000);
      expect(idleFactor()).toBe(3);
      window.dispatchEvent(new Event(type));
      expect(idleFactor(), type).toBe(1);
    }
  });

  it("asks much LESS often while the server is slow or failing, never more", () => {
    noteResponse(500, true);
    expect(serverStress()).toBe(0);
    for (let i = 0; i < 6; i++) noteResponse(4_000, true); // answers take about four seconds
    expect(serverStress()).toBe(1);
    expect(pollInterval(60_000)).toBe(120_000);
    for (let i = 0; i < 8; i++) noteResponse(9_000, true); // about nine
    expect(serverStress()).toBe(2);
    expect(pollInterval(60_000)).toBe(240_000);
    for (let i = 0; i < 12; i++) noteResponse(300, true); // and then it is well again
    expect(serverStress()).toBe(0);
    expect(pollInterval(60_000)).toBe(60_000);
  });

  it("failures count even when they are quick (an error page, no answer at all), and one good answer ends the run", () => {
    noteResponse(200, false);
    expect(serverStress()).toBe(0);
    noteResponse(200, false);
    expect(serverStress()).toBe(1);
    noteResponse(200, false);
    noteResponse(200, false);
    expect(serverStress()).toBe(2);
    noteResponse(200, true);
    expect(serverStress()).toBe(0);
  });

  it("an old reading says nothing about now: three quiet minutes and the server is taken as well again", () => {
    for (let i = 0; i < 8; i++) noteResponse(9_000, false);
    expect(serverStress()).toBe(2);
    vi.advanceTimersByTime(3 * 60_000 + 1);
    expect(serverStress()).toBe(0);
  });

  it("combines being away and a struggling server", () => {
    startInputTracking();
    vi.advanceTimersByTime(6 * 60_000);
    for (let i = 0; i < 8; i++) noteResponse(9_000, true);
    expect(pollInterval(60_000)).toBe(60_000 * 3 * 4);
  });
});

describe("tabs drift apart, but one tab keeps its rhythm", () => {
  it("a tab gets the same number every time while nothing changes, within a tenth of the pace", () => {
    setJitter(0.1);
    const first = pollInterval(60_000);
    expect(first).toBeGreaterThanOrEqual(54_000);
    expect(first).toBeLessThanOrEqual(66_000);
    for (let i = 0; i < 50; i++) expect(pollInterval(60_000)).toBe(first);
  });

  it("different tabs get different numbers (so that they do not all ask in the same second)", () => {
    setJitter(0.1);
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) {
      resetPolling(); // a new tab
      seen.add(pollInterval(60_000));
    }
    expect(seen.size).toBeGreaterThan(5);
  });

  // TanStack Query restarts its countdown whenever the number it is given changes. A random number at every call would restart the clock
  // at each drawing of the screen, and a screen that is drawn every few seconds would never ask at all.
  it("asks on time even when the screen is drawn again every few seconds", async () => {
    setJitter(0.1);
    const fetcher = vi.fn(async () => "data");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { rerender } = renderHook(
      ({ n }: { n: number }) => {
        void n;
        return useQuery({ queryKey: ["poll"], queryFn: fetcher, refetchInterval: () => pollInterval(60_000) });
      },
      { wrapper, initialProps: { n: 0 } },
    );
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(fetcher).toHaveBeenCalledTimes(1);
    for (let i = 1; i <= 28; i++) {
      // 140 seconds, drawn again every 5
      await act(async () => void (await vi.advanceTimersByTimeAsync(5000)));
      rerender({ n: i });
    }
    expect(fetcher).toHaveBeenCalledTimes(3); // at about 60 s and 120 s
  });
});

describe("what the app's own requests tell about the server", () => {
  const answer = (status: number, ms = 0) =>
    vi.fn(async () => {
      if (ms) await new Promise((r) => setTimeout(r, ms));
      return new Response(JSON.stringify({ status: "success" }), { status, headers: { "content-type": "application/json" } });
    });

  it("a run of failed reads makes it struggling; a good one ends that", async () => {
    vi.stubGlobal("fetch", answer(503));
    for (let i = 0; i < 4; i++) await apiRequest("/api/sessions").catch(() => {});
    expect(serverStress()).toBe(2);
    vi.stubGlobal("fetch", answer(200));
    await apiRequest("/api/sessions");
    expect(serverStress()).toBe(0);
  });

  it("a refusal (a 4xx) is an answer: the server is well", async () => {
    vi.stubGlobal("fetch", answer(403));
    for (let i = 0; i < 5; i++) await apiRequest("/api/x").catch(() => {});
    expect(serverStress()).toBe(0);
  });

  it("no answer at all counts as a failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    for (let i = 0; i < 2; i++) await apiRequest("/api/x").catch(() => {});
    expect(serverStress()).toBe(1);
  });

  it("only plain reads are measured: not writes, not an AI answer, a file or a history sync (slow by nature)", async () => {
    vi.stubGlobal("fetch", answer(500));
    for (const [path, init] of [
      ["/api/leads", { method: "POST", body: "{}" }],
      ["/api/ai/suggest", {}],
      ["/api/attachments/x", {}],
      ["/api/export/all", {}],
      ["/api/conversations/c1/messages?sync=true", {}],
    ] as const)
      for (let i = 0; i < 5; i++) await apiRequest(path, init as RequestInit).catch(() => {});
    expect(serverStress()).toBe(0);
    await apiRequest("/api/conversations/c1/messages").catch(() => {});
    await apiRequest("/api/conversations/c1/messages").catch(() => {});
    expect(serverStress()).toBe(1);
  });
});

describe("a gentler sign-in", () => {
  it("releases its steps one after another: 0 at first, then 1, 2, 3", () => {
    setStageDelays([1200, 3000, 6000]);
    const { result } = renderHook(() => useStage(true));
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(1199));
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(2));
    expect(result.current).toBe(1);
    act(() => void vi.advanceTimersByTime(1800));
    expect(result.current).toBe(2);
    act(() => void vi.advanceTimersByTime(3000));
    expect(result.current).toBe(3);
  });

  it("does not start counting before the person is signed in, and starts over after signing out", () => {
    setStageDelays([1000, 2000, 3000]);
    const { result, rerender } = renderHook(({ on }) => useStage(on), { initialProps: { on: false } });
    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current).toBe(0);
    rerender({ on: true });
    act(() => void vi.advanceTimersByTime(3000));
    expect(result.current).toBe(3);
    rerender({ on: false });
    expect(result.current).toBe(0);
    rerender({ on: true });
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1);
  });

  it("tests (and delays of 0) release everything at once, with no wait", () => {
    setStageDelays([0, 0, 0]);
    const { result } = renderHook(() => useStage(true));
    expect(result.current).toBe(3);
  });

  it("on the Today screen a request waits for its step; anywhere else nothing is held back", () => {
    expect(released(1, 0, true)).toBe(false);
    expect(released(1, 1, true)).toBe(true);
    expect(released(3, 2, true)).toBe(false);
    expect(released(3, 3, true)).toBe(true);
    expect(released(3, 0, false)).toBe(true); // the person went to Contacts: load it now
  });
});
