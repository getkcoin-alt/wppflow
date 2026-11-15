import { useEffect, useState } from "react";

// How often the app asks the server for fresh data in the background, and when it holds back.
//
// Every open tab used to ask for about a dozen things a minute (the Today screen alone: home, summary, sessions, autopilot, health ...), and
// each one costs the server work. Five people with a tab open each is a request a second, which a small server cannot answer, so
// everything else, a person's click included, queues behind it. The live updates (the socket) already push what changes; these timers
// are only the safety net behind them. So:
//  - a person who has not touched the page for a while is asked for less (and a hidden tab not at all: TanStack Query's own rule),
//  - a server that is slow or failing is asked LESS often, never more: the answer to a struggling server is not more requests,
//  - tabs drift apart a little (jitter) instead of all asking in the same second,
//  - at sign-in, what the first screen does not need waits a few seconds (useStage), instead of fifteen requests arriving at once.
// See docs/polling.md.

const FLOOR_MS = 15_000;

// Tabs drift apart a little so that they do not all ask in the same second: each tab has ONE fixed spread, rolled once. It must not be
// rolled again at every call: TanStack Query restarts its countdown whenever the number it gets from `refetchInterval` changes, and
// the screen is drawn again many times a minute, so a number that was different every time would restart the clock at each drawing and the
// request might never be made at all.
let jitterAmount = import.meta.env.MODE === "test" ? 0 : 0.1;
const roll = () => 1 + (Math.random() * 2 - 1) * jitterAmount;
let tabSpread = roll();
/** for tests */
export const setJitter = (amount: number): void => {
  jitterAmount = amount;
  tabSpread = roll();
};

// ── a person is here, or not ─────────────────────────────────────────────────────────────────────
let lastInput: number | null = null; // null: nobody is watching for it (a test, a hook on its own): never idle

/** Starts noticing a person's input (mouse, keys, touch, scroll). Returns the function that stops it. */
export function startInputTracking(): () => void {
  lastInput = Date.now();
  let last = 0;
  const touch = () => {
    const now = Date.now();
    if (now - last < 1000) return; // a stream of scroll events is one touch
    last = now;
    lastInput = now;
  };
  const events = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
  for (const e of events) window.addEventListener(e, touch, { passive: true, capture: true });
  return () => {
    for (const e of events) window.removeEventListener(e, touch, { capture: true });
    lastInput = null;
  };
}

/** 1 while a person is at the page, 3 after five quiet minutes, 6 after fifteen */
export function idleFactor(): 1 | 3 | 6 {
  if (lastInput === null) return 1;
  const quiet = Date.now() - lastInput;
  return quiet > 15 * 60_000 ? 6 : quiet > 5 * 60_000 ? 3 : 1;
}

// ── the server is well, or not ───────────────────────────────────────────────────────────────────
let averageMs = 0; // how long the server's recent answers took (a moving average)
let failuresInARow = 0;
let lastAnswerAt = 0;

/** Fed by every request the app makes (services/api.ts): how long it took, and whether the server answered properly (not a 5xx, not nothing). */
export function noteResponse(ms: number, ok: boolean): void {
  averageMs = averageMs === 0 ? ms : averageMs * 0.7 + ms * 0.3;
  failuresInARow = ok ? 0 : failuresInARow + 1;
  lastAnswerAt = Date.now();
}

/** 0 well, 1 slow or failing a little, 2 struggling */
export function serverStress(): 0 | 1 | 2 {
  if (Date.now() - lastAnswerAt > 3 * 60_000) return 0; // an old reading says nothing about now
  if (averageMs > 6000 || failuresInARow >= 4) return 2;
  if (averageMs > 3000 || failuresInARow >= 2) return 1;
  return 0;
}

/** for tests */
export function resetPolling(): void {
  averageMs = 0;
  failuresInARow = 0;
  lastAnswerAt = 0;
  lastInput = null;
  tabSpread = roll();
}

/**
 * How long to wait before asking again: `baseMs` while all is well and a person is here; longer when they have been away, much longer
 * while the server is struggling; never under 15 s; a little different in every tab, but the same every time in one tab while nothing
 * changes (see `tabSpread`). Use as `refetchInterval: () => pollInterval(60_000)`.
 */
export function pollInterval(baseMs: number): number {
  const stress = serverStress();
  const slowed = baseMs * idleFactor() * (stress === 2 ? 4 : stress === 1 ? 2 : 1);
  return Math.round(Math.max(FLOOR_MS, slowed * tabSpread));
}

// ── a gentler sign-in ────────────────────────────────────────────────────────────────────────────
// How long after the screen appears each step is released: first the lists the inbox needs, then the rest. Tests release everything at once.
let stageDelays: number[] = import.meta.env.MODE === "test" ? [0, 0, 0] : [1200, 3000, 6000];
/** for tests */
export const setStageDelays = (delays: number[]): void => {
  stageDelays = delays;
};
const startStage = (delays: number[]) => delays.filter((d) => d <= 0).length;

/** How many steps have been released (0 to 3): 0 at first, 1 after 1.2 s, 2 after 3 s, 3 after 6 s. Starts over when `active` turns off (signing out). */
export function useStage(active = true): number {
  const delays = stageDelays;
  const [stage, setStage] = useState(() => startStage(delays));
  const [wasActive, setWasActive] = useState(active);
  // signing out starts the steps over (state adjusted while drawing, as React advises, not in an effect)
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setStage(startStage(delays));
  }
  useEffect(() => {
    if (!active) return;
    const timers = delays.map((d, i) => (d > 0 ? setTimeout(() => setStage((s) => Math.max(s, i + 1)), d) : undefined));
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [active, delays]);
  return stage;
}

/**
 * Whether a request that belongs to step `step` may start. On the Today screen it waits for its step; the moment a person goes anywhere
 * else nothing is held back (they may need it now).
 */
export const released = (step: number, stage: number, onToday: boolean): boolean => stage >= step || !onToday;
