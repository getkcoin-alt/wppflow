import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  listCompanies: vi.fn(),
  listPlans: vi.fn(),
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
import { PlanCard } from "../components/admin/PlanCard";
import { addCycle, defaultPeriodStart, describeSubscription, needsAttention, type Subscription } from "../utils/subscription";

const day = (offset: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const TODAY = day(0);
const sub = (over: Partial<Subscription> = {}): Subscription => ({
  status: "active", plan: "Growth", planId: "growth", cycle: "monthly", periodStart: day(-10), periodEnd: day(20), daysLeft: 20, scheduledPlan: null, ...over,
});

const feature = (key: string, label: string, included: boolean) => ({ key, label, included });
const features = (on: string[]) => ["broadcasts", "automations", "audit", "api", "ai"].map((k) => feature(k, k, on.includes(k)));
const PLANS = [
  { id: "free", name: "Free", numbers: 1, seats: 1, features: features([]), aiDaily: null },
  { id: "starter", name: "Starter", numbers: 3, seats: null, features: features([]), aiDaily: null },
  { id: "growth", name: "Growth", numbers: 10, seats: null, features: features(["broadcasts", "ai"]), aiDaily: 300 },
  { id: "business", name: "Business", numbers: 25, seats: null, features: features(["broadcasts", "ai", "api"]), aiDaily: 300 },
  { id: "enterprise", name: "Enterprise", numbers: null, seats: null, features: features(["broadcasts", "ai", "api"]), aiDaily: 300 },
];
const company = (over = {}) => ({
  id: "g1", name: "Globex", plan: "Growth", planId: "growth", status: "active", sessionsLimit: 10, staffCount: 2, sessionsCount: 1, connectedSessions: 1,
  createdAt: "2026-10-01", owner: { name: "Hank", email: "hank@globex.test", activated: true }, subscription: sub(), ...over,
});

describe("how a subscription is described", () => {
  it("says nothing for plans with nothing to pay", () => {
    expect(describeSubscription(sub({ status: "free" }), "company")).toBeNull();
    expect(describeSubscription(sub({ status: "legacy" }), "platform")).toBeNull();
    expect(describeSubscription(undefined, "company")).toBeNull();
  });
  it("tells the company when it renews, and the platform the same in its own words", () => {
    const end = new Date(`${day(20)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    expect(describeSubscription(sub(), "company")).toMatchObject({ tone: "ok", label: `Renews ${end}` });
    expect(describeSubscription(sub({ status: "due_soon", daysLeft: 9 }), "company")?.detail).toContain("in 9 days");
    expect(describeSubscription(sub({ status: "due_soon", daysLeft: 0 }), "platform")?.label).toBe("Renews today");
    expect(describeSubscription(sub({ status: "due_soon", daysLeft: 1 }), "platform")?.label).toBe("Renews in 1 day");
  });
  it("is plain about being overdue: everything works until the grace period ends", () => {
    const overdue = sub({ status: "overdue", daysLeft: -3, periodEnd: day(-3), graceEndsOn: day(4) });
    expect(describeSubscription(overdue, "company")).toMatchObject({ label: "Payment overdue", tone: "danger" });
    expect(describeSubscription(overdue, "company")?.detail).toContain("3 days ago");
    expect(describeSubscription(overdue, "company")?.detail).toContain("Everything keeps working");
    expect(describeSubscription(overdue, "platform")?.detail).toContain("switch off after");
  });
  it("says the paid features are off once the grace period is over, and that nothing was deleted", () => {
    const expired = sub({ status: "expired", daysLeft: -9, periodEnd: day(-9), graceEndsOn: day(-2), lapsed: true });
    expect(describeSubscription(expired, "company")).toMatchObject({ label: "Paid features off", tone: "danger" });
    expect(describeSubscription(expired, "company")?.detail).toContain("untouched");
    expect(describeSubscription(expired, "platform")?.detail).toContain("grace period is over");
  });
  it("explains a change at the end of the period", () => {
    const moving = describeSubscription(sub({ status: "changing", scheduledPlan: { id: "starter", name: "Starter" } }), "company");
    expect(moving?.label).toBe("Moves to Starter");
    expect(moving?.detail).toContain("Nothing is deleted");
    const ending = describeSubscription(sub({ status: "cancelling", scheduledPlan: { id: "free", name: "Free" } }), "company");
    expect(ending?.detail).toContain("Free plan: one WhatsApp number and one person");
  });
  it("asks for a payment on a paid plan that has none", () => {
    expect(describeSubscription(sub({ status: "unrecorded", periodEnd: null }), "company")?.detail).toContain("If you have paid");
  });
  it("works out a renewal date the way the server does", () => {
    expect(addCycle("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(addCycle("2028-02-29", "annual")).toBe("2029-02-28");
    expect(defaultPeriodStart(day(-5))).toBe(day(-5));
    expect(defaultPeriodStart(day(-90))).toBe(TODAY);
    expect(defaultPeriodStart(null)).toBe(TODAY);
  });
  it("picks out who needs attention", () => {
    expect(needsAttention(sub({ status: "overdue", daysLeft: -1 }), "overdue")).toBe(true);
    expect(needsAttention(sub({ status: "expired", daysLeft: -9 }), "overdue")).toBe(true);
    expect(needsAttention(sub(), "overdue")).toBe(false);
    expect(needsAttention(sub({ status: "due_soon", daysLeft: 9 }), "soon")).toBe(true);
    expect(needsAttention(sub({ status: "cancelling", daysLeft: 20 }), "soon")).toBe(false);
    expect(needsAttention(sub({ status: "unrecorded", periodEnd: null, daysLeft: null }), "unrecorded")).toBe(true);
    expect(needsAttention(undefined, "all")).toBe(true);
  });
});

describe("the company's plan card shows the subscription", () => {
  const plan = { name: "Growth", restricted: true, seats: null, features: { broadcasts: true, ai: true } };
  it("shows billing, the renewal date and when", () => {
    render(<PlanCard plan={plan} subscription={sub({ status: "due_soon", daysLeft: 5 })} />);
    const box = within(screen.getByTestId("subscription"));
    expect(box.getByText(/Billing: monthly, paid in advance/)).toBeDefined();
    expect(box.getByText(/Renews in 5 days/)).toBeDefined();
    expect(box.getByText(/sends the invoice or payment link/)).toBeDefined();
  });
  it("is silent on the Free plan and for staff, who are not sent a subscription", () => {
    const { rerender } = render(<PlanCard plan={plan} subscription={sub({ status: "free" })} />);
    expect(screen.queryByTestId("subscription")).toBeNull();
    rerender(<PlanCard plan={plan} />);
    expect(screen.queryByTestId("subscription")).toBeNull();
  });
  it("flags an overdue payment", () => {
    render(<PlanCard plan={plan} subscription={sub({ status: "overdue", daysLeft: -2, cycle: "annual" })} />);
    const box = within(screen.getByTestId("subscription"));
    expect(box.getByText(/yearly/)).toBeDefined();
    expect(box.getByText("Payment overdue")).toBeDefined();
  });
});

describe("the platform admin's subscriptions", () => {
  const wrap = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <PlatformAdmin adminName="Root" onLogout={() => {}} />
      </QueryClientProvider>,
    );
  const LIST = () => [
    company(),
    company({ id: "o1", name: "Overdue Ltd", subscription: sub({ status: "overdue", daysLeft: -4, periodEnd: day(-4) }) }),
    company({ id: "s1", name: "Soon Ltd", subscription: sub({ status: "due_soon", daysLeft: 6, periodEnd: day(6) }) }),
    company({ id: "n1", name: "Fresh Ltd", plan: "Starter", planId: "starter", sessionsLimit: 3, subscription: sub({ status: "unrecorded", plan: "Starter", planId: "starter", cycle: null, periodStart: null, periodEnd: null, daysLeft: null }) }),
    company({ id: "f1", name: "Free Ltd", plan: "Free", planId: "free", sessionsLimit: 1, subscription: sub({ status: "free", plan: "Free", planId: "free" }) }),
  ];
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset();
    api.listPlans.mockResolvedValue(PLANS);
    api.listCompanies.mockResolvedValue(LIST());
    api.listPayments.mockResolvedValue([]);
  });
  afterEach(cleanup);

  it("counts who is overdue, who renews soon and who has no payment, and filters to them", async () => {
    wrap();
    await screen.findByText("Globex");
    const group = within(screen.getByRole("group", { name: "Show companies" }));
    expect(group.getByRole("button", { name: /Payment overdue 1/ })).toBeDefined();
    expect(group.getByRole("button", { name: /Renewing in 14 days 1/ })).toBeDefined();
    expect(group.getByRole("button", { name: /No payment recorded 1/ })).toBeDefined();
    fireEvent.click(group.getByRole("button", { name: /Payment overdue/ }));
    expect(screen.getByText("Overdue Ltd")).toBeDefined();
    expect(screen.queryByText("Globex")).toBeNull();
    expect(group.getByRole("button", { name: /Payment overdue/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(group.getByRole("button", { name: /^All/ }));
    expect(screen.getByText("Globex")).toBeDefined();
  });

  it("shows each company's subscription, and none for the Free plan", async () => {
    wrap();
    await screen.findByText("Globex");
    expect(within(screen.getByTestId("sub-o1")).getByText("Payment overdue")).toBeDefined();
    expect(within(screen.getByTestId("sub-s1")).getByText(/Renews in 6 days/)).toBeDefined();
    expect(within(screen.getByTestId("sub-n1")).getByText("No payment recorded")).toBeDefined();
    expect(screen.queryByTestId("sub-f1")).toBeNull();
  });

  it("records a payment: the form starts where the last period ended, and the renewal date follows the cycle", async () => {
    api.recordPayment.mockResolvedValue({ company: company({ subscription: sub({ periodEnd: addCycle(day(20), "monthly") }) }), warnings: [] });
    api.listPayments.mockResolvedValue([
      { id: "p1", plan: "Growth", cycle: "monthly", periodStart: day(-10), periodEnd: day(20), amount: 799, currency: "AED", reference: "INV-1042", recordedBy: "Root", recordedAt: "2026-10-01" },
    ]);
    wrap();
    await screen.findByText("Globex");
    const row = within(screen.getByText("Globex").closest("li") as HTMLElement);
    fireEvent.click(row.getByRole("button", { name: "Record payment" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Record a payment for Globex" }));
    expect((dialog.getByLabelText("Plan") as HTMLSelectElement).value).toBe("growth");
    expect((dialog.getByLabelText("Period starts") as HTMLInputElement).value).toBe(day(20));
    expect((dialog.getByLabelText("Renews on") as HTMLInputElement).value).toBe(addCycle(day(20), "monthly"));
    expect(await dialog.findByText(/INV-1042/)).toBeDefined();
    // the cycle moves the renewal date while it has not been typed by hand
    fireEvent.change(dialog.getByLabelText("Billing"), { target: { value: "annual" } });
    expect((dialog.getByLabelText("Renews on") as HTMLInputElement).value).toBe(addCycle(day(20), "annual"));
    fireEvent.change(dialog.getByLabelText("Renews on"), { target: { value: "2027-01-15" } });
    fireEvent.change(dialog.getByLabelText("Billing"), { target: { value: "monthly" } });
    expect((dialog.getByLabelText("Renews on") as HTMLInputElement).value).toBe("2027-01-15");
    fireEvent.change(dialog.getByLabelText("Amount received"), { target: { value: "799" } });
    fireEvent.change(dialog.getByLabelText("Invoice or payment reference"), { target: { value: "INV-1043" } });
    fireEvent.click(dialog.getByRole("button", { name: "Record payment" }));
    await waitFor(() =>
      expect(api.recordPayment).toHaveBeenCalledWith("g1", {
        plan: "growth", cycle: "monthly", periodStart: day(20), periodEnd: "2027-01-15", amount: 799, currency: "AED", reference: "INV-1043",
      }),
    );
    expect(await screen.findByText(/Payment recorded for Globex/)).toBeDefined();
  });

  it("asks for the number limit when the payment is for Enterprise, and reports what a smaller plan leaves", async () => {
    api.recordPayment.mockResolvedValue({ company: company({ plan: "Enterprise", subscription: sub({ plan: "Enterprise", periodEnd: day(30) }) }), warnings: ["Enterprise note."] });
    wrap();
    await screen.findByText("Globex");
    fireEvent.click(within(screen.getByText("Globex").closest("li") as HTMLElement).getByRole("button", { name: "Record payment" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Record a payment for Globex" }));
    expect(dialog.queryByLabelText("WhatsApp number limit")).toBeNull();
    expect(Array.from((dialog.getByLabelText("Plan") as HTMLSelectElement).options).map((o) => o.textContent)).toEqual(["Choose a plan…", "Starter", "Growth", "Business", "Enterprise"]);
    fireEvent.change(dialog.getByLabelText("Plan"), { target: { value: "enterprise" } });
    fireEvent.change(dialog.getByLabelText("WhatsApp number limit"), { target: { value: "80" } });
    fireEvent.click(dialog.getByRole("button", { name: "Record payment" }));
    await waitFor(() => expect(api.recordPayment).toHaveBeenCalledWith("g1", expect.objectContaining({ plan: "enterprise", sessionsLimit: 80 })));
    expect(await screen.findByText(/Enterprise note\./)).toBeDefined();
  });

  it("shows why a payment was refused", async () => {
    api.recordPayment.mockRejectedValue(new Error("The renewal date must be after the day the period starts"));
    wrap();
    await screen.findByText("Globex");
    fireEvent.click(within(screen.getByText("Globex").closest("li") as HTMLElement).getByRole("button", { name: "Record payment" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Record a payment for Globex" }));
    fireEvent.click(dialog.getByRole("button", { name: "Record payment" }));
    expect(await screen.findByText(/must be after the day the period starts/)).toBeDefined();
  });

  it("schedules a smaller plan or Free for the end of the period, and can take it back", async () => {
    api.scheduleSubscriptionChange.mockResolvedValue({ company: company({ subscription: sub({ status: "changing", scheduledPlan: { id: "starter", name: "Starter" } }) }) });
    wrap();
    await screen.findByText("Globex");
    fireEvent.click(within(screen.getByText("Globex").closest("li") as HTMLElement).getByRole("button", { name: "Change at period end" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Change Globex at the end of the period" }));
    expect(Array.from((dialog.getByLabelText("Then move to") as HTMLSelectElement).options).map((o) => o.textContent)).toEqual([
      "Choose…", "Free (cancel the subscription)", "Starter",
    ]);
    fireEvent.change(dialog.getByLabelText("Then move to"), { target: { value: "starter" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule the change" }));
    await waitFor(() => expect(api.scheduleSubscriptionChange).toHaveBeenCalledWith("g1", "starter"));
    expect(await screen.findByText(/Globex will move to Starter when the period ends/)).toBeDefined();
  });

  it("a company with a change waiting offers to cancel it instead", async () => {
    api.listCompanies.mockResolvedValue([company({ subscription: sub({ status: "cancelling", scheduledPlan: { id: "free", name: "Free" } }) })]);
    api.clearSubscriptionChange.mockResolvedValue({});
    wrap();
    await screen.findByText("Globex");
    const row = within(screen.getByText("Globex").closest("li") as HTMLElement);
    expect(row.queryByRole("button", { name: "Change at period end" })).toBeNull();
    fireEvent.click(row.getByRole("button", { name: "Cancel scheduled change" }));
    await waitFor(() => expect(api.clearSubscriptionChange).toHaveBeenCalledWith("g1"));
  });

  it("offers no payment for the Free plan, and no schedule before a payment is on record", async () => {
    wrap();
    await screen.findByText("Free Ltd");
    const free = within(screen.getByText("Free Ltd").closest("li") as HTMLElement);
    expect(free.queryByRole("button", { name: "Record payment" })).toBeNull();
    expect(free.queryByRole("button", { name: "Change at period end" })).toBeNull();
    const fresh = within(screen.getByText("Fresh Ltd").closest("li") as HTMLElement);
    expect(fresh.getByRole("button", { name: "Record payment" })).toBeDefined();
    expect(fresh.queryByRole("button", { name: "Change at period end" })).toBeNull();
  });
});
