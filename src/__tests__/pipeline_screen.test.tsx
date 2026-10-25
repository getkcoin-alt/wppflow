import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup, createEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { STAGES, TEAM, board, lead, settings, task } from "./pipelineFixtures";

const api = vi.hoisted(() => ({
  fetchLeadBoard: vi.fn(),
  fetchLeads: vi.fn(),
  fetchLead: vi.fn(),
  fetchLeadTasks: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  moveLead: vi.fn(),
  updateLead: vi.fn(),
  updateLeadTask: vi.fn(),
  addLeadTask: vi.fn(),
  deleteLeadTask: vi.fn(),
  deleteLead: vi.fn(),
  createLead: vi.fn(),
  fetchContacts: vi.fn(),
  aiLeadSuggestion: vi.fn(),
  savePipelineStages: vi.fn(),
  applyPipelinePreset: vi.fn(),
  setPipelineCurrency: vi.fn(),
  setPipelineAutoCreate: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", () => api);
import { Pipeline } from "../components/pipeline/Pipeline";

const sessions: any[] = [
  { id: "s1", sessionKey: "sam-line", displayName: "Sam's line", status: "CONNECTED" },
  { id: "s2", sessionKey: "front", displayName: "Front desk", status: "CONNECTED" },
];
const onOpenChat = vi.fn();

const wrap = (props: Record<string, unknown> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Pipeline teammates={TEAM} sessions={sessions} currentUserId={2} isManager aiAvailable onOpenChat={onOpenChat} {...props} />
    </QueryClientProvider>,
  );
const column = (name: string) => within(screen.getByRole("region", { name }));

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  onOpenChat.mockReset();
  api.fetchLeadBoard.mockResolvedValue(board());
  api.fetchLeads.mockResolvedValue({ leads: [lead(), lead({ id: "l2", contactName: "Bilal" })], total: 2, limit: 50, offset: 0 });
  api.fetchLeadTasks.mockResolvedValue({ tasks: [] });
  api.fetchPipelineSettings.mockResolvedValue(settings());
  api.moveLead.mockImplementation(async (id: string, body: any) => ({ lead: lead({ id, stageId: body.stageId }) }));
});
afterEach(cleanup);

describe("the board", () => {
  it("shows every step with its leads, and what the open ones are worth", async () => {
    wrap();
    expect(await screen.findByText("Aisha Khan")).toBeDefined();
    for (const s of STAGES) expect(screen.getByRole("region", { name: s.name })).toBeDefined();
    expect(column("New").getByText("Aisha Khan")).toBeDefined();
    expect(column("New").getByText("2BR Marina")).toBeDefined();
    expect(column("New").getByText("AED 1,400,000")).toBeDefined();
    expect(column("New").getByText("3 days here")).toBeDefined();
    expect(column("Contacted").getByText("Bilal")).toBeDefined();
    expect(column("Contacted").getByText("No value yet")).toBeDefined();
    expect(column("Contacted").getByText("Unowned")).toBeDefined();
    expect(column("Won").getByText("Nothing in the last 30 days")).toBeDefined();
    expect(column("Qualified").getByText("Nothing here yet")).toBeDefined();
    expect(screen.getByTitle("2")).toBeDefined();
    expect(screen.getAllByTitle("AED 1,400,000").length).toBeGreaterThanOrEqual(2); // the pipeline total and the New step
  });

  it("shows the last message, unread count and the next follow-up on a card", async () => {
    api.fetchLeadBoard.mockResolvedValue(board([lead({ unread: 3, nextTask: { id: "t1", title: "Call back", dueAt: new Date(Date.now() - 86_400_000 * 2).toISOString() } })]));
    wrap();
    const card = (await screen.findByRole("article", { name: /Aisha Khan/ })) as HTMLElement;
    expect(within(card).getByText("Can we view it on Saturday?")).toBeDefined();
    expect(within(card).getByLabelText("3 unread")).toBeDefined();
    expect(within(card).getByText(/Call back · Overdue 2 days/).className).toContain("");
  });

  it("moves a lead with the menu on the card, which works without dragging", async () => {
    wrap();
    const card = await screen.findByRole("article", { name: /Aisha Khan/ });
    const menu = within(card).getByLabelText("Move Aisha Khan to another step") as HTMLSelectElement;
    expect(Array.from(menu.options).map((o) => o.textContent)).toEqual(["Move to…", "Contacted", "Qualified", "Won", "Lost"]);
    fireEvent.change(menu, { target: { value: "s3" } });
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s3" }));
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenCalledTimes(2));
  });

  it("asks why before marking a lead lost, and sends the reason", async () => {
    wrap();
    const card = await screen.findByRole("article", { name: /Aisha Khan/ });
    fireEvent.change(within(card).getByLabelText("Move Aisha Khan to another step"), { target: { value: "s5" } });
    const dialog = within(await screen.findByRole("dialog", { name: "Why was it lost?" }));
    expect(api.moveLead).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole("button", { name: "Price too high" }));
    expect((dialog.getByLabelText("Reason") as HTMLInputElement).value).toBe("Price too high");
    fireEvent.click(dialog.getByRole("button", { name: "Mark as lost" }));
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s5", lostReason: "Price too high" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Why was it lost?" })).toBeNull());
  });

  it("can be cancelled without moving anything", async () => {
    wrap();
    const card = await screen.findByRole("article", { name: /Aisha Khan/ });
    fireEvent.change(within(card).getByLabelText("Move Aisha Khan to another step"), { target: { value: "s5" } });
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Why was it lost?" })).getByRole("button", { name: "Cancel" }));
    expect(api.moveLead).not.toHaveBeenCalled();
  });

  it("moves a lead by dragging it to another step, or just above another lead", async () => {
    api.fetchLeadBoard.mockResolvedValue(board([lead(), lead({ id: "l2", contactName: "Bilal", stageId: "s2" }), lead({ id: "l3", contactName: "Chitra", stageId: "s2" })]));
    wrap();
    const aisha = await screen.findByRole("article", { name: /Aisha Khan/ });
    const store: Record<string, string> = {};
    const dataTransfer = { setData: (k: string, v: string) => (store[k] = v), getData: (k: string) => store[k] };
    fireEvent(aisha, Object.assign(createEvent.dragStart(aisha), { dataTransfer }));
    fireEvent(column("Qualified").getByText("Nothing here yet").closest("section")!, Object.assign(createEvent.dragOver(column("Qualified").getByText("Nothing here yet")), { dataTransfer }));
    fireEvent(column("Qualified").getByText("Nothing here yet").closest("section")!, Object.assign(createEvent.drop(column("Qualified").getByText("Nothing here yet")), { dataTransfer }));
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s3" }));
    api.moveLead.mockClear();
    const chitra = screen.getByRole("article", { name: /Chitra/ });
    fireEvent(aisha, Object.assign(createEvent.dragStart(aisha), { dataTransfer }));
    fireEvent(chitra, Object.assign(createEvent.drop(chitra), { dataTransfer }));
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s2", beforeLeadId: "l3" }));
  });

  it("shows why a move failed", async () => {
    api.moveLead.mockRejectedValue(new Error("This contact already has another open lead"));
    wrap();
    const card = await screen.findByRole("article", { name: /Aisha Khan/ });
    fireEvent.change(within(card).getByLabelText("Move Aisha Khan to another step"), { target: { value: "s2" } });
    expect((await screen.findByRole("alert")).textContent).toContain("already has another open lead");
  });

  it("offers the steps as tabs on a phone, with the count in each", async () => {
    wrap();
    await screen.findByText("Aisha Khan");
    const tabs = within(screen.getByRole("tablist", { name: "Pipeline steps" }));
    expect(tabs.getAllByRole("tab").map((t) => t.textContent)).toEqual(["New 1", "Contacted 1", "Qualified 0", "Won 0", "Lost 0"]);
    fireEvent.click(tabs.getByRole("tab", { name: /Contacted/ }));
    expect(tabs.getByRole("tab", { name: /Contacted/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("says what to do when there are no leads at all", async () => {
    api.fetchLeadBoard.mockResolvedValue(board([]));
    wrap();
    expect(await screen.findByText("No leads yet")).toBeDefined();
    expect(screen.getByText(/Add every new customer as a lead/)).toBeDefined();
  });

  it("offers 'show all' when a step has more leads than fit", async () => {
    const full = board([lead()]);
    full.stages[0].count = 45;
    api.fetchLeadBoard.mockResolvedValue(full);
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Show all 45" }));
    await waitFor(() => expect(api.fetchLeads).toHaveBeenCalledWith(expect.objectContaining({ stage: "s1", limit: 50 })));
    expect(screen.getByLabelText("Show every step")).toBeDefined();
  });
});

describe("narrowing the board down", () => {
  it("sends the search, the owner, the number and the late filter", async () => {
    wrap();
    await screen.findByText("Aisha Khan");
    fireEvent.change(screen.getByLabelText("Search leads"), { target: { value: "aish" } });
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith(expect.objectContaining({ q: "aish" })));
    fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "me" } });
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith(expect.objectContaining({ q: "aish", mine: true })));
    fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "none" } });
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith(expect.objectContaining({ owner: "none" })));
    fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "1" } });
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith(expect.objectContaining({ owner: "1" })));
    fireEvent.change(screen.getByLabelText("Number"), { target: { value: "front" } });
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith(expect.objectContaining({ number: "front" })));
    fireEvent.click(screen.getByRole("button", { name: "Late follow-ups" }));
    await waitFor(() => expect(api.fetchLeadBoard).toHaveBeenLastCalledWith(expect.objectContaining({ overdue: true })));
  });

  it("only offers the number filter when there is more than one number", async () => {
    wrap({ sessions: [sessions[0]] });
    await screen.findByText("Aisha Khan");
    expect(screen.queryByLabelText("Number")).toBeNull();
  });
});

describe("the list", () => {
  it("shows the same leads as rows, and loads more on request", async () => {
    api.fetchLeads.mockResolvedValue({ leads: [lead(), lead({ id: "l2", contactName: "Bilal", stageId: "s2", ownerName: "" })], total: 120, limit: 50, offset: 0 });
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: "List" }));
    expect(await screen.findByText(/Showing 2 of 120/)).toBeDefined();
    const row = screen.getByText("Bilal").closest("tr")!;
    expect(within(row).getByText("Contacted")).toBeDefined();
    expect(within(row).getByText("Unowned")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    await waitFor(() => expect(api.fetchLeads).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 100 })));
  });

  it("says when nothing matches", async () => {
    api.fetchLeads.mockResolvedValue({ leads: [], total: 0, limit: 50, offset: 0 });
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: "List" }));
    expect(await screen.findByText("No leads match.")).toBeDefined();
  });
});

describe("today", () => {
  it("lists what is due, and ticks it off or moves it to tomorrow", async () => {
    api.fetchLeadTasks.mockResolvedValue({ tasks: [task(), task({ id: "t2", title: "Confirm the viewing", contactName: "Bilal", leadId: "l2", conversationId: null })] });
    api.updateLeadTask.mockResolvedValue({ task: task({ done: true }) });
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: "Today (2)" }));
    expect(await screen.findByText("Send the brochure")).toBeDefined();
    expect(screen.getAllByText(/Overdue/).length).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Mark “Send the brochure” done" }));
    await waitFor(() => expect(api.updateLeadTask).toHaveBeenCalledWith("t1", { done: true }));
    fireEvent.click(screen.getAllByRole("button", { name: "Tomorrow" })[1]);
    await waitFor(() => expect(api.updateLeadTask).toHaveBeenCalledWith("t2", { dueAt: expect.any(String) }));
    const tomorrow = new Date((api.updateLeadTask.mock.calls.at(-1)![1] as any).dueAt);
    expect(tomorrow.getHours()).toBe(9);
    expect(tomorrow.getTime()).toBeGreaterThan(Date.now());
  });

  it("opens the chat from a follow-up, only when it has one", async () => {
    api.fetchLeadTasks.mockResolvedValue({ tasks: [task(), task({ id: "t2", contactName: "Bilal", conversationId: null })] });
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: /Today/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Open the chat with Aisha Khan" }));
    expect(onOpenChat).toHaveBeenCalledWith("chat-1");
    expect(screen.queryByRole("button", { name: "Open the chat with Bilal" })).toBeNull();
  });

  it("asks for today as the person's own day, and managers can see everyone's", async () => {
    wrap();
    await screen.findByText("Aisha Khan");
    const first = api.fetchLeadTasks.mock.calls[0][0];
    expect(first.when).toBe("today");
    const until = new Date(first.until);
    expect([until.getHours(), until.getMinutes()]).toEqual([23, 59]);
    fireEvent.click(screen.getByRole("tab", { name: "Today" }));
    fireEvent.click(await screen.findByLabelText("Show everyone's"));
    await waitFor(() => expect(api.fetchLeadTasks).toHaveBeenLastCalledWith(expect.objectContaining({ everyone: true })));
  });

  it("staff don't get the everyone option", async () => {
    wrap({ isManager: false });
    fireEvent.click(await screen.findByRole("tab", { name: "Today" }));
    expect(screen.queryByLabelText("Show everyone's")).toBeNull();
    expect(await screen.findByText("Nothing due today")).toBeDefined();
  });
});

describe("who sees the settings", () => {
  it("managers get the Settings button, staff don't", async () => {
    wrap();
    expect(await screen.findByRole("button", { name: "Pipeline settings" })).toBeDefined();
    cleanup();
    wrap({ isManager: false });
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("button", { name: "Pipeline settings" })).toBeNull();
  });
});
