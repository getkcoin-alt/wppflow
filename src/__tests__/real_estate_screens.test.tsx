import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { META, alert, overview, property, viewing } from "./realEstateFixtures";
import { TEAM, lead } from "./pipelineFixtures";

const api = vi.hoisted(() => ({
  getStoredTenantId: () => "t1",
  fetchLeads: vi.fn(),
  moveLead: vi.fn(),
  apiDownload: vi.fn(),
  listCompanySolutions: vi.fn(),
  setCompanySolution: vi.fn(),
}));
const re = vi.hoisted(() => ({
  reMeta: vi.fn(),
  reOverview: vi.fn(),
  reAlerts: vi.fn(),
  reScan: vi.fn(),
  reAlertAction: vi.fn(),
  reProperties: vi.fn(),
  reCreateProperty: vi.fn(),
  reUpdateProperty: vi.fn(),
  reVerifyProperty: vi.fn(),
  reViewings: vi.fn(),
  reBook: vi.fn(),
  reViewingAction: vi.fn(),
  viewingIcsPath: (id: string) => `/api/solutions/real_estate/viewings/${id}/calendar.ics`,
}));
vi.mock("../services/api", () => api);
vi.mock("../services/realEstate", () => re);
import { RevenueView } from "../components/realestate/RevenueView";
import { PropertiesView } from "../components/realestate/PropertiesView";
import { ViewingsView } from "../components/realestate/ViewingsView";
import { BookViewingSheet } from "../components/realestate/BookViewingSheet";
import { SolutionsSheet } from "../components/platform/SolutionsSheet";

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  for (const group of [api, re]) for (const fn of Object.values(group)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  re.reMeta.mockResolvedValue(META);
  re.reOverview.mockResolvedValue(overview());
  re.reAlerts.mockResolvedValue({ alerts: [alert()] });
  re.reAlertAction.mockResolvedValue({});
  re.reProperties.mockResolvedValue({ properties: [property()], total: 1, counts: { available: 1 } });
  re.reViewings.mockResolvedValue({ viewings: [viewing()] });
  re.reViewingAction.mockResolvedValue({ viewing: viewing({ status: "confirmed" }), confirmationText: "" });
  api.fetchLeads.mockResolvedValue({ leads: [lead({ id: "l1", contactName: "Aisha Khan" })], total: 1, limit: 100, offset: 0 });
});
afterEach(cleanup);

describe("the revenue screen", () => {
  const open = (isManager = true) => wrap(<RevenueView isManager={isManager} onOpenLead={onOpenLead} onOpenChat={onOpenChat} />);
  const onOpenLead = vi.fn(),
    onOpenChat = vi.fn();
  beforeEach(() => {
    onOpenLead.mockReset();
    onOpenChat.mockReset();
  });

  it("keeps hypothetical money apart from money that was won, and says which is which", async () => {
    open();
    const pipeline = within(await screen.findByLabelText("Open pipeline"));
    expect(pipeline.getByText("AED 5,000,000")).toBeDefined();
    expect(pipeline.getByText("Hypothetical")).toBeDefined();
    expect(pipeline.getByText("4 open leads")).toBeDefined();
    const risk = within(screen.getByLabelText("At risk"));
    expect(risk.getByText("AED 900,000")).toBeDefined();
    expect(risk.getByText("Hypothetical")).toBeDefined();
    const won = within(screen.getByLabelText("Won"));
    expect(won.getByText("AED 1,000,000")).toBeDefined();
    expect(won.getByText("Recorded")).toBeDefined();
    expect(won.getByText("1 deal")).toBeDefined();
    expect(screen.getByText(/They are not revenue\. Only “Won” has been earned/)).toBeDefined();
  });

  it("shows the real funnel with its percentages", async () => {
    open();
    const funnel = within(await screen.findByLabelText("From enquiry to deal"));
    expect(funnel.getByText("Enquiries").nextElementSibling?.textContent).toBe("10");
    expect(funnel.getByText("Viewing booked").nextElementSibling?.textContent).toBe("3");
    expect(funnel.getByText("30% of enquiries")).toBeDefined();
    expect(funnel.getByText(/2 viewings in the next 7 days/)).toBeDefined();
  });

  it("each alert says why, what is at risk, and can be acted on", async () => {
    open();
    const card = within(await screen.findByTestId("alert-unassigned_lead"));
    expect(card.getByText("No one owns Aisha Khan")).toBeDefined();
    expect(card.getByText(/it came in 6 hours ago\. The target is 15 minutes\./)).toBeDefined();
    expect(card.getByText("Nobody owns it")).toBeDefined();
    expect(card.getByText("AED 900,000 at risk")).toBeDefined();
    fireEvent.click(card.getByRole("button", { name: "Open the lead" }));
    expect(onOpenLead).toHaveBeenCalledWith("l1");
    fireEvent.click(card.getByRole("button", { name: /Open the chat/ }));
    expect(onOpenChat).toHaveBeenCalledWith("chat-1");
    fireEvent.click(card.getByRole("button", { name: /Snooze a day/ }));
    await waitFor(() => expect(re.reAlertAction).toHaveBeenCalledWith("a1", "snooze", { hours: 24 }));
    fireEvent.click(card.getByRole("button", { name: /Done/ }));
    await waitFor(() => expect(re.reAlertAction).toHaveBeenCalledWith("a1", "resolve", undefined));
    fireEvent.click(card.getByRole("button", { name: "Not a problem" }));
    await waitFor(() => expect(re.reAlertAction).toHaveBeenCalledWith("a1", "dismiss", undefined));
  });

  it("an automation alert has no lead to open, and a clear title", async () => {
    re.reAlerts.mockResolvedValue({ alerts: [alert({ id: "a2", kind: "failed_automation", leadId: null, conversationId: null, title: "Automation “Welcome reply” is failing", reason: "It failed 2 times in the last day.", valueAtRisk: 0, ownerName: "", stageName: "" })] });
    open();
    const card = within(await screen.findByTestId("alert-failed_automation"));
    expect(card.getByText("Automation “Welcome reply” is failing")).toBeDefined();
    expect(card.queryByRole("button", { name: "Open the lead" })).toBeNull();
    expect(card.queryByText(/at risk/)).toBeNull();
  });

  it("says so when there is nothing wrong, and lets only managers run a check", async () => {
    re.reAlerts.mockResolvedValue({ alerts: [] });
    open(false);
    expect(await screen.findByText("No leaks found")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Check now/ })).toBeNull();
    cleanup();
    re.reScan.mockResolvedValue({});
    open(true);
    fireEvent.click(await screen.findByRole("button", { name: /Check now/ }));
    await waitFor(() => expect(re.reScan).toHaveBeenCalled());
  });

  it("shows an error from the server instead of numbers it does not have", async () => {
    re.reOverview.mockRejectedValue(new Error("Scriwo Real Estate isn't switched on for your company."));
    open();
    expect((await screen.findByRole("alert")).textContent).toContain("isn't switched on for your company");
    expect(screen.queryByLabelText("Open pipeline")).toBeNull();
  });
});

describe("the property inventory", () => {
  const open = (isManager: boolean, currentUserId = 1) => wrap(<PropertiesView isManager={isManager} currentUserId={currentUserId} teammates={TEAM} currency="AED" />);

  it("lists the company's listings with their status and how recently availability was checked", async () => {
    re.reProperties.mockResolvedValue({
      properties: [property(), property({ id: "p2", reference: "DM-OLD", verification: "stale", verifiedDaysAgo: 40 }), property({ id: "p3", reference: "DM-RENT", purpose: "rent", rentPeriod: "year", price: 110000, verification: "never", verifiedDaysAgo: null }), property({ id: "p4", reference: "DM-SOLD", status: "sold" })],
      total: 4, counts: { available: 3, sold: 1 },
    });
    open(true);
    const first = within(await screen.findByTestId("property-DM-101"));
    expect(first.getByText("Available")).toBeDefined();
    expect(first.getByText("AED 1,400,000")).toBeDefined();
    expect(first.getByText("Checked today")).toBeDefined();
    expect(within(screen.getByTestId("property-DM-OLD")).getByText("Check again · 40d ago")).toBeDefined();
    const rent = within(screen.getByTestId("property-DM-RENT"));
    expect(rent.getByText("Never checked")).toBeDefined();
    expect(rent.getByText(/\/ year/)).toBeDefined();
    const sold = within(screen.getByTestId("property-DM-SOLD"));
    expect(sold.getByText("Sold")).toBeDefined();
    expect(sold.queryByRole("button", { name: "Still available" })).toBeNull();
  });

  it("only a manager can add a property, and an agent can confirm only the listings that are theirs", async () => {
    re.reProperties.mockResolvedValue({ properties: [property({ agentUserId: 5, agentName: "Sam" }), property({ id: "p2", reference: "DM-102", agentUserId: 9 })], total: 2, counts: {} });
    open(false, 5);
    await screen.findByTestId("property-DM-101");
    expect(screen.queryByRole("button", { name: /Add a property/ })).toBeNull();
    expect(within(screen.getByTestId("property-DM-101")).getByRole("button", { name: "Still available" })).toBeDefined();
    expect(within(screen.getByTestId("property-DM-102")).queryByRole("button", { name: "Still available" })).toBeNull();
    expect(within(screen.getByTestId("property-DM-102")).queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("confirming availability asks the server and looks again", async () => {
    re.reVerifyProperty.mockResolvedValue({ property: property() });
    open(true);
    fireEvent.click(await screen.findByRole("button", { name: "Still available" }));
    await waitFor(() => expect(re.reVerifyProperty).toHaveBeenCalledWith("p1"));
    await waitFor(() => expect(re.reProperties.mock.calls.length).toBeGreaterThan(1));
  });

  it("adds a property from the form, sending exactly what was entered", async () => {
    re.reCreateProperty.mockResolvedValue({ property: property() });
    open(true);
    fireEvent.click(await screen.findByRole("button", { name: /Add a property/ }));
    await screen.findByRole("dialog", { name: "Add a property" });
    change("Reference", "JVC-201");
    change("Status", "available");
    change("For", "rent");
    change("Price", "95000");
    change("Rent is per", "month");
    change("Community", "Jumeirah Village Circle");
    change("Bedrooms", "1");
    change("Listing address", "https://listings.example.test/jvc-201");
    change("Approved media", "photo https://cdn.example.test/a.jpg Living room");
    change("Listing agent", "2");
    fireEvent.click(screen.getByRole("button", { name: "Add the property" }));
    await waitFor(() => expect(re.reCreateProperty).toHaveBeenCalledTimes(1));
    expect(re.reCreateProperty.mock.calls[0][0]).toMatchObject({
      reference: "JVC-201", status: "available", purpose: "rent", price: 95000, currency: "AED", rentPeriod: "month", community: "Jumeirah Village Circle", bedrooms: 1,
      listingUrl: "https://listings.example.test/jvc-201", agentUserId: 2, media: [{ kind: "photo", url: "https://cdn.example.test/a.jpg", caption: "Living room" }],
    });
  });

  it("shows what is missing when the server will not offer an incomplete property, and keeps the form", async () => {
    re.reCreateProperty.mockRejectedValue(new Error("Before this property can be offered, add a price, the number of bedrooms."));
    open(true);
    fireEvent.click(await screen.findByRole("button", { name: /Add a property/ }));
    await screen.findByRole("dialog", { name: "Add a property" });
    change("Reference", "X-1");
    change("Status", "available");
    fireEvent.click(screen.getByRole("button", { name: "Add the property" }));
    expect((await screen.findAllByRole("alert")).some((a) => /add a price, the number of bedrooms/.test(a.textContent || ""))).toBe(true);
    expect((screen.getByLabelText("Reference") as HTMLInputElement).value).toBe("X-1");
  });

  it("an empty inventory explains what to do, and a search with no result says so", async () => {
    re.reProperties.mockResolvedValue({ properties: [], total: 0, counts: {} });
    open(true);
    expect(await screen.findByText("No properties yet")).toBeDefined();
    expect(screen.getByText(/Scriwo only ever matches and shares what you enter here/)).toBeDefined();
    change("Search properties", "zzz");
    expect(await screen.findByText("No property matches")).toBeDefined();
  });
});

describe("viewings", () => {
  const onBook = vi.fn();
  const open = () => wrap(<ViewingsView onBook={onBook} />);

  it("groups viewings by day, in the time they were booked in, with the actions that make sense", async () => {
    re.reViewings.mockResolvedValue({ viewings: [viewing(), viewing({ id: "v2", propertyReference: "DM-102", status: "confirmed", allowed: ["completed", "cancelled", "no_show"], local: { date: "2026-11-05", time: "18:00", endTime: "18:45", text: "Thu 5 Nov 2026, 18:00" } })] });
    open();
    const first = within(await screen.findByTestId("viewing-v1"));
    expect(first.getByText("16:00–16:45 · DM-101")).toBeDefined();
    expect(first.getByText(/Aisha Khan · Dubai Marina · with Sam Agent/)).toBeDefined();
    expect(first.getByText("Scheduled")).toBeDefined();
    expect(first.getByRole("button", { name: "Confirm" })).toBeDefined();
    expect(first.queryByRole("button", { name: "Mark done" }), "it hasn't started").toBeNull();
    const second = within(screen.getByTestId("viewing-v2"));
    expect(second.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(screen.getAllByLabelText("2026-11-05")).toHaveLength(1);
  });

  it("confirms, and offers done and no-show only once a viewing has started", async () => {
    re.reViewings.mockResolvedValue({ viewings: [viewing({ startsAt: new Date(Date.now() - 7200000).toISOString(), endsAt: new Date(Date.now() - 4500000).toISOString() })] });
    open();
    const row = within(await screen.findByTestId("viewing-v1"));
    fireEvent.click(row.getByRole("button", { name: "Mark done" }));
    await waitFor(() => expect(re.reViewingAction).toHaveBeenCalledWith("v1", "complete", undefined));
    fireEvent.click(row.getByRole("button", { name: "No-show" }));
    await waitFor(() => expect(re.reViewingAction).toHaveBeenCalledWith("v1", "no-show", undefined));
    fireEvent.click(row.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(re.reViewingAction).toHaveBeenCalledWith("v1", "confirm", undefined));
  });

  it("cancelling asks for a reason first and says nothing is sent to the client", async () => {
    open();
    fireEvent.click(within(await screen.findByTestId("viewing-v1")).getByRole("button", { name: "Cancel" }));
    const d = within(await screen.findByRole("dialog", { name: "Cancel this viewing?" }));
    expect(d.getByText(/Tell the client yourself: nothing is sent automatically/)).toBeDefined();
    fireEvent.change(d.getByLabelText("Reason"), { target: { value: "Client unwell" } });
    fireEvent.click(d.getByRole("button", { name: "Cancel the viewing" }));
    await waitFor(() => expect(re.reViewingAction).toHaveBeenCalledWith("v1", "cancel", { reason: "Client unwell" }));
  });

  it("rescheduling keeps the zone it was booked in, and shows a clash as the server words it", async () => {
    re.reViewingAction.mockRejectedValueOnce(Object.assign(new Error("The agent already has a viewing at that time: Thu 5 Nov 2026, 17:00."), { status: 409 }));
    open();
    fireEvent.click(within(await screen.findByTestId("viewing-v1")).getByRole("button", { name: "Reschedule" }));
    const d = within(await screen.findByRole("dialog", { name: "Reschedule" }));
    expect(d.getByText(/Asia\/Dubai/)).toBeDefined();
    fireEvent.change(d.getByLabelText("New date"), { target: { value: "2026-11-06" } });
    fireEvent.change(d.getByLabelText("New time"), { target: { value: "17:00" } });
    fireEvent.click(d.getByRole("button", { name: "Move the viewing" }));
    expect((await d.findByRole("alert")).textContent).toContain("The agent already has a viewing at that time");
    fireEvent.click(d.getByRole("button", { name: "Move the viewing" }));
    await waitFor(() => expect(re.reViewingAction).toHaveBeenLastCalledWith("v1", "reschedule", { date: "2026-11-06", time: "17:00", timeZone: "Asia/Dubai" }));
  });

  it("downloads a calendar file with the signed-in session", async () => {
    api.apiDownload.mockResolvedValue(new Blob(["BEGIN:VCALENDAR"], { type: "text/calendar" }));
    (URL as any).createObjectURL = vi.fn(() => "blob:x");
    (URL as any).revokeObjectURL = vi.fn();
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Download the calendar file for DM-101" }));
    await waitFor(() => expect(api.apiDownload).toHaveBeenCalledWith("/api/solutions/real_estate/viewings/v1/calendar.ics"));
  });

  it("has an empty state with a way to book, and an error state", async () => {
    re.reViewings.mockResolvedValue({ viewings: [] });
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Book a viewing", hidden: false }));
    expect(onBook).toHaveBeenCalled();
    expect(await screen.findByText("No viewings coming up")).toBeDefined();
    cleanup();
    re.reViewings.mockRejectedValue(new Error("Scriwo Real Estate isn't switched on for your company."));
    open();
    expect((await screen.findByRole("alert")).textContent).toContain("isn't switched on");
  });
});

describe("booking a viewing", () => {
  const sheet = (props: Record<string, unknown> = {}) =>
    wrap(<BookViewingSheet open onClose={onClose} teammates={TEAM} currentUserId={2} isManager leadId="l1" propertyId="p1" {...props} />);
  const onClose = vi.fn();
  const booked = (o: Record<string, unknown> = {}) => ({ viewing: viewing(), existing: false, suggestedStage: null, confirmationText: "Hello Aisha, this is to confirm your viewing of DM-101.", ...o });
  beforeEach(() => {
    onClose.mockReset();
    (re.reProperties as any).mockResolvedValue({ properties: [property(), property({ id: "p2", reference: "DM-102" })], total: 2, counts: {} });
  });

  it("sends who, what and when, in the zone shown, with a key that makes a repeat harmless", async () => {
    re.reBook.mockResolvedValue(booked());
    sheet();
    await screen.findByRole("dialog", { name: "Book a viewing" });
    expect((screen.getByLabelText("Time zone") as HTMLInputElement).value).toBe("Asia/Dubai");
    change("Date", "2026-11-05");
    change("Time", "16:00");
    change("Notes", "Bring the floor plan");
    fireEvent.click(screen.getByRole("button", { name: "Book the viewing" }));
    await waitFor(() => expect(re.reBook).toHaveBeenCalledTimes(1));
    const sent = re.reBook.mock.calls[0][0];
    expect(sent).toMatchObject({ leadId: "l1", propertyId: "p1", date: "2026-11-05", time: "16:00", timeZone: "Asia/Dubai", durationMinutes: 45, notes: "Bring the floor plan" });
    expect(sent.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("explains a clash in the server's words, and a second try is the same request", async () => {
    re.reBook.mockRejectedValueOnce(
      Object.assign(new Error("The agent already has a viewing at that time: Thu 5 Nov 2026, 16:00."), { status: 409, data: { conflicts: [{ with: "agent", reference: "DM-103", local: "Thu 5 Nov 2026, 16:00" }, { with: "property", reference: "DM-101", local: "Thu 5 Nov 2026, 16:00" }] } }),
    ).mockResolvedValueOnce(booked());
    sheet();
    await screen.findByRole("dialog", { name: "Book a viewing" });
    change("Date", "2026-11-05");
    change("Time", "16:00");
    fireEvent.click(screen.getByRole("button", { name: "Book the viewing" }));
    const alertBox = await screen.findByRole("alert");
    expect(alertBox.textContent).toContain("The agent already has a viewing at that time");
    expect(alertBox.textContent).toContain("Also: property at Thu 5 Nov 2026, 16:00");
    change("Time", "17:00");
    fireEvent.click(screen.getByRole("button", { name: "Book the viewing" }));
    await screen.findByRole("dialog", { name: "Viewing booked" });
    expect(re.reBook.mock.calls[1][0].idempotencyKey).toBe(re.reBook.mock.calls[0][0].idempotencyKey);
  });

  it("then offers a message to send, without sending it, and suggests (never makes) the pipeline move", async () => {
    re.reBook.mockResolvedValue(booked({ suggestedStage: { id: "s2", name: "Viewing booked" } }));
    api.moveLead.mockResolvedValue({ lead: lead() });
    sheet();
    await screen.findByRole("dialog", { name: "Book a viewing" });
    change("Date", "2026-11-05");
    change("Time", "16:00");
    fireEvent.click(screen.getByRole("button", { name: "Book the viewing" }));
    const d = within(await screen.findByRole("dialog", { name: "Viewing booked" }));
    expect((d.getByLabelText("Confirmation message") as HTMLTextAreaElement).value).toBe("Hello Aisha, this is to confirm your viewing of DM-101.");
    expect(d.getByText(/Nothing has been sent/)).toBeDefined();
    expect(api.moveLead).not.toHaveBeenCalled();
    fireEvent.click(d.getByRole("button", { name: "Move to Viewing booked" }));
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s2" }));
  });

  it("an agent can only book for themselves, and cannot book until the essentials are filled in", async () => {
    sheet({ isManager: false, currentUserId: 2 });
    await screen.findByRole("dialog", { name: "Book a viewing" });
    const agent = screen.getByLabelText("Agent") as HTMLSelectElement;
    expect(agent.disabled).toBe(true);
    expect(agent.value).toBe("2");
    expect(screen.getByRole("button", { name: "Book the viewing" }).hasAttribute("disabled")).toBe(true);
  });

  it("a lead is chosen from the company's open leads when none was given", async () => {
    sheet({ leadId: undefined, propertyId: undefined });
    await screen.findByRole("dialog", { name: "Book a viewing" });
    expect(await screen.findByRole("option", { name: "Aisha Khan" })).toBeDefined();
    expect(api.fetchLeads).toHaveBeenCalledWith({ status: "open", limit: 100 });
  });
});

describe("the platform admin's switch", () => {
  const company = { id: "c1", name: "Marina Brokers", plan: "Growth", planId: "growth" } as any;
  const plans = (leads: boolean) => [{ id: "growth", name: "Growth", features: [{ key: "leads", label: "The sales pipeline", included: leads }] }] as any;
  const choice = (enabled: boolean) => [{ key: "real_estate", name: "Scriwo Real Estate", version: 1, summary: "Lead qualification, property inventory with matching, viewings and a revenue leak detector.", requires: ["leads"], enabled }];
  const open = (leads = true) => wrap(<SolutionsSheet company={company} plans={plans(leads)} onClose={() => {}} />);

  it("switches a solution on for one company, and says the managers were told", async () => {
    api.listCompanySolutions.mockResolvedValue(choice(false));
    api.setCompanySolution.mockResolvedValue({ changed: true, solutions: choice(true) });
    open();
    const sw = await screen.findByRole("switch", { name: "Scriwo Real Estate for Marina Brokers" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    await waitFor(() => expect(api.setCompanySolution).toHaveBeenCalledWith("c1", "real_estate", true));
    expect(await screen.findByText("Scriwo Real Estate is now on for Marina Brokers. Their managers have been told.")).toBeDefined();
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });

  it("switches it off again, and warns when the plan lacks what the solution is built on", async () => {
    api.listCompanySolutions.mockResolvedValue(choice(true));
    api.setCompanySolution.mockResolvedValue({ changed: true, solutions: choice(false) });
    open(false);
    expect(await screen.findByText(/Their plan doesn’t include the sales pipeline, so it won’t open until it does/)).toBeDefined();
    fireEvent.click(await screen.findByRole("switch"));
    await waitFor(() => expect(api.setCompanySolution).toHaveBeenCalledWith("c1", "real_estate", false));
    expect(await screen.findByText(/is now off for Marina Brokers/)).toBeDefined();
  });

  it("shows a refusal from the server", async () => {
    api.listCompanySolutions.mockResolvedValue(choice(false));
    api.setCompanySolution.mockRejectedValue(new Error("Platform administrator access required"));
    open();
    fireEvent.click(await screen.findByRole("switch"));
    expect((await screen.findByRole("alert")).textContent).toContain("Platform administrator access required");
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
  });
});
