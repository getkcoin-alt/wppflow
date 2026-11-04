import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { STAGES, TEAM, board, lead, settings } from "./pipelineFixtures";
import { resetBackStack } from "../hooks/useBackClose";

const api = vi.hoisted(() => ({
  // contacts
  fetchContacts: vi.fn(),
  addContact: vi.fn(),
  patchContact: vi.fn(),
  apiPost: vi.fn(),
  removeContact: vi.fn(),
  bulkCreateLeads: vi.fn(),
  fetchLabels: vi.fn(),
  applyLabels: vi.fn(),
  apiGet: vi.fn(),
  // pipeline
  fetchLeadBoard: vi.fn(),
  fetchLeads: vi.fn(),
  fetchLead: vi.fn(),
  fetchLeadTasks: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  moveLead: vi.fn(),
  updateLead: vi.fn(),
  updateLeadTask: vi.fn(),
  createLead: vi.fn(),
  aiLeadSuggestion: vi.fn(),
  // today
  fetchHome: vi.fn(),
  fetchAutopilot: vi.fn(),
  // automations
  fetchAutomationContext: vi.fn(),
  fetchAutomationTemplates: vi.fn(),
  fetchAssignment: vi.fn(),
  fetchKnowledge: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import { Contacts } from "../components/user/Contacts";
import { Pipeline } from "../components/pipeline/Pipeline";
import { Today } from "../components/home/Today";
import { Automations } from "../components/user/Automations";
import { VerifyEmailBanner } from "../components/onboarding/VerifyEmail";

function phone() {
  window.matchMedia = ((q: string) => ({ matches: q.includes("max-width"), media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
}
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  resetBackStack();
  window.history.replaceState(null, "");
  phone();
});
afterEach(() => {
  cleanup();
  delete (window as { matchMedia?: unknown }).matchMedia;
  vi.restoreAllMocks();
});

describe("Contacts on a phone", () => {
  const people = [
    { id: "c1", name: "Aisha Khan", phone: "971500000001", email: "", tags: [], optIn: true, labels: [{ id: "l1", name: "VIP", color: "#f00" }] },
    { id: "c2", name: "Bilal", phone: "971500000002", email: "", tags: [], optIn: false },
  ];
  const onSelectChat = vi.fn();
  const view = (over: Partial<Parameters<typeof Contacts>[0]> = {}) =>
    render(
      <QueryClientProvider client={client()}>
        <Contacts onSelectChat={onSelectChat} pipeline={{ teammates: TEAM, isManager: true, aiAvailable: false }} canManageLabels {...over} />
      </QueryClientProvider>,
    );
  const row = (name: string) => screen.getAllByText(name).map((e) => e.closest('[role="button"]')).find(Boolean) as HTMLElement;
  beforeEach(() => {
    onSelectChat.mockReset();
    api.fetchContacts.mockResolvedValue({ contacts: people, nextCursor: null });
    api.fetchPipelineSettings.mockResolvedValue(settings());
    api.fetchLabels.mockResolvedValue([]);
  });

  it("is a simple list: a name, a number and a dot for permission, with no per-row buttons", async () => {
    view();
    await screen.findByText("Aisha Khan");
    expect(within(row("Aisha Khan")).getByRole("img", { name: "Opted in to broadcasts" })).toBeDefined();
    expect(within(row("Bilal")).getByRole("img", { name: "No broadcast permission" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByLabelText("Select Aisha Khan")).toBeNull();
    expect(screen.queryByText("VIP")).toBeNull();
  });

  it("opens what can be done with a person on a tap, and Message goes to the chat", async () => {
    view();
    await screen.findByText("Bilal");
    fireEvent.click(row("Bilal"));
    const sheet = within(screen.getByRole("dialog", { name: "Bilal" }));
    expect(sheet.getAllByRole("button").map((b) => b.textContent)).toEqual(["Message", "Add to pipeline", "Edit", "Delete"]);
    fireEvent.click(sheet.getByRole("button", { name: "Message" }));
    expect(onSelectChat).toHaveBeenCalledWith({ contactId: "c2", name: "Bilal", phone: "971500000002", optIn: false });
  });

  it("does not offer the pipeline on a plan without it", async () => {
    view({ pipeline: undefined });
    await screen.findByText("Bilal");
    fireEvent.click(row("Bilal"));
    expect(within(screen.getByRole("dialog", { name: "Bilal" })).queryByRole("button", { name: "Add to pipeline" })).toBeNull();
  });

  it("asks before deleting, and deletes only when it is confirmed", async () => {
    api.removeContact.mockResolvedValue({});
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    view();
    await screen.findByText("Bilal");
    fireEvent.click(row("Bilal"));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Bilal" })).getByRole("button", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(api.removeContact).not.toHaveBeenCalled();
    fireEvent.click(row("Bilal"));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Bilal" })).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(api.removeContact).toHaveBeenCalledWith("c2"));
  });

  it("edits from the sheet", async () => {
    view();
    await screen.findByText("Aisha Khan");
    fireEvent.click(row("Aisha Khan"));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Aisha Khan" })).getByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("dialog", { name: "Edit contact" })).toBeDefined();
  });

  it("starts choosing several when a row is held, and a tap then picks instead of opening", async () => {
    view();
    await screen.findByText("Aisha Khan");
    fireEvent.contextMenu(row("Aisha Khan"));
    expect(screen.getByText("1 selected")).toBeDefined();
    fireEvent.click(row("Bilal"));
    expect(screen.getByText("2 selected")).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(row("Bilal"));
    expect(screen.getByText("1 selected")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText(/selected/)).toBeNull();
  });

  it("keeps import, export and labels behind one more button, and adds a person from the round button", async () => {
    view();
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("button", { name: "Import CSV" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(within(screen.getByRole("dialog", { name: "Contacts" })).getAllByRole("button").map((b) => b.textContent)).toEqual(["Import contacts from a CSV file", "Export all contacts", "Manage labels"]);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "New contact" }));
    expect(await screen.findByRole("dialog", { name: "New contact" })).toBeDefined();
  });

  it("hides the round button while choosing, so it does not sit on the selection bar", async () => {
    view();
    await screen.findByText("Aisha Khan");
    expect(screen.getByRole("button", { name: "New contact" })).toBeDefined();
    fireEvent.contextMenu(row("Aisha Khan"));
    expect(screen.queryByRole("button", { name: "New contact" })).toBeNull();
  });
});

describe("the pipeline on a phone", () => {
  const view = (over: Record<string, unknown> = {}) =>
    render(
      <QueryClientProvider client={client()}>
        <Pipeline teammates={TEAM} sessions={[{ id: "s1", sessionKey: "sam-line", displayName: "Sam's line", status: "CONNECTED" }, { id: "s2", sessionKey: "front", displayName: "Front desk", status: "CONNECTED" }] as never} currentUserId={2} isManager aiAvailable onOpenChat={vi.fn()} {...over} />
      </QueryClientProvider>,
    );
  beforeEach(() => {
    api.fetchLeadBoard.mockResolvedValue(board());
    api.fetchLeads.mockResolvedValue({ leads: [lead()], total: 1, limit: 50, offset: 0 });
    api.fetchLeadTasks.mockResolvedValue({ tasks: [] });
    api.fetchPipelineSettings.mockResolvedValue(settings());
    api.moveLead.mockImplementation(async (id: string, body: any) => ({ lead: lead({ id, stageId: body.stageId }) }));
  });

  it("says where things stand in one line, not three boxes", async () => {
    view();
    await screen.findByText("Aisha Khan");
    const line = screen.getByLabelText("Pipeline totals");
    expect(line.textContent).toMatch(/\d+ open · AED .+ in play · .+ won in 30 days/);
    expect(document.querySelector("dl")).toBeNull();
  });

  it("keeps the filters in a sheet and sends them to the board", async () => {
    view();
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("combobox", { name: "Owner" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    const sheet = within(screen.getByRole("dialog", { name: "Filters" }));
    fireEvent.click(sheet.getByRole("button", { name: "Mine" }));
    fireEvent.click(sheet.getByRole("button", { name: "Late follow-ups" }));
    fireEvent.click(sheet.getByRole("button", { name: "Front desk" }));
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith({ mine: true, number: "front", overdue: true }));
    fireEvent.click(sheet.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: "Filters, 3 on" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Filters, 3 on" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Filters" })).getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith({}));
  });

  it("moves a lead from a list of steps, not a native menu", async () => {
    view();
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("combobox", { name: /Move Aisha Khan/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Move Aisha Khan to another step" }));
    const sheet = within(screen.getByRole("dialog", { name: "Move to" }));
    expect(sheet.getAllByRole("button").map((b) => b.textContent)).toEqual(STAGES.filter((s) => s.id !== "s1").map((s) => s.name));
    fireEvent.click(sheet.getByRole("button", { name: "Contacted" }));
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", expect.objectContaining({ stageId: "s2" })));
  });

  it("adds a lead from the round button, and puts settings behind one more button for managers only", async () => {
    view();
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByRole("button", { name: "New lead" }));
    expect(await screen.findByRole("dialog", { name: /pipeline/i })).toBeDefined();
    cleanup();
    view({ isManager: false });
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });

  it("shows a manager the settings in the more menu", async () => {
    view();
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(within(screen.getByRole("dialog", { name: "Pipeline" })).getByRole("button", { name: "Pipeline settings" })).toBeDefined();
  });
});

describe("Today on a phone", () => {
  const chat = (n: number) => ({ kind: "chat", id: `chat:c${n}`, conversationId: `c${n}`, title: `Customer ${n}`, avatar: "", preview: "Is it still available?", waitingSeconds: 5400, overdue: true, unread: 1, assignedTo: "", isMine: false, askedForPerson: false, prep: null });
  const none = { waiting: 0, overdue: 0, tasksDue: 0, tasksOverdue: 0, numbersNeedingCare: 0, askedForPerson: 0 };
  const view = (needsYou: object[], more = 0, props: Partial<Parameters<typeof Today>[0]> = {}) => {
    api.fetchHome.mockResolvedValue({ firstName: "Olivia", counts: { ...none, waiting: needsYou.length }, replyTargetMinutes: 30, needsYou, more, setup: null });
    api.fetchAutopilot.mockResolvedValue({ available: false, reason: "plan", canEdit: false, rules: [], sentToday: 0, dailyCap: 50, log: [] });
    api.apiGet.mockResolvedValue({ summary: { conversations: 1, contacts: 1, sessions: 1, pending: 0, sent: 1, delivered: 1, read: 1 } });
    const onSearch = vi.fn();
    render(
      <QueryClientProvider client={client()}>
        <Today workspaceName="Bloom Florist" ai={{ available: false, locked: false }} hasNumber onOpenChat={vi.fn()} onSend={vi.fn()} onSearch={onSearch} onOpenInbox={vi.fn()} onOpenNumbers={vi.fn()} onConnectNumber={vi.fn()} onSetupStep={vi.fn()} {...props} />
      </QueryClientProvider>,
    );
    return { onSearch };
  };

  it("is a greeting, one line and the alerts, with the work right under it", async () => {
    const { onSearch } = view([chat(1)]);
    expect(await screen.findByRole("heading", { level: 1, name: /Olivia/ })).toBeDefined();
    expect(screen.queryByText("Bloom Florist")).toBeNull();
    expect(screen.queryByText("Search or jump to…")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Search and commands" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("shows the first three things, and the rest on a tap", async () => {
    view([1, 2, 3, 4, 5].map(chat));
    expect(await screen.findByText("Customer 1")).toBeDefined();
    expect(screen.getByText("Customer 3")).toBeDefined();
    expect(screen.queryByText("Customer 4")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 2 more" }));
    expect(screen.getByText("Customer 5")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).toBeNull();
  });

  it("shows no button when there are three or fewer", async () => {
    view([1, 2, 3].map(chat));
    await screen.findByText("Customer 3");
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).toBeNull();
  });
});

describe("the email notice on a phone", () => {
  it("is one short line", () => {
    render(<VerifyEmailBanner email="karn@mobile.test" />);
    expect(screen.getByText("Confirm your email")).toBeDefined();
    expect(screen.getByRole("button", { name: "Send again" })).toBeDefined();
    expect(screen.queryByText(/We sent you a link/)).toBeNull();
  });
});

describe("Automations on a phone", () => {
  it("lists the company's own rules before the ideas", async () => {
    api.fetchAutomationContext.mockResolvedValue({ countries: [] });
    api.fetchAutomationTemplates.mockResolvedValue({ templates: [] });
    api.fetchKnowledge.mockResolvedValue({ sources: [], overview: "", products: [], notes: "", writtenByRiwo: false, ready: false });
    api.fetchAssignment.mockResolvedValue({ enabled: false, mode: "round_robin", team: "", sessionNames: [], keepOwner: true, maxOpen: null, useHours: false, timezone: "Asia/Kolkata", workDays: [1, 2, 3, 4, 5], workStart: "09:00", workEnd: "18:00", members: [], teams: [], numbers: [] });
    const rule = { id: "r1", name: "Welcome new customers", triggerType: "first_message", triggerCondition: "", actionType: "reply_text", actionSummary: "Hi!", isEnabled: true, executionsCount: 3, templateId: "welcome", config: {} };
    render(
      <QueryClientProvider client={client()}>
        <Automations automations={[rule] as never} teammates={TEAM} onChanged={vi.fn()} />
      </QueryClientProvider>,
    );
    const mine = await screen.findByRole("heading", { name: "Welcome new customers" });
    const idea = await screen.findByRole("heading", { name: "Just tell Riwo what you want" });
    // the rule comes first in the page, the idea after it
    expect(mine.compareDocumentPosition(idea) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
