import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({ fetchAdminPayments: vi.fn(), listPayments: vi.fn(), issueCompanyInvoice: vi.fn() }));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { OnlinePayments } from "../components/platform/OnlinePayments";
import { PaymentSheet } from "../components/platform/SubscriptionSheets";

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
});
afterEach(cleanup);

describe("online payments, for the platform admin", () => {
  it("shows payments that did not match first, with why, and the refunds", async () => {
    api.fetchAdminPayments.mockResolvedValue({
      payments: { configured: true, mode: "test" },
      counts: { paid: 2, mismatch: 1 },
      orders: [
        { id: "o1", company: "Acme", companyId: "t1", plan: "Growth", interval: "monthly", status: "paid", source: "checkout", totalMinor: 825882, failureReason: null, paymentId: "pay_1", createdAt: "2026-10-25T10:00:00Z" },
        { id: "o2", company: "Beta", companyId: "t2", plan: "Starter", interval: "annual", status: "mismatch", source: "checkout", totalMinor: 294882, failureReason: "Payment pay_2 did not match: amount 100 instead of 294882", paymentId: "pay_2", createdAt: "2026-10-24T10:00:00Z" },
      ],
      refunds: [{ id: "rfnd_1", company: "Acme", paymentId: "pay_1", amountMinor: 100000, currency: "INR", status: "created", at: "2026-10-25T11:00:00Z" }],
    });
    wrap(<OnlinePayments open onClose={() => {}} />);
    expect(await screen.findByText(/Online payment is on, in test mode/)).toBeDefined();
    const items = (await screen.findAllByRole("listitem")).filter((li) => li.textContent?.includes("Growth") || li.textContent?.includes("Starter"));
    expect(items[0].textContent).toContain("Beta");
    expect(items[0].textContent).toContain("did not match: amount 100 instead of 294882");
    expect(items[1].textContent).toContain("Acme");
    expect(within(screen.getByRole("region", { name: "Refunds" })).getByText(/does not remove a company's access/)).toBeDefined();
  });

  it("says online payment is off when the keys are not set", async () => {
    api.fetchAdminPayments.mockResolvedValue({ payments: { configured: false, mode: null }, counts: {}, orders: [], refunds: [] });
    wrap(<OnlinePayments open onClose={() => {}} />);
    expect(await screen.findByText(/Online payment is off: the Razorpay keys are not set/)).toBeDefined();
    expect(screen.getByText("No online payments yet.")).toBeDefined();
  });

  it("shows each recorded payment's invoice, and issues one for a rupee payment that has none", async () => {
    api.listPayments.mockResolvedValue([
      { id: "p1", plan: "Growth", cycle: "monthly", periodStart: "2026-10-25", periodEnd: "2026-11-25", amount: 8258.82, currency: "INR", reference: "NEFT-1", recordedBy: "Platform Administrator", recordedAt: "2026-10-25", source: "manual", invoice: null },
      { id: "p2", plan: "Growth", cycle: "monthly", periodStart: "2026-09-25", periodEnd: "2026-10-25", amount: 8258.82, currency: "INR", reference: "pay_9", recordedBy: "Online payment", recordedAt: "2026-09-25", source: "razorpay", invoice: { id: "i2", number: "SCZ/2026-27/00004" } },
      { id: "p3", plan: "Growth", cycle: "monthly", periodStart: "2026-08-25", periodEnd: "2026-09-25", amount: 799, currency: "AED", reference: "", recordedBy: "Platform Administrator", recordedAt: "2026-08-25", source: "manual", invoice: null },
    ]);
    api.issueCompanyInvoice.mockResolvedValue({});
    const company = { id: "t1", name: "Acme", plan: "Growth", planId: "growth", sessionsLimit: 10, subscription: { cycle: "monthly", periodEnd: "2026-11-25", scheduledPlan: null } } as any;
    wrap(<PaymentSheet company={company} plans={[]} busy={false} onClose={() => {}} onSubmit={() => {}} />);
    expect(await screen.findByText(/invoice SCZ\/2026-27\/00004/)).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Issue invoice" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Issue invoice" }));
    await waitFor(() => expect(api.issueCompanyInvoice).toHaveBeenCalledWith("t1", "p1"));
  });

  it("shows why an invoice could not be issued", async () => {
    api.listPayments.mockResolvedValue([{ id: "p1", plan: "Growth", cycle: "monthly", periodStart: "2026-10-25", periodEnd: "2026-11-25", amount: 8258.82, currency: "INR", reference: "", recordedBy: "x", recordedAt: "2026-10-25", source: "manual", invoice: null }]);
    api.issueCompanyInvoice.mockRejectedValue(new Error("The company has not saved its billing details yet, so there is no invoice."));
    const company = { id: "t1", name: "Acme", plan: "Growth", planId: "growth", sessionsLimit: 10, subscription: { cycle: "monthly", periodEnd: "2026-11-25", scheduledPlan: null } } as any;
    wrap(<PaymentSheet company={company} plans={[]} busy={false} onClose={() => {}} onSubmit={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: "Issue invoice" }));
    expect(await screen.findByText(/has not saved its billing details/)).toBeDefined();
  });
});
