import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  fetchBilling: vi.fn(),
  saveBillingProfile: vi.fn(),
  fetchBillingQuote: vi.fn(),
  startCheckout: vi.fn(),
  verifyCheckoutPayment: vi.fn(),
  startAutopaySetup: vi.fn(),
  verifyAutopaySetup: vi.fn(),
  stopAutopay: vi.fn(),
  scheduleBillingChange: vi.fn(),
  keepBillingPlan: vi.fn(),
  downloadInvoice: vi.fn(),
  fetchPublicPlans: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
const checkout = vi.hoisted(() => ({ openCheckout: vi.fn() }));
vi.mock("../services/razorpayCheckout", () => {
  class CheckoutClosed extends Error {
    constructor() {
      super("closed");
    }
  }
  return { openCheckout: checkout.openCheckout, CheckoutClosed, loadCheckout: vi.fn() };
});
import { BillingPage } from "../components/billing/BillingPage";

const feat = (key: string, label: string, included: boolean) => ({ key, label, included });
const PLANS = [
  { id: "free", name: "Free", numbers: 1, seats: 1, taxMode: "exclusive", prices: [], features: [feat("ai", "The AI assistant", false)] },
  { id: "starter", name: "Starter", numbers: 3, seats: null, taxMode: "exclusive", prices: [{ interval: "monthly", currency: "INR", amountMinor: 249900 }, { interval: "annual", currency: "INR", amountMinor: 2499000 }], features: [feat("ai", "The AI assistant", false)] },
  { id: "growth", name: "Growth", numbers: 10, seats: null, taxMode: "exclusive", prices: [{ interval: "monthly", currency: "INR", amountMinor: 699900 }, { interval: "annual", currency: "INR", amountMinor: 6999000 }], features: [feat("ai", "The AI assistant", true)] },
];
const PROFILE = { legalName: "Acme Traders Pvt Ltd", addressLine1: "12 MG Road", addressLine2: "", city: "Lucknow", stateCode: "09", state: "Uttar Pradesh", postalCode: "226001", gstin: null, billingEmail: "a@acme.test" };
const STATES = [{ code: "09", name: "Uttar Pradesh" }, { code: "27", name: "Maharashtra" }];
const QUOTE = {
  plan: { id: "growth", name: "Growth" }, interval: "monthly", kind: "new", baseMinor: 699900, creditMinor: 0, taxableMinor: 699900, taxMinor: 125982,
  cgstMinor: 62991, sgstMinor: 62991, igstMinor: 0, totalMinor: 825882, gstRate: 18, intraState: true, periodStart: "2026-10-25", periodEnd: "2026-11-25",
  requiresConfirm: false, paidUntil: null, previousPlan: null,
};
const overview = (over = {}) => ({
  payments: { configured: true, mode: "live" }, gstRate: 18, prorateUpgrades: true, subscription: { planId: "starter" }, profile: PROFILE, states: STATES,
  orders: [], invoices: [], history: [], autopay: null, ...over,
});
const sub = (over = {}) => ({ status: "active", plan: "Starter", planId: "starter", cycle: "monthly", periodStart: "2026-10-01", periodEnd: "2026-11-01", daysLeft: 7, scheduledPlan: null, ...over });
const wrap = (props: Partial<React.ComponentProps<typeof BillingPage>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BillingPage plan={{ id: "starter", name: "Starter", restricted: true, features: { ai: false } }} numbersLimit={3} numbersUsed={1} subscription={sub() as any} {...props} />
    </QueryClientProvider>,
  );
const chooseGrowth = async () => {
  await screen.findByRole("article", { name: "Growth" });
  fireEvent.click(screen.getByRole("tab", { name: /INR/ }));
  fireEvent.click(await screen.findByRole("button", { name: "Pay for Growth, monthly" }));
  return within(await screen.findByRole("dialog", { name: /Pay for Growth/ }));
};

beforeEach(() => {
  for (const fn of [...Object.values(api), checkout.openCheckout]) fn.mockReset();
  api.fetchPublicPlans.mockResolvedValue(PLANS);
  api.fetchBilling.mockResolvedValue(overview());
  api.fetchBillingQuote.mockResolvedValue({ quote: QUOTE, profileMissing: false, autopayActive: false });
});
afterEach(cleanup);

describe("a plan chosen before the account existed", () => {
  it("opens the payment for that plan, priced by the server, once and only once", async () => {
    const handled = vi.fn();
    wrap({ payIntent: { plan: "growth", interval: "annual" }, onPayIntentHandled: handled });
    const dialog = within(await screen.findByRole("dialog", { name: /Pay for Growth/ }));
    expect(dialog).toBeDefined();
    await waitFor(() => expect(api.fetchBillingQuote).toHaveBeenCalledWith("growth", "annual"));
    expect(handled).toHaveBeenCalledTimes(1);
  });
  it("defaults to monthly when no period was chosen, and opens nothing for the plan the company already has", async () => {
    wrap({ payIntent: { plan: "growth", interval: "" }, onPayIntentHandled: vi.fn() });
    await screen.findByRole("dialog", { name: /Pay for Growth/ });
    expect(api.fetchBillingQuote).toHaveBeenCalledWith("growth", "monthly");
    cleanup();
    api.fetchBillingQuote.mockClear();
    const handled = vi.fn();
    wrap({ payIntent: { plan: "starter", interval: "monthly" }, onPayIntentHandled: handled });
    await waitFor(() => expect(handled).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(api.fetchBillingQuote).not.toHaveBeenCalled();
  });
  it("opens nothing while online payment is not switched on", async () => {
    api.fetchBilling.mockResolvedValue(overview({ payments: { configured: false, mode: null } }));
    const handled = vi.fn();
    wrap({ payIntent: { plan: "growth", interval: "monthly" }, onPayIntentHandled: handled });
    await waitFor(() => expect(handled).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Plans & Billing", () => {
  it("says when online payment is not switched on, and offers no way to pay", async () => {
    api.fetchBilling.mockResolvedValue(overview({ payments: { configured: false, mode: null } }));
    wrap();
    expect(await screen.findByText(/Online payment is not switched on yet/)).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /INR/ }));
    expect((await screen.findByRole("button", { name: "Pay for Growth, monthly" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("says plainly when payments are in test mode", async () => {
    api.fetchBilling.mockResolvedValue(overview({ payments: { configured: true, mode: "test" } }));
    wrap();
    expect(await screen.findByText(/test mode: no real money moves/)).toBeDefined();
  });

  it("offers rupee payment only: dirhams say coming soon and have no pay button", async () => {
    wrap();
    await screen.findByRole("article", { name: "Growth" });
    fireEvent.click(screen.getByRole("tab", { name: "AED" }));
    expect(screen.getByTestId("aed-note").textContent).toContain("coming soon");
    expect(screen.queryByRole("button", { name: /Pay for Growth/ })).toBeNull();
  });

  it("shows the price line by line with CGST and SGST, then pays through Razorpay and confirms with the server", async () => {
    checkout.openCheckout.mockResolvedValue({ razorpay_payment_id: "pay_1", razorpay_order_id: "order_1", razorpay_signature: "sig" });
    api.startCheckout.mockResolvedValue({ order: {}, quote: QUOTE, checkout: { key: "rzp_test_x", orderId: "order_1", amount: 825882, currency: "INR", name: "Scriwo", description: "Growth plan, monthly", prefill: { name: "Olivia", email: "a@acme.test" } } });
    api.verifyCheckoutPayment.mockResolvedValue({ status: "paid", order: { plan: "Growth", periodEnd: "2026-11-25" } });
    wrap();
    const d = await chooseGrowth();
    const price = within(await d.findByRole("region", { name: "Price" }));
    expect(price.getAllByText("₹6,999").length).toBe(2); // the plan, and the value before tax
    expect(price.getByText("CGST 9%")).toBeDefined();
    expect(price.getByText("SGST 9%")).toBeDefined();
    expect(price.queryByText(/IGST/)).toBeNull();
    expect(price.getAllByText("₹8,258.82").length).toBeGreaterThan(0);
    expect(d.getByText(/25 Oct 2026/)).toBeDefined();
    fireEvent.click(d.getByRole("button", { name: "Pay ₹8,258.82" }));
    await waitFor(() => expect(api.verifyCheckoutPayment).toHaveBeenCalledWith({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig" }));
    expect(api.startCheckout).toHaveBeenCalledWith({ plan: "growth", interval: "monthly", confirm: false });
    expect(checkout.openCheckout).toHaveBeenCalledWith(expect.objectContaining({ orderId: "order_1", key: "rzp_test_x" }));
    expect(await screen.findByText(/Payment received, thank you\. Your Growth plan runs until 25 Nov 2026/)).toBeDefined();
    expect(screen.queryByRole("dialog", { name: /Pay for Growth/ })).toBeNull();
  });

  it("shows IGST for a company in another state", async () => {
    api.fetchBillingQuote.mockResolvedValue({ quote: { ...QUOTE, intraState: false, cgstMinor: 0, sgstMinor: 0, igstMinor: 125982 }, profileMissing: false, autopayActive: false });
    wrap();
    const d = await chooseGrowth();
    const price = within(await d.findByRole("region", { name: "Price" }));
    expect(price.getByText("IGST 18%")).toBeDefined();
    expect(price.queryByText(/CGST/)).toBeNull();
  });

  it("shows the credit when moving to a bigger plan part-way through a period", async () => {
    api.fetchBillingQuote.mockResolvedValue({ quote: { ...QUOTE, kind: "change", creditMinor: 166600, taxableMinor: 533300, taxMinor: 95994, cgstMinor: 47997, sgstMinor: 47997, totalMinor: 629294, previousPlan: "Starter" }, profileMissing: false, autopayActive: false });
    wrap();
    const d = await chooseGrowth();
    const price = within(await d.findByRole("region", { name: "Price" }));
    expect(price.getByText(/Credit for the unused days of Starter/)).toBeDefined();
    expect(price.getByText("− ₹1,666")).toBeDefined();
    expect(d.getByRole("button", { name: "Pay ₹6,292.94" })).toBeDefined();
    expect(d.getByText(/replaces your current period/)).toBeDefined();
  });

  it("asks first when the period is already paid, and passes the confirmation to the server", async () => {
    api.fetchBillingQuote.mockResolvedValue({ quote: { ...QUOTE, kind: "renewal", requiresConfirm: true, paidUntil: "2026-11-20" }, profileMissing: false, autopayActive: false });
    checkout.openCheckout.mockRejectedValue(new Error("stop here"));
    api.startCheckout.mockResolvedValue({ order: {}, quote: QUOTE, checkout: { key: "k", orderId: "o", name: "Scriwo", description: "", prefill: { name: "", email: "" } } });
    wrap();
    const d = await chooseGrowth();
    const pay = await d.findByRole("button", { name: "Pay ₹8,258.82" });
    expect((pay as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(d.getByRole("checkbox"));
    expect((pay as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(pay);
    await waitFor(() => expect(api.startCheckout).toHaveBeenCalledWith({ plan: "growth", interval: "monthly", confirm: true }));
  });

  it("shows why a payment failed, and says nothing when the window is simply closed", async () => {
    const { CheckoutClosed } = await import("../services/razorpayCheckout");
    api.startCheckout.mockResolvedValue({ order: {}, quote: QUOTE, checkout: { key: "k", orderId: "o", name: "Scriwo", description: "", prefill: { name: "", email: "" } } });
    checkout.openCheckout.mockRejectedValueOnce(new Error("Card declined by the bank"));
    wrap();
    const d = await chooseGrowth();
    fireEvent.click(await d.findByRole("button", { name: "Pay ₹8,258.82" }));
    expect(await d.findByText("Card declined by the bank")).toBeDefined();
    expect(api.verifyCheckoutPayment).not.toHaveBeenCalled();
    checkout.openCheckout.mockRejectedValueOnce(new CheckoutClosed());
    fireEvent.click(d.getByRole("button", { name: "Pay ₹8,258.82" }));
    await waitFor(() => expect(checkout.openCheckout).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(d.queryByText("Card declined by the bank")).toBeNull());
  });

  it("says the payment is being confirmed when the server could not check yet", async () => {
    checkout.openCheckout.mockResolvedValue({ razorpay_payment_id: "pay_1", razorpay_order_id: "order_1", razorpay_signature: "sig" });
    api.startCheckout.mockResolvedValue({ order: {}, quote: QUOTE, checkout: { key: "k", orderId: "order_1", name: "Scriwo", description: "", prefill: { name: "", email: "" } } });
    api.verifyCheckoutPayment.mockResolvedValue({ status: "processing", order: { plan: "Growth", periodEnd: null } });
    wrap();
    const d = await chooseGrowth();
    fireEvent.click(await d.findByRole("button", { name: "Pay ₹8,258.82" }));
    expect(await screen.findByText(/Payment received, activating/)).toBeDefined();
  });

  it("shows the server's reason when a plan cannot be bought now, and does not offer to pay", async () => {
    api.fetchBillingQuote.mockRejectedValue(new Error("A smaller plan starts when your current period ends."));
    wrap();
    const d = await chooseGrowth();
    expect(await d.findByText(/smaller plan starts when your current period ends/)).toBeDefined();
    expect((d.getByRole("button", { name: "Pay" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("asks for billing details before paying, and opens the form", async () => {
    api.fetchBilling.mockResolvedValue(overview({ profile: null }));
    wrap();
    const d = await chooseGrowth();
    expect(d.getByText(/Add your billing details first/)).toBeDefined();
    fireEvent.click(d.getByRole("button", { name: "Add billing details" }));
    expect(await screen.findByRole("dialog", { name: "Billing details" })).toBeDefined();
  });

  it("saves billing details, tidying a blank GSTIN, and shows what the server refuses", async () => {
    api.fetchBilling.mockResolvedValue(overview({ profile: null }));
    api.saveBillingProfile.mockRejectedValueOnce(new Error("Enter a 6 digit PIN code"));
    wrap();
    const form = within(await screen.findByRole("form", { name: "Billing details" }));
    fireEvent.change(form.getByLabelText("Company legal name"), { target: { value: "Beta LLP" } });
    fireEvent.change(form.getByLabelText("Address"), { target: { value: "5 Marine Drive" } });
    fireEvent.change(form.getByLabelText("City"), { target: { value: "Mumbai" } });
    fireEvent.change(form.getByLabelText("State"), { target: { value: "27" } });
    fireEvent.change(form.getByLabelText("PIN code"), { target: { value: "40" } });
    fireEvent.click(form.getByRole("button", { name: "Save billing details" }));
    expect(await form.findByText("Enter a 6 digit PIN code")).toBeDefined();
    api.saveBillingProfile.mockResolvedValueOnce({});
    fireEvent.change(form.getByLabelText("PIN code"), { target: { value: "400001" } });
    fireEvent.change(form.getByLabelText("GSTIN"), { target: { value: "27aapfu0939f1zv" } });
    fireEvent.click(form.getByRole("button", { name: "Save billing details" }));
    await waitFor(() => expect(api.saveBillingProfile).toHaveBeenLastCalledWith(expect.objectContaining({ legalName: "Beta LLP", stateCode: "27", postalCode: "400001", gstin: "27AAPFU0939F1ZV" })));
    expect(await form.findByText("Saved.")).toBeDefined();
  });

  it("lists invoices and downloads one, and says when a download fails", async () => {
    api.fetchBilling.mockResolvedValue(overview({ invoices: [{ id: "i1", number: "SCZ/2026-27/00001", issueDate: "2026-10-25", plan: "Growth", interval: "monthly", periodStart: "2026-10-25", periodEnd: "2026-11-25", totalMinor: 825882 }] }));
    api.downloadInvoice.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("The invoice could not be downloaded. Please try again."));
    wrap();
    const li = within((await screen.findByText("SCZ/2026-27/00001")).closest("li") as HTMLElement);
    expect(li.getByText("₹8,258.82")).toBeDefined();
    fireEvent.click(li.getByRole("button", { name: "Download invoice SCZ/2026-27/00001" }));
    await waitFor(() => expect(api.downloadInvoice).toHaveBeenCalledWith("i1", "SCZ/2026-27/00001"));
    fireEvent.click(li.getByRole("button", { name: "Download invoice SCZ/2026-27/00001" }));
    expect(await screen.findByText(/could not be downloaded/)).toBeDefined();
  });

  it("shows each payment attempt with its outcome, and lets a failed one be tried again", async () => {
    api.fetchBilling.mockResolvedValue(overview({
      orders: [
        { id: "o1", plan: "Growth", planId: "growth", interval: "monthly", status: "failed", source: "checkout", totalMinor: 825882, failureReason: "Card declined by the bank", createdAt: "2026-10-24T10:00:00Z", invoiceId: null, periodStart: null, periodEnd: null, paidAt: null },
        { id: "o2", plan: "Starter", planId: "starter", interval: "monthly", status: "paid", source: "autopay", totalMinor: 294882, failureReason: null, createdAt: "2026-10-01T10:00:00Z", invoiceId: "i", periodStart: null, periodEnd: null, paidAt: null },
      ],
    }));
    wrap();
    const failed = within((await screen.findByText(/Card declined by the bank/)).closest("li") as HTMLElement);
    expect(failed.getByText("Failed")).toBeDefined();
    fireEvent.click(failed.getByRole("button", { name: /Try again/ }));
    expect(await screen.findByRole("dialog", { name: /Pay for Growth, monthly/ })).toBeDefined();
    const paid = within(screen.getByText(/Starter, monthly \(autopay\)/).closest("li") as HTMLElement);
    expect(paid.getByText("Paid")).toBeDefined();
  });

  it("sets autopay up through Razorpay for a monthly plan, and turns it off again", async () => {
    api.startAutopaySetup.mockResolvedValue({ autopay: {}, checkout: { key: "k", subscriptionId: "sub_1", name: "Scriwo", description: "", prefill: { name: "", email: "" } } });
    checkout.openCheckout.mockResolvedValue({ razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_1", razorpay_signature: "sig" });
    api.verifyAutopaySetup.mockResolvedValue({ autopay: {} });
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Set up autopay" }));
    await waitFor(() => expect(api.verifyAutopaySetup).toHaveBeenCalledWith({ razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_1", razorpay_signature: "sig" }));
    expect(api.startAutopaySetup).toHaveBeenCalledWith("starter");
    expect(await screen.findByText(/Autopay is set up/)).toBeDefined();
    cleanup();
    api.fetchBilling.mockResolvedValue(overview({ autopay: { id: "a", plan: "Starter", planId: "starter", interval: "monthly", amountMinor: 294882, status: "active", needsAttention: false } }));
    api.stopAutopay.mockResolvedValue({});
    wrap();
    expect(await screen.findByText(/₹2,948.82 a month including GST/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Turn off autopay" }));
    await waitFor(() => expect(api.stopAutopay).toHaveBeenCalled());
    expect(await screen.findByText(/Autopay is off\. Your paid period keeps running/)).toBeDefined();
  });

  it("warns when autopay has stopped because a charge failed", async () => {
    api.fetchBilling.mockResolvedValue(overview({ autopay: { id: "a", plan: "Starter", planId: "starter", interval: "monthly", amountMinor: 294882, status: "halted", needsAttention: true } }));
    wrap();
    expect(await screen.findByText(/Autopay stopped because the last payment failed/)).toBeDefined();
  });

  it("moves to a smaller plan or ends the subscription at the end of the period, and can take it back", async () => {
    api.scheduleBillingChange.mockResolvedValue({});
    api.keepBillingPlan.mockResolvedValue({});
    api.fetchBilling.mockResolvedValue(overview({ subscription: { planId: "business" } }));
    wrap({ plan: { id: "business", name: "Business", restricted: true, features: {} }, subscription: sub({ plan: "Business", planId: "business" }) as any });
    fireEvent.click(await screen.findByRole("button", { name: /Move to Growth at the end of the period/ }));
    await waitFor(() => expect(api.scheduleBillingChange).toHaveBeenCalledWith("growth"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "End my subscription" }));
    await waitFor(() => expect(api.scheduleBillingChange).toHaveBeenLastCalledWith("free"));
    cleanup();
    wrap({ plan: { id: "business", name: "Business", restricted: true, features: {} }, subscription: sub({ plan: "Business", planId: "business", status: "cancelling", scheduledPlan: { id: "free", name: "Free" } }) as any });
    expect(await screen.findByText(/Your plan ends on 1 Nov 2026/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Keep my plan" }));
    await waitFor(() => expect(api.keepBillingPlan).toHaveBeenCalled());
  });

  it("has nothing to change or end on the Free plan", async () => {
    api.fetchBilling.mockResolvedValue(overview({ subscription: { planId: "free" } }));
    wrap({ plan: { id: "free", name: "Free", restricted: true, features: {} }, subscription: sub({ status: "free", plan: "Free", planId: "free", periodEnd: null, cycle: null }) as any });
    await screen.findByRole("form", { name: "Billing details" });
    expect(screen.queryByText(/Change or end your plan/)).toBeNull();
  });
});
