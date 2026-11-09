import type { OtpOverview } from "../services/api";

/** What GET /api/otp-setup answers for a company that has just opened Free OTP. */
export const overview = (over: Partial<OtpOverview> = {}): OtpOverview => ({
  available: true,
  settings: { enabled: true, template: "login", brand: "", brandResolved: "Acme Stores", locale: "en", codeLength: 6, ttlSeconds: 300, maxAttempts: 5, resendSeconds: 30, sessionName: null, suspended: false },
  templates: [
    { key: "login", title: "Sign in", blurb: "Let people log in with a code instead of a password.", defaults: { codeLength: 6, ttlSeconds: 300, maxAttempts: 5, resendSeconds: 30 } },
    { key: "signup", title: "Sign up", blurb: "Check a new account's phone number before it is created.", defaults: { codeLength: 6, ttlSeconds: 600, maxAttempts: 5, resendSeconds: 30 } },
    { key: "delivery", title: "Delivery", blurb: "The code a customer gives the courier when the order arrives.", defaults: { codeLength: 4, ttlSeconds: 3600, maxAttempts: 5, resendSeconds: 60 } },
  ],
  locales: [
    { key: "en", name: "English" },
    { key: "hi", name: "हिन्दी" },
    { key: "ar", name: "العربية" },
  ],
  numbers: [],
  keys: [],
  usage: { today: { used: 0, limit: 100, resets: "2026-11-09T00:00:00.000Z" }, month: { used: 0, limit: 1000, resets: "2026-12-01T00:00:00.000Z" } },
  stats: { days: 7, sent: 0, delivered: 0, verified: 0, failed: 0, verifiedRate: null, medianSecondsToVerify: null },
  webhook: null,
  limits: { perPhoneWindow: 3, perPhoneWindowMinutes: 10, perPhoneDay: 10 },
  ready: { number: false, tested: false, key: false },
  ...over,
});
export const MESSAGE = "*482913* is your Acme Stores sign-in code.\nIt expires in 5 minutes. Never share this code with anyone.";
