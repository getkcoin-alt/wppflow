// What a person came to do, when they arrive from the website's pricing page or back from Google: "create an account on the
// Growth plan, paid yearly". It is read once when the app loads, kept for the length of the visit (so it survives the trip to
// Google and the sign-in form), and used once the person is inside, to open the payment for that plan.

export interface SignupIntent {
  plan: string;
  interval: "monthly" | "annual" | "";
}
export interface Startup {
  /** arrived to create an account: the sign-up form is shown first */
  signup: boolean;
  intent: SignupIntent | null;
  /** back from Google: "ok", "new" or nothing */
  google: string;
  /** Google sign-in did not work: one of a few plain words */
  googleError: string;
}
const KEY = "scriwo_intent";
const OWN_PARAMS = ["signup", "plan", "interval", "google", "google_error"];

const store = (): Storage | null => {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
};
export const cleanIntent = (plan: string | null, interval: string | null): SignupIntent | null => {
  const p = (plan || "").toLowerCase();
  if (!/^[a-z0-9_-]{1,30}$/.test(p)) return null;
  const i = (interval || "").toLowerCase();
  return { plan: p, interval: i === "annual" || i === "yearly" ? "annual" : i === "monthly" ? "monthly" : "" };
};
export const readIntent = (): SignupIntent | null => {
  try {
    const raw = store()?.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v ? cleanIntent(v.plan, v.interval) : null;
  } catch {
    return null;
  }
};
export const clearIntent = () => {
  try {
    store()?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};
/** Paid plans are paid for inside the app; Free needs nothing and Enterprise is agreed with us first. */
export const isPayable = (intent: SignupIntent | null): intent is SignupIntent =>
  Boolean(intent && intent.plan !== "free" && intent.plan !== "enterprise");

// Reads this page's address: remembers the intent, and takes our own words out of the address bar so a refresh or a shared
// link does not repeat them. Invitation and password-reset links are left alone.
export function captureStartup(): Startup {
  const none: Startup = { signup: false, intent: null, google: "", googleError: "" };
  if (typeof window === "undefined") return none;
  const url = new URL(window.location.href);
  const p = url.searchParams;
  const intent = cleanIntent(p.get("plan"), p.get("interval"));
  const startup: Startup = {
    signup: p.get("signup") === "1",
    intent,
    google: p.get("google") || "",
    googleError: p.get("google_error") || "",
  };
  if (intent) {
    try {
      store()?.setItem(KEY, JSON.stringify(intent));
    } catch {
      /* the intent then lasts only until the page is left */
    }
  }
  if (OWN_PARAMS.some((k) => p.has(k))) {
    OWN_PARAMS.forEach((k) => p.delete(k));
    window.history.replaceState(null, "", `${url.pathname}${p.toString() ? `?${p}` : ""}${url.hash}`);
  }
  return startup;
}
export let startup: Startup = captureStartup();
/** For tests: read the address again. */
export const recaptureStartup = () => (startup = captureStartup());
