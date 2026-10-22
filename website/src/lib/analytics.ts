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
    const w = window as unknown as { clarity?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };
    w.clarity?.("event", name);
    w.gtag?.("event", name, data);
  } catch {}
}

// Visitor's choice about Google cookies (Analytics and Ads measurement). Stored only in their browser.
export const CONSENT_KEY = "scriwo_cookie_consent";
export type Consent = "granted" | "denied";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {}
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("consent", "update", {
      analytics_storage: choice,
      ad_storage: choice,
      ad_user_data: choice,
      ad_personalization: choice,
    });
  } catch {}
}

/** Attributes for a link that should count as a conversion click. */
export const trackAttrs = (name: EventName, data: Record<string, string> = {}) => ({
  "data-track": name,
  ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-track-${k}`, v])),
});
