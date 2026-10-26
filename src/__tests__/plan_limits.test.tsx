import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  getStoredTenantId: () => "t1",
  listPlans: vi.fn(),
  updatePlan: vi.fn(),
  fetchBillingSettings: vi.fn(),
  fetchContacts: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  fetchLabels: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { PlanUsageBlock } from "../components/admin/PlanCard";
import { SubscriptionsModule } from "../components/platform/SubscriptionsModule";
import { Contacts } from "../components/user/Contacts";
import type { PlanUsage } from "../services/api";

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const usage = (contacts: Partial<PlanUsage["contacts"]> = {}, broadcasts: Partial<PlanUsage["broadcasts"]> = {}): PlanUsage => ({
  plan: "Growth",
  contacts: { used: 10, limit: 100, state: "ok", ...contacts },
  broadcasts: { used: 0, limit: null, state: "unlimited", resets: "1 November", ...broadcasts },
});

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
});
afterEach(cleanup);

describe("what the plan allows", () => {
  it("shows contacts and broadcasts against the limit, and says nothing when there is no limit", () => {
    const { container, rerender } = render(<PlanUsageBlock usage={usage({ used: 40, limit: 100 }, { used: 1, limit: 4 })} />);
    const block = within(screen.getByTestId("plan-usage"));
    expect(block.getByText("Contacts")).toBeDefined();
    expect(block.getByText("Broadcasts started this month")).toBeDefined();
    expect(block.getByText("Starts again on 1 November.")).toBeDefined();
    expect(block.getByRole("img", { name: "Contacts: 40% of the plan's limit used" })).toBeDefined();
    expect(block.queryByRole("alert")).toBeNull();
    expect(block.queryByRole("status")).toBeNull();
    rerender(<PlanUsageBlock usage={usage({ used: 5, limit: null, state: "unlimited" })} />);
    expect(container.textContent).toBe("");
    rerender(<PlanUsageBlock />);
    expect(container.textContent).toBe("");
  });

  it("warns at 80% and again at the limit, in words that say what still works", () => {
    const { rerender } = render(<PlanUsageBlock usage={usage({ used: 85, limit: 100, state: "near" })} />);
    expect(screen.getByRole("status").textContent).toBe("You are using 85 of your 100 contacts. Choose a bigger plan below before you reach the limit.");
    rerender(<PlanUsageBlock usage={usage({ used: 100, limit: 100, state: "full" })} />);
    expect(screen.getByRole("alert").textContent).toContain("You have reached your contact limit");
    expect(screen.getByRole("alert").textContent).toContain("Customers can still message you and nothing is deleted");
    rerender(<PlanUsageBlock usage={usage({}, { used: 4, limit: 4, state: "full" })} />);
    expect(screen.getByRole("alert").textContent).toBe("You have started all 4 broadcasts your plan includes this month. You can start more from 1 November, or choose a bigger plan below.");
    rerender(<PlanUsageBlock usage={usage({}, { used: 3, limit: 4, state: "near" })} />);
    expect(screen.getByRole("status").textContent).toBe("You have started 3 of your 4 broadcasts this month.");
  });
});

describe("the services and limits of a plan", () => {
  const settings = { settings: { sacCode: "998314", gstRate: 18, invoicePrefix: "SCZ" }, history: [] };
  const open = async () => {
    wrap(<SubscriptionsModule />);
    fireEvent.click(await screen.findByRole("tab", { name: "Services & limits" }));
  };
  beforeEach(() => api.fetchBillingSettings.mockResolvedValue(settings));
  const plan = (over = {}) => ({
    id: "growth", name: "Growth", numbers: 10, seats: null, maxContacts: null, maxBroadcasts: null, trialDays: 0, isActive: true, taxMode: "exclusive", aiDaily: 300,
    features: [{ key: "broadcasts", label: "Broadcasts", included: true }], prices: [], ...over,
  });

  it("sets the contacts and broadcasts a plan includes, and blank means no limit", async () => {
    api.listPlans.mockResolvedValue([plan()]);
    api.updatePlan.mockResolvedValue({});
    await open();
    const section = within(await screen.findByRole("region", { name: "Growth plan" }));
    fireEvent.change(section.getByLabelText("growth contacts"), { target: { value: "5000" } });
    fireEvent.change(section.getByLabelText("growth broadcasts a month"), { target: { value: "20" } });
    fireEvent.click(section.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(api.updatePlan).toHaveBeenCalledWith("growth", expect.objectContaining({ maxContacts: 5000, maxBroadcasts: 20 })));
    cleanup();
    api.updatePlan.mockClear();
    api.listPlans.mockResolvedValue([plan({ maxContacts: 5000, maxBroadcasts: 20 })]);
    await open();
    const again = within(await screen.findByRole("region", { name: "Growth plan" }));
    expect((again.getByLabelText("growth contacts") as HTMLInputElement).value).toBe("5000");
    fireEvent.change(again.getByLabelText("growth contacts"), { target: { value: "" } });
    fireEvent.change(again.getByLabelText("growth broadcasts a month"), { target: { value: "" } });
    fireEvent.click(again.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(api.updatePlan).toHaveBeenCalledWith("growth", expect.objectContaining({ maxContacts: null, maxBroadcasts: null })));
  });

  it("shows the server's reason when a limit is refused", async () => {
    api.listPlans.mockResolvedValue([plan()]);
    api.updatePlan.mockRejectedValue(new Error("Contacts must be a whole number from 1 to 100000000, or blank"));
    await open();
    const section = within(await screen.findByRole("region", { name: "Growth plan" }));
    fireEvent.change(section.getByLabelText("growth contacts"), { target: { value: "0" } });
    fireEvent.click(section.getByRole("button", { name: /Save/ }));
    expect(await section.findByText(/Contacts must be a whole number/)).toBeDefined();
  });
});

describe("the contacts page near the limit", () => {
  beforeEach(() => {
    api.fetchContacts.mockResolvedValue({ contacts: [], nextCursor: null });
    api.fetchLabels.mockResolvedValue([]);
  });
  const page = (u?: PlanUsage, onOpenPlan?: () => void) => wrap(<Contacts onSelectChat={vi.fn()} usage={u} onOpenPlan={onOpenPlan} />);

  it("warns when 80% is used and again at the limit, with a way to the plans", async () => {
    const onOpenPlan = vi.fn();
    page(usage({ used: 85, limit: 100, state: "near" }), onOpenPlan);
    expect((await screen.findByRole("status")).textContent).toContain("You are using 85 of the 100 contacts your Growth plan includes.");
    fireEvent.click(screen.getByRole("button", { name: "See plans" }));
    expect(onOpenPlan).toHaveBeenCalled();
    cleanup();
    page(usage({ used: 100, limit: 100, state: "full" }));
    expect((await screen.findByRole("alert")).textContent).toContain("You have reached the 100 contacts your Growth plan includes. You can't add more until you remove some or choose a bigger plan. Customers can still message you.");
    expect(screen.queryByRole("button", { name: "See plans" })).toBeNull();
  });

  it("says nothing when there is plenty of room, or no limit", async () => {
    page(usage({ used: 10, limit: 100, state: "ok" }));
    await screen.findByText("Contacts");
    expect(screen.queryByText(/contacts your Growth plan includes/)).toBeNull();
    cleanup();
    page(undefined);
    await screen.findByText("Contacts");
    expect(screen.queryByText(/contacts your/)).toBeNull();
  });
});
