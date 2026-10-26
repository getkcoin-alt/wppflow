import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  listCompanies: vi.fn(),
  listPlans: vi.fn(),
  fetchPublicPlans: vi.fn(),
  updatePlan: vi.fn(),
  fetchBillingSettings: vi.fn(),
  fetchPlanChanges: vi.fn(),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  resendOwnerCredentials: vi.fn(),
  listPayments: vi.fn(),
  recordPayment: vi.fn(),
  scheduleSubscriptionChange: vi.fn(),
  clearSubscriptionChange: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { PlatformAdmin } from "../components/platform/PlatformAdmin";
import { PlanCompare } from "../components/admin/PlanCompare";
import { FeatureLocked } from "../components/ui/FeatureLocked";
import { formatMinor, currencyForZone } from "../utils/money";

const feat = (key: string, label: string, included: boolean) => ({ key, label, included });
const features = (on: string[]) => [feat("broadcasts", "Broadcasts", on.includes("broadcasts")), feat("ai", "The AI assistant", on.includes("ai"))];
const price = (interval: "monthly" | "annual", currency: "INR" | "AED", amountMinor: number) => ({ interval, currency, amountMinor });
const PUBLIC = [
  { id: "free", name: "Free", numbers: 1, seats: 1, taxMode: "exclusive", prices: [], features: features([]) },
  {
    id: "growth",
    name: "Growth",
    numbers: 10,
    seats: null,
    taxMode: "exclusive",
    prices: [price("monthly", "INR", 499900), price("annual", "INR", 4999000), price("monthly", "AED", 24900), price("annual", "AED", 249000)],
    features: features(["broadcasts", "ai"]),
  },
  { id: "enterprise", name: "Enterprise", numbers: null, seats: null, taxMode: "exclusive", prices: [], features: features(["broadcasts", "ai"]) },
];
const ADMIN_PLANS = PUBLIC.map((p) => ({ ...p, isActive: true, trialDays: 0, maxContacts: null, aiDaily: null }));

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.fetchPublicPlans.mockResolvedValue(PUBLIC);
  api.listPlans.mockResolvedValue(ADMIN_PLANS);
  api.listCompanies.mockResolvedValue([]);
  api.updatePlan.mockResolvedValue(ADMIN_PLANS[1]);
  api.fetchBillingSettings.mockResolvedValue({ settings: { sacCode: "998314", gstRate: 18, invoicePrefix: "SCZ" }, history: [] });
  api.fetchPlanChanges.mockResolvedValue([]);
});
afterEach(cleanup);

describe("money", () => {
  it("shows rupees and dirhams from the smallest unit", () => {
    expect(formatMinor(499900, "INR")).toBe("₹4,999");
    expect(formatMinor(24900, "AED")).toContain("249");
    expect(formatMinor(150, "INR")).toContain("1.50");
  });
  it("shows rupees first only to visitors in India", () => {
    expect(currencyForZone("Asia/Kolkata")).toBe("INR");
    expect(currencyForZone("Asia/Dubai")).toBe("AED");
    expect(currencyForZone("Europe/London")).toBe("AED");
  });
});

describe("comparing plans", () => {
  it("shows monthly and yearly prices, with GST on rupees, and marks the current plan", async () => {
    wrap(<PlanCompare currentPlanId="growth" />);
    const growth = within(await screen.findByRole("article", { name: "Growth" }));
    fireEvent.click(screen.getByRole("tab", { name: /INR/ }));
    expect(growth.getByText("Your plan")).toBeDefined();
    expect(growth.getByText("₹4,999")).toBeDefined();
    expect(growth.getByText(/plus 18% GST/)).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Yearly" }));
    expect(growth.getByText("₹49,990")).toBeDefined();
    expect(within(screen.getByRole("article", { name: "Free" })).getAllByText("Free").length).toBe(2);
    expect(within(screen.getByRole("article", { name: "Enterprise" })).getByText("Custom")).toBeDefined();
  });
  it("says online payment in dirhams is coming soon and offers no pay button for it", async () => {
    wrap(<PlanCompare renderAction={(p, i, c) => <button>{`Pay ${p.id} ${i} ${c}`}</button>} />);
    await screen.findByRole("article", { name: "Growth" });
    fireEvent.click(screen.getByRole("tab", { name: /INR/ }));
    expect(screen.getByRole("button", { name: "Pay growth monthly INR" })).toBeDefined();
    expect(screen.queryByTestId("aed-note")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "AED" }));
    expect(screen.getByTestId("aed-note").textContent).toContain("coming soon");
  });
});

describe("the platform plan editor", () => {
  it("saves a changed price in the smallest unit and says it applies at once", async () => {
    wrap(<PlatformAdmin adminName="Root" onLogout={() => {}} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Subscriptions" }));
    const price = await screen.findByLabelText("growth monthly INR");
    expect((price as HTMLInputElement).value).toBe("4999");
    fireEvent.change(price, { target: { value: "5499.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Growth rates" }));
    await waitFor(() => expect(api.updatePlan).toHaveBeenCalled());
    const [code, body] = api.updatePlan.mock.calls[0];
    expect(code).toBe("growth");
    expect(body.features).toBeUndefined();
    expect(body.prices).toContainEqual({ interval: "monthly", currency: "INR", amountMinor: 549950 });
    expect(body.prices).toContainEqual({ interval: "annual", currency: "AED", amountMinor: 249000 });
    expect((await screen.findByRole("status")).textContent).toContain("applies to every new order");
  });
  it("shows the server's reason when a change is refused", async () => {
    api.updatePlan.mockRejectedValue(new Error("There are two monthly INR prices"));
    wrap(<PlatformAdmin adminName="Root" onLogout={() => {}} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Subscriptions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save Growth rates" }));
    expect(await screen.findByText(/two monthly INR prices/)).toBeDefined();
  });
  it("has no price fields for the Free plan", async () => {
    wrap(<PlatformAdmin adminName="Root" onLogout={() => {}} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Subscriptions" }));
    await screen.findByLabelText("growth monthly INR");
    expect(screen.queryByLabelText("free monthly INR")).toBeNull();
  });
});

describe("a screen switched off for a late payment", () => {
  it("says so, and takes an owner to the plan", () => {
    const open = vi.fn();
    render(<FeatureLocked feature="Broadcasts" plan="Growth" needs="Growth" lapsed onOpenPlan={open} />);
    expect(screen.getByText(/off until the payment is received/)).toBeDefined();
    expect(screen.getByText(/Nothing has been deleted/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    expect(open).toHaveBeenCalled();
  });
  it("asks for a bigger plan when the feature was never included", () => {
    render(<FeatureLocked feature="Broadcasts" plan="Starter" needs="Growth" />);
    expect(screen.getByText(/part of the Growth plan/)).toBeDefined();
    expect(screen.getByRole("link", { name: "See the plans" })).toBeDefined();
  });
});
