// Buying a plan on the website. The server works out every price and tax figure; this file only asks it, shows what it
// said, and opens Razorpay's payment window for the order it made. Nothing here decides what something costs.

export type Interval = "monthly" | "annual";
export type CheckoutPlan = {
  id: string;
  name: string;
  numbers: number | null;
  taxMode: "exclusive" | "inclusive";
  prices: { interval: Interval; currency: "INR"; amountMinor: number }[];
};
export type CheckoutOptions = {
  enabled: boolean;
  gstRate: number;
  sellerStateCode: string;
  states: { code: string; name: string }[];
  plans: CheckoutPlan[];
};
export type Quote = {
  plan: { id: string; name: string };
  interval: Interval;
  baseMinor: number;
  taxMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalMinor: number;
  taxMode: "exclusive" | "inclusive";
  gstRate: number;
  intraState: boolean;
  periodStart: string;
  periodEnd: string;
};

export type CheckoutValues = {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  legalName: string;
  addressLine1: string;
  city: string;
  stateCode: string;
  postalCode: string;
  gstin: string;
  acceptedTerms: boolean;
};
export const emptyValues: CheckoutValues = {
  companyName: "",
  ownerName: "",
  ownerEmail: "",
  phone: "",
  legalName: "",
  addressLine1: "",
  city: "",
  stateCode: "",
  postalCode: "",
  gstin: "",
  acceptedTerms: false,
};

export const rupees = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(minor / 100);

export const priceOf = (plan: CheckoutPlan | undefined, interval: Interval) => plan?.prices.find((p) => p.interval === interval)?.amountMinor ?? null;

/** Mirrors the server's checks so people see problems before paying. The server is still the authority. */
export function validateCheckout(v: CheckoutValues): Partial<Record<keyof CheckoutValues, string>> {
  const e: Partial<Record<keyof CheckoutValues, string>> = {};
  const len = (s: string) => s.trim().length;
  if (len(v.companyName) < 2) e.companyName = "Enter your company name.";
  if (len(v.ownerName) < 2) e.ownerName = "Enter your name.";
  if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(v.ownerEmail.trim())) e.ownerEmail = "Enter a valid email address. We send your sign-in link here.";
  if (v.phone.trim() && !/^[+\d][\d\s()-]{5,}$/.test(v.phone.trim())) e.phone = "Include the country code, for example +91 98100 00000.";
  if (len(v.addressLine1) < 3) e.addressLine1 = "Enter the address that goes on the invoice.";
  if (len(v.city) < 2) e.city = "Enter the city.";
  if (!v.stateCode) e.stateCode = "Choose your state. It decides how GST is shown on the invoice.";
  if (!/^[1-9][0-9]{5}$/.test(v.postalCode.trim())) e.postalCode = "Enter a 6 digit PIN code.";
  const gstin = v.gstin.replace(/\s+/g, "").toUpperCase();
  if (gstin) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) e.gstin = "That GSTIN does not look right. Leave it blank if you have none.";
    else if (v.stateCode && gstin.slice(0, 2) !== v.stateCode) e.gstin = `This GSTIN starts with ${gstin.slice(0, 2)}, so choose the state it belongs to.`;
  }
  if (!v.acceptedTerms) e.acceptedTerms = "Please accept the Terms of Service and the Refund policy to continue.";
  return e;
}

export const orderBody = (v: CheckoutValues, plan: string, interval: Interval, honeypot = "") => ({
  plan,
  interval,
  companyName: v.companyName,
  ownerName: v.ownerName,
  ownerEmail: v.ownerEmail,
  phone: v.phone,
  acceptedTerms: v.acceptedTerms,
  website: honeypot,
  billing: { legalName: v.legalName.trim() || v.companyName, addressLine1: v.addressLine1, city: v.city, stateCode: v.stateCode, postalCode: v.postalCode, gstin: v.gstin },
});

export class CheckoutError extends Error {
  code: string;
  constructor(message: string, code = "") {
    super(message);
    this.code = code;
  }
}
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/public/checkout/${path}`, { ...init, headers: { "Content-Type": "application/json" } });
  } catch {
    throw new CheckoutError("You appear to be offline. Check your connection and try again.", "offline");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new CheckoutError(body?.message || "Something went wrong. Please try again in a moment.", body?.code || String(res.status));
  return body as T;
}
export const getQuote = async (plan: string, interval: Interval, stateCode: string) =>
  (await call<{ quote: Quote }>("quote", { method: "POST", body: JSON.stringify({ plan, interval, stateCode }) })).quote;

export type OrderReply = {
  orderRef: string;
  statusToken: string;
  quote: Quote;
  checkout: { key: string; orderId: string; amount: number; currency: string; name: string; description: string; prefill: { name: string; email: string; contact?: string } };
};
export const createOrder = (body: ReturnType<typeof orderBody>) => call<OrderReply>("order", { method: "POST", body: JSON.stringify(body) });
export type PaymentResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
export const verifyPayment = (result: PaymentResult) => call<{ status: string; orderRef: string; statusToken: string }>("verify", { method: "POST", body: JSON.stringify(result) });
export type PurchaseStatus = { status: "paid" | "processing" | "failed" | "expired" | "review"; company: string; email: string; plan: string; reason: string | null };
export const getStatus = (order: string, token: string) => call<PurchaseStatus>(`status?order=${encodeURIComponent(order)}&token=${encodeURIComponent(token)}`);

// ── Razorpay's payment window ─────────────────────────────────────────────────────────────────────
export type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  handler: (result: PaymentResult) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = { open: () => void; on: (event: string, fn: (response: { error?: { description?: string } }) => void) => void };
export type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}
export function loadRazorpay(): Promise<RazorpayCtor> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const fail = () => reject(new CheckoutError("We could not open the payment window. Check your connection and try again; you have not been charged.", "script"));
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : fail());
    script.onerror = fail;
    document.head.appendChild(script);
  });
}

/** What the page says while it waits for, or after, the payment is confirmed. */
export function describeStatus(s: PurchaseStatus): { tone: "done" | "wait" | "problem"; title: string; body: string } {
  switch (s.status) {
    case "paid":
      return {
        tone: "done",
        title: `Your ${s.plan} workspace is ready`,
        body: `We sent a link to ${s.email} to choose your password. Open it, sign in, and connect your first WhatsApp number. Your tax invoice is in the app under Team, Plans & Billing.`,
      };
    case "review":
      return {
        tone: "problem",
        title: "We received your payment and are finishing the setup",
        body: "Something needs a quick look on our side. You do not need to pay again. We will email you as soon as your workspace is ready, usually within one business day.",
      };
    case "failed":
      return { tone: "problem", title: "The payment did not go through", body: `${s.reason ? `${s.reason}. ` : ""}You have not been charged. You can try again with the same or another payment method.` };
    case "expired":
      return { tone: "problem", title: "This order has expired", body: "You have not been charged. Start again to get a fresh price." };
    default:
      return { tone: "wait", title: "Confirming your payment…", body: "This usually takes a few seconds. Please keep this page open." };
  }
}
