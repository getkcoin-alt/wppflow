import { track as vercelTrack } from "@vercel/analytics";

// Conversion events, named the same everywhere so reports line up:
// demo_click, plan_choose, whatsapp_click, contact_submit.
export type EventName = "demo_click" | "plan_choose" | "whatsapp_click" | "contact_submit";
export type EventData = Record<string, string | number | boolean | null>;

export function track(name: EventName, data: EventData = {}) {
  try {
    vercelTrack(name, data);
  } catch {
    // Analytics must never break the page.
  }
  try {
    const w = window as unknown as { clarity?: (...args: unknown[]) => void };
    w.clarity?.("event", name);
  } catch {}
}

/** Attributes for a link that should count as a conversion click. */
export const trackAttrs = (name: EventName, data: Record<string, string> = {}) => ({
  "data-track": name,
  ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-track-${k}`, v])),
});
