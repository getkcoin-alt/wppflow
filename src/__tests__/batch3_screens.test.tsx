import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  getStoredTenantId: () => "t1",
  fetchAssignment: vi.fn(),
  saveAssignment: vi.fn(),
  fetchPlatformOverview: vi.fn(),
  fetchPlatformNumberHealth: vi.fn(),
  fetchBillingAudit: vi.fn(),
  fetchSupportSessions: vi.fn(),
  startSupportSession: vi.fn(),
  endSupportSession: vi.fn(),
  fetchSupportSection: vi.fn(),
  fetchSupportAccess: vi.fn(),
  listCompanies: vi.fn(),
  listPlans: vi.fn(),
  fetchAdminPayments: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { SessionManager } from "../components/user/SessionManager";
import { Inbox } from "../components/user/Inbox";
import { AssignmentRule } from "../components/user/AssignmentRule";
import { BillingAuditSheet, NumberHealthSheet, OverviewSheet, SupportSheet } from "../components/platform/PlatformConsole";
import { SupportAccessCard } from "../components/admin/SupportAccessCard";
import { PlatformAdmin } from "../components/platform/PlatformAdmin";
import { describeRule, sayDays } from "../utils/assignment";
import type { NumberHealthRow } from "../services/api";
import type { WhatsAppSession } from "../types";

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

const health = (over: Partial<NumberHealthRow> = {}): NumberHealthRow => ({
  sessionName: "sam-line", label: "Sam's number", phone: "…0001", status: "CONNECTED", ownerUserId: 2, ownerName: "Sam",
  lastError: null, lastHeartbeatAt: ago(40), lastHeartbeatOkAt: ago(40), heartbeatFailures: 0, heartbeatError: null,
  connectedSince: ago(3 * 3600), downSince: null, reconnectAttempts: 0, lastReconnectAt: null,
  sends: { sentLast24h: 12, failedLast24h: 0, failedLastHour: 0, totalLastHour: 3 }, queued: { count: 0, oldestSeconds: null },
  level: "ok", problems: [], ...over,
});
const session = (over: Partial<WhatsAppSession> = {}): WhatsAppSession =>
  ({ id: "s1", sessionKey: "sam-line", displayName: "Sam's number", name: "Sam's number", status: "CONNECTED", phone: "971500000001", ownerName: "Sam", ...over }) as WhatsAppSession;
const manager = (health: Record<string, NumberHealthRow>) =>
  wrap(<SessionManager sessions={[session()]} onAddSession={vi.fn()} onRestartSession={vi.fn()} onDeleteSession={vi.fn()} isPairModalOpen={false} setIsPairModalOpen={vi.fn()} canManage health={health} />);

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
});
afterEach(cleanup);

describe("how each number is doing", () => {
  it("says a healthy number is healthy, with when it was last asked and how long it has been up", () => {
    manager({ "sam-line": health() });
    const block = within(screen.getByRole("region", { name: "Health of Sam's number" }));
    expect(block.getByText("Healthy")).toBeDefined();
    expect(block.getByText("Last check").nextSibling?.textContent).toBe("just now");
    expect(block.getByText("Connected for").nextSibling?.textContent).toBe("3.0 h");
    expect(block.getByText("Failed sends, last 24 h").nextSibling?.textContent).toBe("0");
    expect(block.queryByText("Reconnect attempts")).toBeNull();
  });

  it("says what is wrong in the server's words, with failed and waiting messages", () => {
    manager({
      "sam-line": health({
        level: "warn",
        problems: [{ code: "failing", text: "6 of the last 8 messages sent in the past hour did not go through." }],
        sends: { sentLast24h: 2, failedLast24h: 9, failedLastHour: 6, totalLastHour: 8 },
        queued: { count: 3, oldestSeconds: 720 },
      }),
    });
    const block = within(screen.getByRole("region", { name: "Health of Sam's number" }));
    expect(block.getByText("Needs a look")).toBeDefined();
    expect(block.getByText(/6 of the last 8 messages/)).toBeDefined();
    expect(block.getByText("9").className).toContain("text-danger");
    expect(block.getByText(/3 · oldest 12 min/).className).toContain("text-danger");
  });

  it("shows a number that is down, how often the server tried, and that it has not been checked", () => {
    manager({
      "sam-line": health({ status: "DISCONNECTED", level: "down", lastHeartbeatAt: null, connectedSince: null, reconnectAttempts: 4, problems: [{ code: "down", text: "Not connected for 2 hours. The server has tried to bring it back 4 times." }] }),
    });
    const block = within(screen.getByRole("region", { name: "Health of Sam's number" }));
    expect(block.getByText("Down")).toBeDefined();
    expect(block.getByText(/Not connected for 2 hours/).className).toContain("text-danger");
    expect(block.getByText("Last check").nextSibling?.textContent).toBe("Not checked yet");
    expect(block.getByText("Reconnect attempts").nextSibling?.textContent).toBe("4");
    expect(block.queryByText("Connected for")).toBeNull();
  });

  it("shows nothing for a number still being linked, or before the data has arrived", () => {
    manager({ "sam-line": health({ level: "unpaired" }) });
    expect(screen.queryByRole("region", { name: /Health of/ })).toBeNull();
    cleanup();
    manager({});
    expect(screen.queryByRole("region", { name: /Health of/ })).toBeNull();
  });
});

describe("taking new chats", () => {
  const chat = { id: "c1", contactId: "k1", contactName: "Aisha", phone: "971500000001", avatar: "", unreadCount: 0, isGroup: false, channel: "sam-line", assignedTo: "", tags: [], lastMessage: { text: "hi", timestamp: "10:00 AM", status: "delivered", fromMe: false } };
  const inbox = (extra: Partial<React.ComponentProps<typeof Inbox>> = {}) =>
    wrap(<Inbox chats={[chat as any]} messages={{}} contacts={{}} cannedReplies={[]} sessions={[]} selectedChatId="c1" onSendMessage={vi.fn()} onSendAttachment={vi.fn()} onAssignAgent={vi.fn()} onToggleResolve={vi.fn()} onOpenChat={vi.fn()} onSyncInbox={vi.fn()} {...extra} />);

  it("lets a person in the company's rotation switch themselves away and back", () => {
    const onSetAvailable = vi.fn();
    inbox({ availability: { available: true, inRotation: true }, onSetAvailable });
    const toggle = screen.getByRole("switch", { name: "Taking new chats" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    expect(onSetAvailable).toHaveBeenCalledWith(false);
    cleanup();
    inbox({ availability: { available: false, inRotation: true }, onSetAvailable });
    expect(screen.getByRole("switch", { name: "Taking new chats" }).textContent).toContain("Away: no new chats");
    fireEvent.click(screen.getByRole("switch", { name: "Taking new chats" }));
    expect(onSetAvailable).toHaveBeenLastCalledWith(true);
  });

  it("is not shown to someone who is not in the rotation", () => {
    inbox({ availability: { available: true, inRotation: false }, onSetAvailable: vi.fn() });
    expect(screen.queryByRole("switch", { name: "Taking new chats" })).toBeNull();
    cleanup();
    inbox({});
    expect(screen.queryByRole("switch", { name: "Taking new chats" })).toBeNull();
  });
});

describe("the rule for new chats", () => {
  const settings = (over: Record<string, unknown> = {}) => ({
    enabled: false, mode: "round_robin", team: "", sessionNames: [], keepOwner: true, maxOpen: null, useHours: false, timezone: "Asia/Kolkata", workDays: [1, 2, 3, 4, 5], workStart: "09:00", workEnd: "18:00",
    members: [
      { id: 1, name: "Olivia Owner", role: "owner", team: "general", inRotation: false, available: true, openChats: 2 },
      { id: 2, name: "Sam Agent", role: "agent", team: "sales", inRotation: false, available: true, openChats: 0 },
      { id: 3, name: "Tina Agent", role: "agent", team: "support", inRotation: false, available: false, openChats: 5 },
    ],
    teams: ["general", "sales", "support"],
    numbers: [{ sessionName: "shared-line", phone: "971500000000", ownerName: null }, { sessionName: "sam-line", phone: "971500000001", ownerName: "Sam" }],
    ...over,
  });

  it("says in a sentence what it does, and that it is off until it is set up", async () => {
    api.fetchAssignment.mockResolvedValue(settings());
    wrap(<AssignmentRule />);
    const card = within(await screen.findByRole("region", { name: "Automatic assignment" }));
    expect(await card.findByText("New chats wait in the inbox until someone takes them.")).toBeDefined();
    expect(card.getByText("Off")).toBeDefined();
    expect(card.getByRole("button", { name: "Set up" })).toBeDefined();
  });

  it("describes a rule in plain words", () => {
    const s = settings({ enabled: true, mode: "least_busy", sessionNames: ["shared-line"], maxOpen: 6, useHours: true, timezone: "Asia/Dubai", workDays: [1, 2, 3, 4, 5, 6], workStart: "08:30", workEnd: "17:00", team: "sales" });
    s.members[1].inRotation = true;
    s.members[0].inRotation = true;
    expect(describeRule(s as any)).toBe("Each new chat goes to the person with the fewest open chats, 2 people in sales, on 1 number, up to 6 open chats each. Only Mon to Sat, 08:30 to 17:00 (Asia/Dubai).");
    expect(describeRule(settings({ enabled: true, sessionNames: ["a", "b"], members: [{ ...settings().members[0], inRotation: true }] }) as any)).toBe("New chats go round the team in turn, 1 person, on 2 numbers.");
    expect(sayDays([0, 6])).toBe("Sun and Sat");
    expect(sayDays([1, 3, 5])).toBe("Mon, Wed and Fri");
    expect(sayDays([0, 1, 2, 3, 4, 5, 6])).toBe("every day");
  });

  it("sets up the rule: numbers, people, how to choose, a limit and working hours, and saves exactly that", async () => {
    api.fetchAssignment.mockResolvedValue(settings());
    api.saveAssignment.mockResolvedValue(settings());
    wrap(<AssignmentRule />);
    fireEvent.click(await screen.findByRole("button", { name: "Set up" }));
    const d = within(await screen.findByRole("dialog", { name: "Automatic assignment" }));
    fireEvent.click(d.getByLabelText("Give new chats to people automatically"));
    fireEvent.click(d.getByRole("button", { name: "Least busy" }));
    fireEvent.click(d.getByLabelText(/shared-line/));
    fireEvent.click(d.getByLabelText(/Sam Agent/));
    fireEvent.click(d.getByLabelText(/Tina Agent/));
    expect(d.getByText("Away")).toBeDefined();
    fireEvent.change(d.getByLabelText("Most open chats per person"), { target: { value: "6" } });
    fireEvent.change(d.getByLabelText("Only this team"), { target: { value: "sales" } });
    fireEvent.click(d.getByLabelText("Only during working hours"));
    fireEvent.click(d.getByRole("button", { name: "Sat" }));
    fireEvent.change(d.getByLabelText("Working hours from"), { target: { value: "08:30" } });
    fireEvent.change(d.getByLabelText("Time zone"), { target: { value: "Asia/Dubai" } });
    fireEvent.click(d.getByLabelText(/Send a returning customer back/));
    fireEvent.click(d.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.saveAssignment).toHaveBeenCalledWith({
        enabled: true, mode: "least_busy", team: "sales", sessionNames: ["shared-line"], rotation: [2, 3], keepOwner: false, maxOpen: 6,
        useHours: true, timezone: "Asia/Dubai", workDays: [1, 2, 3, 4, 5, 6], workStart: "08:30", workEnd: "18:00",
      }),
    );
    expect(await screen.findByText("Saved.")).toBeDefined();
  });

  it("shows the server's reason when the rule can't be saved, and keeps the sheet open", async () => {
    api.fetchAssignment.mockResolvedValue(settings());
    api.saveAssignment.mockRejectedValue(new Error("Put at least one teammate in the rotation before turning this on"));
    wrap(<AssignmentRule />);
    fireEvent.click(await screen.findByRole("button", { name: "Set up" }));
    const d = within(await screen.findByRole("dialog", { name: "Automatic assignment" }));
    fireEvent.click(d.getByLabelText("Give new chats to people automatically"));
    fireEvent.click(d.getByRole("button", { name: "Save" }));
    expect(await d.findByText(/Put at least one teammate in the rotation/)).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Automatic assignment" })).toBeDefined();
  });

  it("offers the team choice only when there is more than one team, and hours only when asked for", async () => {
    api.fetchAssignment.mockResolvedValue(settings({ teams: ["general"] }));
    wrap(<AssignmentRule />);
    fireEvent.click(await screen.findByRole("button", { name: "Set up" }));
    const d = within(await screen.findByRole("dialog", { name: "Automatic assignment" }));
    expect(d.queryByLabelText("Only this team")).toBeNull();
    expect(d.queryByLabelText("Working hours from")).toBeNull();
  });
});

describe("the platform console", () => {
  it("shows the platform's totals without any chat", async () => {
    api.fetchPlatformOverview.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      companies: { total: 12, active: 11, suspended: 1, newLast30Days: 3, byPlan: { Growth: 5, Free: 7 }, bySubscription: { active: 4, overdue: 1, free: 7 } },
      people: { active: 41 }, numbers: { linked: 20, connected: 17, notConnected: 3 },
      messages: { sentLast24h: 800, sentLast7Days: 5400, sentLast30Days: 21000, receivedLast7Days: 6100, failedLast7Days: 22, activeCompaniesLast7Days: 9 },
      ai: { requestsThisMonth: 640, tokensThisMonth: 310000, companiesUsing: 4 },
      payments: { last30Days: [{ currency: "INR", payments: 3, amount: 7497 }] },
    });
    wrap(<OverviewSheet open onClose={vi.fn()} />);
    const d = within(await screen.findByRole("dialog", { name: "Platform overview" }));
    expect(await d.findByText("17 / 20")).toBeDefined();
    expect(d.getByText("3 not connected")).toBeDefined();
    expect(d.getByText("21,000")).toBeDefined();
    expect(d.getByText("22").className).toContain("text-danger");
    expect(d.getByText(/Overdue \(grace period\) 1/)).toBeDefined();
    expect(d.getByText(/₹7,497/)).toBeDefined();
    expect(d.getByText(/Growth 5/)).toBeDefined();
  });

  it("lists the numbers that need attention by company, and can list them all", async () => {
    const down = health({ sessionName: "a", label: "Ravi's number", level: "down", status: "DISCONNECTED", problems: [{ code: "down", text: "Not connected for 3 hours." }] });
    api.fetchPlatformNumberHealth.mockResolvedValue({ generatedAt: new Date().toISOString(), totals: { down: 1, warn: 0, ok: 4, unpaired: 0 }, companies: [{ id: "t9", name: "Acme Estates", status: "active", counts: { down: 1, warn: 0, ok: 0, unpaired: 0 }, numbers: [down] }] });
    wrap(<NumberHealthSheet open onClose={vi.fn()} />);
    const d = within(await screen.findByRole("dialog", { name: "Number health" }));
    const company = within(await d.findByRole("region", { name: "Acme Estates" }));
    expect(company.getByText(/Ravi's number/)).toBeDefined();
    expect(company.getByText("Not connected for 3 hours.")).toBeDefined();
    expect(api.fetchPlatformNumberHealth).toHaveBeenLastCalledWith(true);
    fireEvent.click(d.getByRole("tab", { name: "All numbers" }));
    await waitFor(() => expect(api.fetchPlatformNumberHealth).toHaveBeenLastCalledWith(false));
  });

  it("says when every number is healthy", async () => {
    api.fetchPlatformNumberHealth.mockResolvedValue({ generatedAt: new Date().toISOString(), totals: { down: 0, warn: 0, ok: 5, unpaired: 0 }, companies: [] });
    wrap(<NumberHealthSheet open onClose={vi.fn()} />);
    expect(await screen.findByText("Every number is healthy.")).toBeDefined();
  });

  const audit = (over: Record<string, unknown> = {}) => ({
    range: { days: 30, since: ago(30 * 86400) },
    payments: { configured: { configured: true, mode: "test" }, takings: [{ currency: "INR", amount: 1180, source: "gateway", payments: 1 }, { currency: "INR", amount: 500, source: "manual", payments: 1 }] },
    invoices: [{ currency: "INR", invoices: 2, taxableMinor: 200000, taxMinor: 36000, totalMinor: 236000 }],
    orders: { paid: 2, mismatch: 1 }, refunds: [{ currency: "INR", refunds: 1, amountMinor: 50000 }],
    exceptions: { amountMismatch: [], notSettled: [], paidButNoSubscriptionRecord: [], paymentWithoutInvoice: [], webhooksNotProcessed: [], invoiceNumberGaps: [], invalidSignatures: [] },
    exceptionCount: 0, events: [{ id: 1, type: "payment.order_created", company: "Acme", actor: null, at: ago(100), details: {} }],
    ...over,
  });

  it("shows the books and says plainly when nothing is wrong", async () => {
    api.fetchBillingAudit.mockResolvedValue(audit());
    wrap(<BillingAuditSheet open onClose={vi.fn()} />);
    const d = within(await screen.findByRole("dialog", { name: "Billing audit" }));
    expect(await d.findByText("Nothing found")).toBeDefined();
    expect(d.getByText(/₹1,180/)).toBeDefined();
    expect(d.getByRole("region", { name: "Takings" }).textContent).toMatch(/₹1,180 from 1 online/);
    expect(d.getByRole("region", { name: "Takings" }).textContent).toMatch(/₹500 from 1 recorded by hand/);
    expect(d.getByText(/GST/)).toBeDefined();
    expect(d.getByText(/Refunded/)).toBeDefined();
    expect(d.getByText(/payment.order_created/)).toBeDefined();
  });

  it("lists every exception with what to do about it, and asks again for another period", async () => {
    api.fetchBillingAudit.mockResolvedValue(
      audit({
        exceptionCount: 4,
        exceptions: {
          amountMismatch: [{ orderId: "o1", company: "Acme", companyId: "t1", totalMinor: 118000, currency: "INR", paymentId: "pay_1", reason: "Amount paid was 100.00 but the order is 118.00", at: ago(60) }],
          notSettled: [],
          paidButNoSubscriptionRecord: [],
          paymentWithoutInvoice: [{ paymentId: "p1", company: "Beta Co", companyId: "t2", plan: "Growth", amount: 500, currency: "INR", source: "manual", at: ago(60) }],
          webhooksNotProcessed: [],
          invoiceNumberGaps: [{ series: "SCZ/26-27", missing: 2 }, { series: "SCZ/26-27", missing: 3 }],
          invalidSignatures: [],
        },
      }),
    );
    wrap(<BillingAuditSheet open onClose={vi.fn()} />);
    const d = within(await screen.findByRole("dialog", { name: "Billing audit" }));
    expect(await d.findByText("4 found")).toBeDefined();
    expect(d.getByText("Payment did not match the order")).toBeDefined();
    expect(d.getByText(/Nothing was activated/)).toBeDefined();
    expect(d.getByText(/Amount paid was 100.00 but the order is 118.00/)).toBeDefined();
    expect(d.getByText(/Beta Co · Growth · ₹500 · recorded by hand/)).toBeDefined();
    expect(d.getByText("SCZ/26-27/00002 was never issued")).toBeDefined();
    expect(d.getByText("SCZ/26-27/00003 was never issued")).toBeDefined();
    expect(d.queryByText("Gateway messages not processed")).toBeNull();
    fireEvent.change(d.getByLabelText("Period"), { target: { value: "90" } });
    await waitFor(() => expect(api.fetchBillingAudit).toHaveBeenLastCalledWith(90));
  });
});

describe("support access", () => {
  const company = { id: "t1", name: "Acme Estates" } as any;
  const sess = (over: Record<string, unknown> = {}) => ({ id: "s1", adminName: "Karan", reason: "Owner asked about a disconnected number", startedAt: ago(600), expiresAt: new Date(Date.now() + 3000_000).toISOString(), endedAt: null, active: true, actions: [], ...over });

  it("needs a stated reason before it opens, then opens with the length chosen", async () => {
    api.fetchSupportSessions.mockResolvedValue([]);
    api.startSupportSession.mockResolvedValue(sess());
    wrap(<SupportSheet company={company} onClose={vi.fn()} />);
    const d = within(await screen.findByRole("dialog", { name: "Support access" }));
    const form = within(await d.findByRole("form", { name: "Open a support session" }));
    expect(form.getByText(/never shows chats, contacts or files/)).toBeDefined();
    const open = form.getByRole("button", { name: "Open support session" }) as HTMLButtonElement;
    expect(open.disabled).toBe(true);
    fireEvent.change(form.getByLabelText("Reason"), { target: { value: "too short" } });
    expect(open.disabled).toBe(true);
    fireEvent.change(form.getByLabelText("Reason"), { target: { value: "Owner asked about a disconnected number" } });
    fireEvent.change(form.getByLabelText("Session length"), { target: { value: "30" } });
    expect(open.disabled).toBe(false);
    fireEvent.click(open);
    await waitFor(() => expect(api.startSupportSession).toHaveBeenCalledWith("t1", "Owner asked about a disconnected number", 30));
  });

  it("with a session open, shows the team, the numbers or the activity, and can end the session", async () => {
    api.fetchSupportSessions.mockResolvedValue([sess({ actions: [{ action: "viewed_team", at: ago(60), detail: {} }] })]);
    api.fetchSupportSection.mockImplementation(async (_id: string, section: string) =>
      section === "team"
        ? [{ id: 1, name: "Olivia Owner", email: "olivia@acme.test", role: "owner", team: "general", status: "active", joinedAt: ago(9999) }]
        : section === "numbers"
          ? [health({ sessionName: "n1", label: "Ravi's number", phone: "…0002" })]
          : [{ id: 7, type: "plan.changed", actor: "Karan", at: ago(500), details: {} }],
    );
    api.endSupportSession.mockResolvedValue({ ended: true });
    wrap(<SupportSheet company={company} onClose={vi.fn()} />);
    const d = within(await screen.findByRole("dialog", { name: "Support access" }));
    const team = within(await d.findByRole("list", { name: "Team" }));
    expect(team.getByText(/Olivia Owner/)).toBeDefined();
    expect(team.getByText(/olivia@acme.test/)).toBeDefined();
    fireEvent.click(d.getByRole("tab", { name: "Numbers" }));
    expect(await d.findByText(/Ravi's number/)).toBeDefined();
    fireEvent.click(d.getByRole("tab", { name: "Account activity" }));
    expect(await d.findByText(/plan.changed/)).toBeDefined();
    expect(api.fetchSupportSection).toHaveBeenCalledWith("t1", "activity");
    expect(d.getByText(/Looked at the team list\./)).toBeDefined();
    fireEvent.click(d.getByRole("button", { name: "End session" }));
    await waitFor(() => expect(api.endSupportSession).toHaveBeenCalledWith("t1"));
  });

  it("shows why a look was refused", async () => {
    api.fetchSupportSessions.mockResolvedValue([sess()]);
    api.fetchSupportSection.mockRejectedValue(new Error("Open a support session first, with the reason you need to look at this account."));
    wrap(<SupportSheet company={company} onClose={vi.fn()} />);
    expect(await screen.findByText(/Open a support session first/)).toBeDefined();
  });

  it("lets the company read who looked, why and at what", async () => {
    api.fetchSupportAccess.mockResolvedValue([
      sess({ active: false, endedAt: ago(100), actions: [{ action: "viewed_team", at: ago(300), detail: {} }, { action: "viewed_numbers", at: ago(280), detail: {} }, { action: "viewed_team", at: ago(260), detail: {} }] }),
    ]);
    wrap(<SupportAccessCard />);
    const card = within(await screen.findByRole("region", { name: "Scriwo support access" }));
    expect(await card.findByText("Owner asked about a disconnected number")).toBeDefined();
    expect(card.getByText("Karan")).toBeDefined();
    expect(card.getByText("Looked at the team list, the health of the numbers.")).toBeDefined();
    expect(card.getByText("Ended")).toBeDefined();
    cleanup();
    api.fetchSupportAccess.mockResolvedValue([]);
    wrap(<SupportAccessCard />);
    expect(await screen.findByText("Nobody from Scriwo has looked at this account.")).toBeDefined();
  });

  it("opens from a company on the platform screen, and the console buttons open their sheets", async () => {
    api.listCompanies.mockResolvedValue([
      { id: "t1", name: "Acme Estates", plan: "Growth", planId: "growth", status: "active", sessionsLimit: 5, staffCount: 3, sessionsCount: 2, connectedSessions: 2, createdAt: ago(9999), owner: { name: "Olivia", email: "o@acme.test", activated: true }, subscription: null, ai: null },
    ]);
    api.listPlans.mockResolvedValue([]);
    api.fetchAdminPayments.mockResolvedValue({ payments: { configured: false, mode: null }, counts: {}, orders: [], refunds: [] });
    api.fetchSupportSessions.mockResolvedValue([]);
    api.fetchPlatformOverview.mockResolvedValue({ generatedAt: new Date().toISOString(), companies: { total: 1, active: 1, suspended: 0, newLast30Days: 0, byPlan: {}, bySubscription: {} }, people: { active: 3 }, numbers: { linked: 2, connected: 2, notConnected: 0 }, messages: { sentLast24h: 0, sentLast7Days: 0, sentLast30Days: 0, receivedLast7Days: 0, failedLast7Days: 0, activeCompaniesLast7Days: 0 }, ai: { requestsThisMonth: 0, tokensThisMonth: 0, companiesUsing: 0 }, payments: { last30Days: [] } });
    wrap(<PlatformAdmin adminName="Karan" onLogout={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Support access for Acme Estates" }));
    expect(await screen.findByRole("dialog", { name: "Support access" })).toBeDefined();
    fireEvent.click(within(screen.getByRole("dialog", { name: "Support access" })).getAllByRole("button", { name: "Close" }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByRole("dialog", { name: "Platform overview" })).toBeDefined();
  });
});
