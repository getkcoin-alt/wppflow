import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckoutError, createOrder, describeStatus, emptyValues, getQuote, getStatus, orderBody, priceOf, rupees, validateCheckout, type CheckoutPlan, type CheckoutValues } from "@/lib/checkout";

const ok: CheckoutValues = {
  companyName: "Acme Traders",
  ownerName: "Olivia Owner",
  ownerEmail: "olivia@acme.test",
  phone: "+91 98100 00000",
  legalName: "",
  addressLine1: "12 MG Road",
  city: "Lucknow",
  stateCode: "09",
  postalCode: "226001",
  gstin: "",
  acceptedTerms: true,
};

describe("money in rupees", () => {
  it("shows whole rupees plainly and paise when there are any", () => {
    expect(rupees(249900)).toBe("₹2,499");
    expect(rupees(825882)).toBe("₹8,258.82");
    expect(rupees(100)).toBe("₹1");
  });
  it("finds a plan's price for a billing period, or none", () => {
    const plan: CheckoutPlan = { id: "growth", name: "Growth", numbers: 10, taxMode: "exclusive", prices: [{ interval: "monthly", currency: "INR", amountMinor: 699900 }] };
    expect(priceOf(plan, "monthly")).toBe(699900);
    expect(priceOf(plan, "annual")).toBeNull();
    expect(priceOf(undefined, "monthly")).toBeNull();
  });
});

describe("checking the form before anything is paid", () => {
  it("accepts a complete form, with the optional parts left blank", () => {
    expect(validateCheckout(ok)).toEqual({});
    expect(validateCheckout({ ...ok, phone: "" })).toEqual({});
  });
  it("says what is missing, in words", () => {
    const e = validateCheckout(emptyValues);
    expect(Object.keys(e).sort()).toEqual(["acceptedTerms", "addressLine1", "city", "companyName", "ownerEmail", "ownerName", "postalCode", "stateCode"]);
    expect(e.acceptedTerms).toMatch(/Terms of Service and the Refund policy/);
    expect(e.ownerEmail).toMatch(/sign-in link/);
  });
  it("checks the email, phone, PIN code and GSTIN", () => {
    expect(validateCheckout({ ...ok, ownerEmail: "nobody" }).ownerEmail).toBeTruthy();
    expect(validateCheckout({ ...ok, phone: "call me" }).phone).toMatch(/country code/);
    expect(validateCheckout({ ...ok, postalCode: "12" }).postalCode).toMatch(/6 digit/);
    expect(validateCheckout({ ...ok, postalCode: "026001" }).postalCode).toBeTruthy();
    expect(validateCheckout({ ...ok, gstin: "not a gstin" }).gstin).toMatch(/does not look right/);
    expect(validateCheckout({ ...ok, gstin: "27AAPFU0939F1ZV" }).gstin).toMatch(/starts with 27/);
    expect(validateCheckout({ ...ok, stateCode: "27", gstin: " 27aapfu0939f1zv " })).toEqual({});
  });
});

describe("what is sent to the server", () => {
  it("is what was typed, with the company name as the invoice name when none is given, and no price", () => {
    const body = orderBody(ok, "growth", "annual");
    expect(body).toMatchObject({ plan: "growth", interval: "annual", companyName: "Acme Traders", ownerEmail: "olivia@acme.test", acceptedTerms: true, website: "" });
    expect(body.billing).toEqual({ legalName: "Acme Traders", addressLine1: "12 MG Road", city: "Lucknow", stateCode: "09", postalCode: "226001", gstin: "" });
    expect(JSON.stringify(body)).not.toMatch(/amount|price|total/i);
    expect(orderBody({ ...ok, legalName: "Acme Traders Pvt Ltd" }, "growth", "monthly").billing.legalName).toBe("Acme Traders Pvt Ltd");
    expect(orderBody(ok, "growth", "monthly", "http://spam.test").website).toBe("http://spam.test");
  });
});

describe("what the page says about the payment", () => {
  const status = (over = {}) => ({ status: "processing" as const, company: "Acme", email: "o***@acme.test", plan: "Growth", reason: null, ...over });
  it("waits while it is being confirmed", () => {
    expect(describeStatus(status())).toMatchObject({ tone: "wait", title: "Confirming your payment…" });
  });
  it("says the workspace is ready, where the link went and where the invoice is", () => {
    const v = describeStatus(status({ status: "paid" }));
    expect(v).toMatchObject({ tone: "done", title: "Your Growth workspace is ready" });
    expect(v.body).toContain("o***@acme.test");
    expect(v.body).toMatch(/Plans & Billing/);
  });
  it("tells a buyer whose payment needs a person's look that they do not pay again", () => {
    const v = describeStatus(status({ status: "review" }));
    expect(v.tone).toBe("problem");
    expect(v.body).toMatch(/do not need to pay again/);
  });
  it("says a failed payment charged nothing, and why", () => {
    const v = describeStatus(status({ status: "failed", reason: "Card declined" }));
    expect(v.body).toBe("Card declined. You have not been charged. You can try again with the same or another payment method.");
    expect(describeStatus(status({ status: "expired" })).body).toMatch(/not been charged/);
  });
});

describe("asking the server", () => {
  afterEach(() => vi.unstubAllGlobals());
  const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
  it("asks for the exact price of a plan in a state, and the server's words come back as the error", async () => {
    vi.stubGlobal("fetch", reply(200, { status: "success", quote: { totalMinor: 825882 } }));
    expect((await getQuote("growth", "monthly", "09")).totalMinor).toBe(825882);
    expect(fetch).toHaveBeenCalledWith("/api/public/checkout/quote", expect.objectContaining({ method: "POST", body: JSON.stringify({ plan: "growth", interval: "monthly", stateCode: "09" }) }));
    vi.stubGlobal("fetch", reply(409, { message: "This email already has a Scriwo account.", code: "account_exists" }));
    await expect(createOrder(orderBody(ok, "growth", "monthly"))).rejects.toMatchObject({ message: "This email already has a Scriwo account.", code: "account_exists" });
  });
  it("tells a buyer who is offline so, and encodes the token it was given", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const err = await getStatus("o1", "t").catch((e) => e);
    expect(err).toBeInstanceOf(CheckoutError);
    expect(err.code).toBe("offline");
    vi.stubGlobal("fetch", reply(200, { status: "paid" }));
    await getStatus("order 1", "a/b");
    expect(fetch).toHaveBeenCalledWith("/api/public/checkout/status?order=order%201&token=a%2Fb", expect.anything());
  });
});
