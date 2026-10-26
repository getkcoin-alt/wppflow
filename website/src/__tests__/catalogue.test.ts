import { afterEach, describe, expect, it, vi } from "vitest";
import { PLANS, yearlyOf } from "@/content/plans";
import { FALLBACK, cheapestPaid, fromApi, getCatalogue, taxAnswer, taxNote } from "@/lib/catalogue";

const price = (interval: "monthly" | "annual", currency: "INR" | "AED", amountMinor: number) => ({ interval, currency, amountMinor });
const api = (over: Record<string, unknown> = {}) => ({
  status: "success",
  gstRate: 18,
  plans: [
    { id: "free", name: "Free", numbers: 1, seats: 1, taxMode: "exclusive", prices: [] },
    {
      id: "starter", name: "Starter", numbers: 3, seats: null, taxMode: "exclusive",
      prices: [price("monthly", "INR", 249900), price("annual", "INR", 2499000), price("monthly", "AED", 29900), price("annual", "AED", 299000)],
    },
    {
      id: "growth", name: "Growth", numbers: 10, seats: null, taxMode: "exclusive",
      prices: [price("monthly", "INR", 549900), price("annual", "INR", 5499000), price("monthly", "AED", 79900), price("annual", "AED", 799000)],
    },
    { id: "enterprise", name: "Enterprise", numbers: null, seats: null, taxMode: "exclusive", prices: [] },
  ],
  ...over,
});

describe("the price list read from the product", () => {
  it("takes prices, names and number limits from the product and the wording from the site", () => {
    const cat = fromApi(api())!;
    expect(cat.live).toBe(true);
    expect(cat.plans.map((p) => p.id)).toEqual(["free", "starter", "growth", "enterprise"]);
    const growth = cat.plans.find((p) => p.id === "growth")!;
    expect(growth.price).toEqual({ AED: 799, INR: 5499 }); // the product's INR price, not the site's 6,999
    expect(growth.numbers).toBe("Up to 10 numbers");
    expect(growth.includes).toEqual(PLANS.find((p) => p.id === "growth")!.includes);
    expect(growth.for).toBe(PLANS.find((p) => p.id === "growth")!.for);
    expect(cat.plans[0].price).toEqual({ AED: 0, INR: 0 });
    expect(cat.plans[0].numbers).toBe("1 number");
    expect(cat.plans[3].price).toEqual({ AED: null, INR: null });
    expect(cat.plans[3].numbers).toBe("Custom number limit");
  });

  it("only lists the plans the product has for sale, in its order", () => {
    const cat = fromApi(api({ plans: api().plans.filter((p) => p.id !== "growth") }))!;
    expect(cat.plans.map((p) => p.id)).toEqual(["free", "starter", "enterprise"]);
  });

  it("uses the yearly price the product sets, and says how many months a year costs when they agree", () => {
    const cat = fromApi(api())!;
    expect(yearlyOf(cat.plans.find((p) => p.id === "starter")!, "INR")).toBe(24990);
    expect(cat.yearlyMonths).toBe(10);
    const odd = fromApi(api({ plans: api().plans.map((p) => (p.id === "growth" ? { ...p, prices: [price("monthly", "INR", 100000), price("annual", "INR", 1100000)] } : p)) }))!;
    expect(yearlyOf(odd.plans.find((p) => p.id === "growth")!, "INR")).toBe(11000);
    expect(odd.yearlyMonths).toBeNull();
  });

  it("a plan with no price is a custom quote, not a free one", () => {
    const cat = fromApi(api({ plans: [{ id: "starter", name: "Starter", numbers: 3, taxMode: "exclusive", prices: [price("monthly", "AED", 29900)] }] }))!;
    expect(cat.plans[0].price).toEqual({ AED: 299, INR: null });
    expect(yearlyOf(cat.plans[0], "AED")).toBeNull();
  });

  it("ignores anything it does not recognise, and refuses a list it cannot read", () => {
    expect(fromApi(null)).toBeNull();
    expect(fromApi({ plans: [] })).toBeNull();
    expect(fromApi({ plans: "no" })).toBeNull();
    expect(fromApi({ plans: [{ id: "platinum", name: "Platinum", prices: [] }, { id: "starter", name: "" }] })).toBeNull();
    const cat = fromApi(api({ plans: [...api().plans, { id: "platinum", name: "Platinum", numbers: 9, prices: [] }] }))!;
    expect(cat.plans.some((p) => p.id === ("platinum" as string))).toBe(false);
  });

  it("the GST rate is the product's; an older server that does not send it means 18", () => {
    expect(fromApi(api({ gstRate: 12 }))!.gstRate).toBe(12);
    expect(fromApi(api({ gstRate: undefined }))!.gstRate).toBe(18);
    expect(fromApi(api({ gstRate: "twelve" }))!.gstRate).toBe(18);
    expect(fromApi(api({ gstRate: 99 }))!.gstRate).toBe(18);
  });
});

describe("what the page says about tax", () => {
  it("says GST is added, with the product's rate", () => {
    expect(taxNote(fromApi(api({ gstRate: 12 }))!, "INR")).toBe("Prices exclude 12% GST.");
    expect(taxNote(fromApi(api())!, "AED")).toBe("Prices exclude 5% VAT.");
    expect(taxAnswer(fromApi(api())!)).toContain("Indian prices exclude 18% GST");
  });
  it("says so when the rupee prices already include GST, or when plans differ", () => {
    const inc = (ids: string[]) => fromApi(api({ plans: api().plans.map((p) => (ids.includes(p.id) ? { ...p, taxMode: "inclusive" } : p)) }))!;
    expect(taxNote(inc(["starter", "growth"]), "INR")).toBe("Prices include 18% GST.");
    expect(taxAnswer(inc(["starter", "growth"]))).toContain("Indian prices include 18% GST");
    expect(taxNote(inc(["growth"]), "INR")).toContain("where a plan says so");
    expect(taxAnswer(inc(["growth"]))).toContain("each Indian price says whether");
  });
  it("the static list says what it always said", () => {
    expect(taxNote(FALLBACK, "INR")).toBe("Prices exclude 18% GST.");
    expect(taxAnswer(FALLBACK)).toBe("No. UAE prices exclude 5% VAT and Indian prices exclude 18% GST, which are added to the invoice.");
  });
});

describe("the starting price", () => {
  it("is the cheapest paid plan in each currency", () => {
    const cat = fromApi(api())!;
    expect(cheapestPaid(cat, "INR")).toBe(2499);
    expect(cheapestPaid(cat, "AED")).toBe(299);
    expect(cheapestPaid(FALLBACK, "INR")).toBe(2499);
  });
});

describe("fetching it", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("returns the product's list, and the site's own list when the product cannot be reached or answers badly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => api({ gstRate: 12 }) }));
    const live = await getCatalogue();
    expect(live.live).toBe(true);
    expect(live.gstRate).toBe(12);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/public\/plans$/), expect.objectContaining({ next: { revalidate: 300 } }));

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getCatalogue()).toBe(FALLBACK);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await getCatalogue()).toBe(FALLBACK);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ plans: [] }) }));
    expect(await getCatalogue()).toBe(FALLBACK);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error("not json"); } }));
    expect(await getCatalogue()).toBe(FALLBACK);
  });
});
