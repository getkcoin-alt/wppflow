import { PLANS, TAX_NOTE, YEARLY_MONTHS, type Plan } from "@/content/plans";
import type { Currency } from "@/lib/money";

// The plans, prices and tax rate the product itself holds (the platform admin edits them in the app), so a price
// changed there is the price shown here. The words on each plan card (who it is for, what it includes) are written
// in content/plans.ts. If the product cannot be reached the list in that file is shown instead, so the pricing page
// never goes blank.
export type Catalogue = {
  plans: Plan[];
  /** GST rate on rupee prices, in percent */
  gstRate: number;
  /** Months paid for a year, when every paid plan agrees; null when plans differ */
  yearlyMonths: number | null;
  live: boolean;
};

const BACKEND_URL = (process.env.BACKEND_URL || "https://srv1628639.hstgr.cloud").replace(/\/+$/, "");

const FALLBACK_GST = 18;
const yearlyMonthsOf = (plans: Plan[]): number | null => {
  const ratios = new Set<number>();
  for (const p of plans)
    for (const cur of ["AED", "INR"] as const) {
      const m = p.price[cur],
        y = p.yearly?.[cur] ?? (m === null ? null : m * YEARLY_MONTHS);
      if (m && y) ratios.add(Math.round((y / m) * 100) / 100);
    }
  return ratios.size === 1 ? [...ratios][0] : null;
};

export const FALLBACK: Catalogue = { plans: PLANS, gstRate: FALLBACK_GST, yearlyMonths: YEARLY_MONTHS, live: false };

const numbersLabel = (n: number | null) => (n === null ? "Custom number limit" : n === 1 ? "1 number" : `Up to ${n} numbers`);
const major = (minor: unknown) => (typeof minor === "number" && Number.isFinite(minor) && minor >= 0 ? minor / 100 : null);

// Reads the product's list of plans for sale. Anything that does not look right gives null, never a half-built list.
export function fromApi(body: unknown): Catalogue | null {
  const raw = (body as { plans?: unknown })?.plans;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const rate = (body as { gstRate?: unknown }).gstRate;
  const gstRate = typeof rate === "number" && Number.isInteger(rate) && rate >= 0 && rate <= 28 ? rate : FALLBACK_GST;
  const plans: Plan[] = [];
  for (const p of raw as any[]) {
    const base = PLANS.find((x) => x.id === p?.id);
    if (!base || typeof p.name !== "string" || !p.name) continue;
    const prices: any[] = Array.isArray(p.prices) ? p.prices : [];
    const at = (interval: string, currency: string) => major(prices.find((x) => x?.interval === interval && x?.currency === currency)?.amountMinor);
    const free = base.id === "free";
    plans.push({
      ...base,
      name: p.name,
      numbers: numbersLabel(typeof p.numbers === "number" ? p.numbers : null),
      price: free ? { AED: 0, INR: 0 } : { AED: at("monthly", "AED"), INR: at("monthly", "INR") },
      yearly: free ? { AED: 0, INR: 0 } : { AED: at("annual", "AED"), INR: at("annual", "INR") },
      taxMode: p.taxMode === "inclusive" ? "inclusive" : "exclusive",
    });
  }
  if (plans.length === 0) return null;
  return { plans, gstRate, yearlyMonths: yearlyMonthsOf(plans), live: true };
}

export async function getCatalogue(): Promise<Catalogue> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/public/plans`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return FALLBACK;
    return fromApi(await res.json()) ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/** The line under a price list: what tax is or is not in the prices. */
export function taxNote(cat: Catalogue, cur: Currency): string {
  if (cur === "AED") return TAX_NOTE.AED;
  const paid = cat.plans.filter((p) => (p.price.INR ?? 0) > 0);
  const inclusive = paid.filter((p) => p.taxMode === "inclusive").length;
  if (inclusive === 0) return `Prices exclude ${cat.gstRate}% GST.`;
  if (inclusive === paid.length) return `Prices include ${cat.gstRate}% GST.`;
  return `${cat.gstRate}% GST is added to the price, or included in it where a plan says so.`;
}

/** The answer to "Do prices include tax?" */
export function taxAnswer(cat: Catalogue): string {
  const paid = cat.plans.filter((p) => (p.price.INR ?? 0) > 0);
  const inclusive = paid.filter((p) => p.taxMode === "inclusive").length;
  if (inclusive === 0) return `No. UAE prices exclude 5% VAT and Indian prices exclude ${cat.gstRate}% GST, which are added to the invoice.`;
  if (inclusive === paid.length) return `Indian prices include ${cat.gstRate}% GST. UAE prices exclude 5% VAT, which is added to the invoice.`;
  return `It depends on the plan: each Indian price says whether its ${cat.gstRate}% GST is included or added. UAE prices exclude 5% VAT, which is added to the invoice.`;
}

/** The cheapest paid plan in a currency, for "from ..." lines. */
export const cheapestPaid = (cat: Catalogue, cur: Currency): number | null => {
  const prices = cat.plans.map((p) => p.price[cur]).filter((n): n is number => typeof n === "number" && n > 0);
  return prices.length ? Math.min(...prices) : null;
};
