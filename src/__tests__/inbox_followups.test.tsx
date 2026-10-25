import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { TEAM, settings, task } from "./pipelineFixtures";

const api = vi.hoisted(() => ({
  fetchChatLead: vi.fn(),
  fetchChatTasks: vi.fn(),
  addChatTask: vi.fn(),
  updateLeadTask: vi.fn(),
  deleteLeadTask: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { Inbox } from "../components/user/Inbox";
import { LeadPanel } from "../components/pipeline/LeadPanel";
import { TodayList } from "../components/pipeline/TodayList";
import { upsertConversation } from "../services/realtimeCache";
import type { ChatThread, WhatsAppSession } from "../types";

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const line = (over: Partial<WhatsAppSession> = {}): WhatsAppSession =>
  ({ id: "s1", sessionKey: "line-1", name: "Sales line", status: "CONNECTED", phone: "971500000000", ...over }) as WhatsAppSession;
const chat = (over: Partial<ChatThread> = {}): ChatThread => ({
  id: "conv_1", contactId: "cont_1", contactName: "Aisha Khan", phone: "971500000001", avatar: "", unreadCount: 0, isGroup: false, channel: "line-1", assignedTo: "", tags: [],
  lastMessage: { text: "hello", timestamp: "10:30 AM", status: "delivered", fromMe: false }, ...over,
});
const contact = { id: "cont_1", name: "Aisha Khan", whatsappName: "Aisha", phone: "971500000001", email: "", avatar: "", labels: [], tags: [], storeConnected: false, notes: [], orders: [] };
const ago = (minutes: number) => Date.now() / 1000 - minutes * 60;

const show = (extra: Partial<React.ComponentProps<typeof Inbox>> = {}, chats: ChatThread[] = [chat()]) => {
  Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
  return wrap(
    <Inbox
      chats={chats} messages={{}} contacts={{ cont_1: contact }} cannedReplies={[]} sessions={[line()]} selectedChatId={chats[0].id}
      onSendMessage={vi.fn()} onSendAttachment={vi.fn()} onAssignAgent={vi.fn()} onToggleResolve={vi.fn()} onOpenChat={vi.fn()} onSyncInbox={vi.fn()}
      {...extra}
    />,
  );
};

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  api.fetchPipelineSettings.mockResolvedValue(settings());
});
afterEach(cleanup);

describe("chats waiting for a reply", () => {
  it("shows how long the customer has waited, in red once the reply target has passed", () => {
    show({ replyTargetMinutes: 30 }, [chat({ awaitingSince: ago(45) })]);
    const badge = screen.getByText(/Waiting 45 min/);
    expect(badge.className).toContain("text-danger");
    cleanup();
    show({ replyTargetMinutes: 30 }, [chat({ awaitingSince: ago(5) })]);
    const calm = screen.getByText(/Waiting 5 min/);
    expect(calm.className).toContain("text-warn");
    expect(calm.className).not.toContain("text-danger");
  });

  it("shows nothing for answered chats, resolved chats, groups or a wait under a minute", () => {
    show({}, [chat({ awaitingSince: null }), chat({ id: "c2", contactId: "x2", contactName: "Closed", isClosed: true, awaitingSince: ago(90) }), chat({ id: "c3", contactId: "x3", contactName: "Team group", isGroup: true, awaitingSince: ago(90) }), chat({ id: "c4", contactId: "x4", contactName: "Fresh", awaitingSince: ago(0.2) })]);
    expect(screen.queryByText(/Waiting/)).toBeNull();
  });

  it("filters the list to chats that are waiting, or waiting past the target, and to a team", async () => {
    const onFilterChange = vi.fn();
    show({ onFilterChange, teams: ["sales", "support"] });
    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    const panel = within(screen.getByRole("group", { name: "Chat filters" }));
    fireEvent.click(panel.getByRole("button", { name: "Waiting" }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "", expect.objectContaining({ waiting: "waiting", team: "" })));
    fireEvent.click(panel.getByRole("button", { name: "Overdue" }));
    fireEvent.click(within(panel.getByRole("group", { name: "Team" })).getByRole("button", { name: "sales" }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "", expect.objectContaining({ waiting: "overdue", team: "sales" })));
    expect(screen.getByRole("button", { name: /Filters/ }).textContent).toContain("2");
    fireEvent.click(panel.getByRole("button", { name: "Clear all filters" }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "", expect.objectContaining({ waiting: "", team: "" })));
  });

  it("offers a team filter only when there is more than one team", () => {
    show({ teams: ["sales"] });
    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    expect(screen.queryByRole("group", { name: "Team" })).toBeNull();
  });
});

describe("pinned chats", () => {
  it("pins and unpins the open chat from its header, and marks a pinned chat in the list", () => {
    const onTogglePin = vi.fn();
    show({ onTogglePin });
    fireEvent.click(screen.getByRole("button", { name: "Pin chat" }));
    expect(onTogglePin).toHaveBeenCalledWith("conv_1", true);
    cleanup();
    show({ onTogglePin }, [chat({ isPinned: true })]);
    expect(screen.getByLabelText("Pinned")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Unpin chat" }));
    expect(onTogglePin).toHaveBeenLastCalledWith("conv_1", false);
  });

  it("keeps a busy chat below the pinned ones when a new message arrives", () => {
    const qc = new QueryClient();
    const row = (id: string, epoch: number, over: Partial<ChatThread> = {}) => ({ ...chat({ id, contactName: id }), lastActiveEpoch: epoch, ...over }) as any;
    qc.setQueryData(["conversations", "t1", {}], { pages: [{ conversations: [row("pinned", 100, { isPinned: true }), row("recent", 500), row("older", 400)], nextCursor: null, hasMore: false }], pageParams: [null] });
    upsertConversation(qc, "t1", row("older", 900));
    const order = (qc.getQueryData(["conversations", "t1", {}]) as any).pages[0].conversations.map((c: any) => c.id);
    expect(order).toEqual(["pinned", "older", "recent"]);
  });

  it("does not add a chat to a filtered list it was not already in", () => {
    const qc = new QueryClient();
    const row = (id: string, epoch: number, over: Partial<ChatThread> = {}) => ({ ...chat({ id, contactName: id }), lastActiveEpoch: epoch, ...over }) as any;
    for (const filter of [{ overdue: "1" }, { awaiting: "1" }, { team: "sales" }])
      qc.setQueryData(["conversations", "t1", filter], { pages: [{ conversations: [row("a", 100)], nextCursor: null, hasMore: false }], pageParams: [null] });
    upsertConversation(qc, "t1", row("b", 900));
    for (const filter of [{ overdue: "1" }, { awaiting: "1" }, { team: "sales" }])
      expect((qc.getQueryData(["conversations", "t1", filter]) as any).pages[0].conversations.map((c: any) => c.id)).toEqual(["a"]);
  });
});

describe("two people answering one customer", () => {
  it("tells you a teammate is writing a reply to the open chat", () => {
    show({ typing: { conv_1: ["Priya"] } });
    expect(screen.getByRole("status").textContent).toContain("Priya is writing a reply to this customer");
    cleanup();
    show({ typing: { conv_1: ["Priya", "Dev"] } });
    expect(screen.getByRole("status").textContent).toContain("Priya and Dev are writing a reply");
    cleanup();
    show({ typing: { other: ["Priya"] } });
    expect(screen.queryByText(/writing a reply/)).toBeNull();
  });

  it("tells the others when you start and stop writing, without repeating on every key", () => {
    const onCompose = vi.fn();
    show({ onCompose });
    const box = screen.getByLabelText("Write a message");
    fireEvent.change(box, { target: { value: "H" } });
    fireEvent.change(box, { target: { value: "Hi" } });
    fireEvent.change(box, { target: { value: "Hi there" } });
    expect(onCompose.mock.calls).toEqual([["conv_1", true]]);
    fireEvent.change(box, { target: { value: "" } });
    expect(onCompose.mock.calls).toEqual([["conv_1", true], ["conv_1", false]]);
  });

  it("says nothing while you write a private team note", () => {
    const onCompose = vi.fn();
    show({ onCompose });
    fireEvent.click(screen.getByRole("tab", { name: /Team note/ }));
    fireEvent.change(screen.getByLabelText("Write a private team note"), { target: { value: "ask finance" } });
    expect(onCompose).not.toHaveBeenCalled();
  });
});

describe("follow-ups on a chat with no lead", () => {
  const bar = (isManager = true) =>
    wrap(<LeadPanel conversationId="chat-1" contactName="Aisha Khan" teammates={TEAM} aiAvailable isManager={isManager} onOpenChat={vi.fn()} />);

  it("sets one from the chat, and it is listed", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: null });
    api.fetchChatTasks.mockResolvedValue([]);
    api.addChatTask.mockResolvedValue([]);
    bar(false);
    fireEvent.click(await screen.findByRole("button", { name: "Follow-up" }));
    const d = within(await screen.findByRole("dialog", { name: "Follow-up" }));
    await waitFor(() => expect(api.fetchChatTasks).toHaveBeenCalledWith("chat-1"));
    expect(await d.findByText(/Nothing planned/)).toBeDefined();
    expect(d.queryByLabelText("Give it to")).toBeNull();
    fireEvent.change(d.getByLabelText("Follow-up"), { target: { value: "Ask about the deposit" } });
    fireEvent.click(d.getByRole("button", { name: "In 3 days" }));
    await waitFor(() => expect(api.addChatTask).toHaveBeenCalledWith("chat-1", { title: "Ask about the deposit", dueAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) }));
  });

  it("lets a manager give it to a teammate, hand an existing one on, and see that it was escalated", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: null });
    api.fetchChatTasks.mockResolvedValue([task({ id: "t9", leadId: null, chatId: "chat-1", title: "Call back", escalated: true })]);
    api.addChatTask.mockResolvedValue([]);
    api.updateLeadTask.mockResolvedValue({ task: task() });
    bar();
    fireEvent.click(await screen.findByRole("button", { name: "Follow-up" }));
    const d = within(await screen.findByRole("dialog", { name: "Follow-up" }));
    expect(await d.findByText("Escalated")).toBeDefined();
    fireEvent.change(d.getByLabelText("Who has “Call back”"), { target: { value: "1" } });
    await waitFor(() => expect(api.updateLeadTask).toHaveBeenCalledWith("t9", { assignedUserId: 1 }));
    fireEvent.change(d.getByLabelText("Give it to"), { target: { value: "1" } });
    fireEvent.click(d.getByRole("button", { name: "Next week" }));
    await waitFor(() => expect(api.addChatTask).toHaveBeenCalledWith("chat-1", expect.objectContaining({ assignedUserId: 1 })));
  });

  it("shows the server's reason when it can't be saved", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: null });
    api.fetchChatTasks.mockResolvedValue([]);
    api.addChatTask.mockRejectedValue(new Error("You can only plan a follow-up on a chat you can open"));
    bar();
    fireEvent.click(await screen.findByRole("button", { name: "Follow-up" }));
    const d = within(await screen.findByRole("dialog", { name: "Follow-up" }));
    fireEvent.click(await d.findByRole("button", { name: "Tomorrow" }));
    expect(await d.findByText(/only plan a follow-up on a chat you can open/)).toBeDefined();
  });
});

describe("the Today list", () => {
  const list = (tasks: any[], props: Record<string, unknown> = {}) =>
    wrap(<TodayList tasks={tasks} onDone={vi.fn()} onSnooze={vi.fn()} onOpenLead={vi.fn()} onOpenChat={vi.fn()} {...props} />);

  it("lists a follow-up that belongs to a chat rather than a lead, with no link to a lead", () => {
    const onOpenLead = vi.fn();
    list([task({ id: "c1", leadId: null, chatId: "chat-9", conversationId: "chat-9", leadTitle: "", stageName: "", contactName: "Bilal", title: "Ask about the deposit" })], { onOpenLead });
    expect(screen.getByText("Ask about the deposit")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Bilal" })).toBeNull();
    expect(screen.getByText("Bilal")).toBeDefined();
    expect(screen.getByRole("button", { name: /Open the chat with Bilal/ })).toBeDefined();
    expect(onOpenLead).not.toHaveBeenCalled();
  });

  it("marks escalated follow-ups, and lets a manager hand one to someone else", () => {
    const onReassign = vi.fn();
    list([task({ escalated: true, title: "Send the brochure" }), task({ id: "t2", title: "Fine" })], { teammates: TEAM, onReassign });
    expect(screen.getAllByText("Escalated")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Give “Send the brochure” to"), { target: { value: "1" } });
    expect(onReassign).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }), 1);
  });

  it("has no hand-over control for staff", () => {
    list([task()], { teammates: TEAM });
    expect(screen.queryByLabelText(/to$/)).toBeNull();
  });
});
