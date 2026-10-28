import { SITE } from "@/lib/site";

// Where "Get started free" and "Buy" on the pricing page go: the app's sign-up page, with the plan the visitor chose carried
// along. They create an account with Google or their email and password; for a paid plan the payment for it opens as soon as
// they are in. The price is worked out by the server at that moment, never taken from this address.
export function signupUrl(plan: string, interval?: "monthly" | "yearly"): string {
  const url = new URL(SITE.appUrl);
  url.searchParams.set("signup", "1");
  url.searchParams.set("plan", plan);
  if (plan !== "free" && interval) url.searchParams.set("interval", interval === "yearly" ? "annual" : "monthly");
  return url.toString();
}
