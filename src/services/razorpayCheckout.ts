import type { CheckoutOptions } from "./api";

// Razorpay's own checkout, loaded only when someone is about to pay. Card, UPI and bank details are typed into
// Razorpay's window and never reach Scriwo; what comes back is a set of ids and a signature the server checks.
const SRC = "https://checkout.razorpay.com/v1/checkout.js";
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: any) => void) => void };
  }
}

let loading: Promise<void> | null = null;
export function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("The payment window could not be loaded. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export interface CheckoutResult {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}
export class CheckoutClosed extends Error {
  constructor() {
    super("The payment window was closed before the payment finished.");
  }
}

// Opens the checkout for an order or a subscription made by the server. Resolves with what Razorpay returns after
// a payment; rejects with CheckoutClosed when the person closes the window, or with the bank's reason when it fails.
export async function openCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
  await loadCheckout();
  return new Promise<CheckoutResult>((resolve, reject) => {
    // A failed attempt does not end the window: the customer can try another card or UPI app inside it. So the failure
    // is only remembered, and said if they then close the window without paying.
    let failure = "";
    const rz = new window.Razorpay!({
      key: options.key,
      ...(options.orderId ? { order_id: options.orderId, amount: options.amount, currency: options.currency } : {}),
      ...(options.subscriptionId ? { subscription_id: options.subscriptionId } : {}),
      name: options.name,
      description: options.description,
      prefill: options.prefill,
      theme: { color: "#0f6b50" },
      modal: { ondismiss: () => reject(failure ? new Error(failure) : new CheckoutClosed()), confirm_close: true },
      handler: (response: CheckoutResult) => resolve(response),
    });
    rz.on("payment.failed", (r: any) => {
      failure = r?.error?.description || "The payment did not go through. You have not been charged.";
    });
    rz.open();
  });
}
