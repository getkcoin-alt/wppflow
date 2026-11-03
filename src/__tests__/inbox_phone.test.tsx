import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Inbox } from "../components/user/Inbox";
import { ToastProvider } from "../components/mobile/Toasts";
import { chatSignal, waitingCount } from "../utils/chatSignal";
import { chatMenu, leadingSwipes, trailingSwipes, type ChatActionHandlers } from "../components/user/inbox/chatActions";
import { resetBackStack } from "../hooks/useBackClose";
import type { ChatThread, ChatMessage, WhatsAppSession } from "../types";

function media(on: (q: string) => boolean) {
  window.matchMedia = ((q: string) => ({ matches: on(q), media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
}
const phone = () => media((q) => q.includes("max-width"));

const NOW = Math.floor(Date.now() / 1000);
const session = { id: "s1", sessionKey: "front", displayName: "Front desk", phone: "+971500000000", status: "CONNECTED", channel: "sales" } as unknown as WhatsAppSession;
const chat = (over: Partial<ChatThread>): ChatThread => ({
  id: "c1",
  contactId: "k1",
  contactName: "Rashid",
  phone: "971500000101",
  avatar: "",
  unreadCount: 0,
  isGroup: false,
  channel: "sales",
  assignedTo: "",
  tags: [],
  lastMessage: { text: "hello", timestamp: "10:30 AM", status: "delivered", fromMe: false },
  ...over,
});
const chats: ChatThread[] = [
  chat({ id: "asked", contactName: "Khalid", needsHuman: true, needsHumanReason: "person", unreadCount: 2, lastMessage: { text: "Please check", timestamp: "10:31 AM", status: "delivered", fromMe: false }, labels: [{ id: "l1", name: "VIP", color: "#ff0000" }], assignedTo: "Priya" }),
  chat({ id: "waiting", contactName: "Fatima", awaitingSince: NOW - 50 * 60, unreadCount: 1, lastMessage: { text: "Is it available?", timestamp: "10:20 AM", status: "delivered", fromMe: false } }),
  chat({ id: "plain", contactName: "Sana", lastMessage: { text: "Thanks!", timestamp: "9:00 AM", status: "read", fromMe: true } }),
  chat({ id: "group", contactName: "Team group", isGroup: true, groupMembersCount: 4, phone: "1@g.us" }),
];
const messages: Record<string, ChatMessage[]> = {
  asked: [
    { id: "m1", chatId: "asked", sender: "customer", text: "Please check, this is the second time", type: "text", timestamp: "10:31 AM", status: "delivered" },
  ],
};
const contacts = { k1: { id: "k1", name: "Rashid", phone: "971500000101", labels: [], notes: [], customTraits: {} } };

const view = (over: Record<string, unknown> = {}) => {
  const props = {
    chats,
    messages,
    contacts,
    cannedReplies: [{ shortcut: "/hi", title: "Hello", text: "Hello, how can I help?" }],
    sessions: [session],
    onSendMessage: vi.fn(),
    onDeleteMessage: vi.fn(),
    onSendAttachment: vi.fn(),
    onAssignAgent: vi.fn(),
    onToggleResolve: vi.fn(),
    onOpenChat: vi.fn(),
    onSyncInbox: vi.fn(async () => {}),
    onFilterChange: vi.fn(),
    onNewChat: vi.fn(),
    onTogglePin: vi.fn(),
    onMarkRead: vi.fn(),
    teammates: [{ id: 7, name: "Karnveer" }, { id: 8, name: "Priya" }],
    currentUserId: 7,
    mediaEnabled: true,
    ...over,
  };
  const utils = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <Inbox {...(props as unknown as Parameters<typeof Inbox>[0])} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { props, ...utils };
};
// the chat's row in the list (its name is also in the open chat's header, which is not a row)
const row = (name: string) => screen.queryAllByText(name).map((el) => el.closest('[role="button"]')).find(Boolean) as HTMLElement;
const listed = (name: string) => Boolean(row(name));

beforeEach(() => {
  resetBackStack();
  window.history.replaceState(null, "");
  phone();
});
afterEach(() => {
  cleanup();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe("what a chat row says about urgency", () => {
  it("is one thing: a person was asked for, or how long they have waited, and nothing for a calm chat", () => {
    expect(chatSignal(chats[0], Date.now())).toMatchObject({ key: "asked", text: "Asked for a person", tone: "danger" });
    expect(chatSignal(chats[1], Date.now(), 90)).toMatchObject({ key: "waiting", tone: "warn" });
    expect(chatSignal(chats[1], Date.now(), 90)?.text).toMatch(/^Waiting 5\d min$/);
    expect(chatSignal(chats[2], Date.now())).toBeNull();
    expect(chatSignal(chats[3], Date.now())).toBeNull();
  });
  it("turns red once it is past the reply target, and is quiet under a minute and for a resolved chat", () => {
    expect(chatSignal(chats[1], Date.now(), 30)).toMatchObject({ key: "late", tone: "danger" });
    expect(chatSignal(chats[1], Date.now(), 90)).toMatchObject({ key: "waiting" });
    expect(chatSignal({ ...chats[1], awaitingSince: NOW - 20 }, Date.now())).toBeNull();
    expect(chatSignal({ ...chats[0], isClosed: true }, Date.now())).toBeNull();
  });
  it("counts the chats a customer is waiting on, not groups or resolved ones", () => {
    expect(waitingCount(chats)).toBe(2);
    expect(waitingCount([{ ...chats[1], isClosed: true }])).toBe(0);
  });
});

describe("what can be done with a chat", () => {
  const h = (over: Partial<ChatActionHandlers> = {}): ChatActionHandlers => ({
    me: { id: 7, name: "Karnveer" },
    canPickTeammate: true,
    onOpen: vi.fn(),
    onAssign: vi.fn(),
    onPickAssignee: vi.fn(),
    onMarkRead: vi.fn(),
    onTogglePin: vi.fn(),
    onToggleDone: vi.fn(),
    onMore: vi.fn(),
    ...over,
  });
  it("offers everything in the hold menu, and the same two-by-two on the swipes", () => {
    const c = chats[0];
    expect(chatMenu(c, h()).map((a) => a.key)).toEqual(["open", "mine", "assign", "unassign", "read", "pin", "done"]);
    expect(leadingSwipes(c, h()).map((a) => a.key)).toEqual(["mine", "read"]);
    expect(trailingSwipes(c, h()).map((a) => a.key)).toEqual(["done", "more"]);
  });
  it("does not offer what does not apply", () => {
    const mine = { ...chats[2], assignedTo: "Karnveer", unreadCount: 0, isClosed: true, isPinned: true };
    expect(chatMenu(mine, h()).map((a) => a.key)).toEqual(["open", "assign", "unassign", "pin", "done"]);
    expect(chatMenu(mine, h()).find((a) => a.key === "done")?.label).toBe("Reopen");
    expect(chatMenu(mine, h()).find((a) => a.key === "pin")?.label).toMatch(/Unpin/);
    expect(leadingSwipes(mine, h())).toEqual([]);
    expect(trailingSwipes(mine, h())[0].label).toBe("Reopen");
    expect(chatMenu(chats[2], h({ onAssign: undefined, onMarkRead: undefined, onTogglePin: undefined, onToggleDone: undefined, onPickAssignee: undefined })).map((a) => a.key)).toEqual(["open"]);
    expect(trailingSwipes(chats[2], h({ onToggleDone: undefined })).map((a) => a.key)).toEqual(["more"]);
  });
});

describe("the phone inbox", () => {
  it("shows one urgency line per row, and leaves labels and the assignee for the hold menu", () => {
    view();
    expect(within(row("Khalid")).getByText("Asked for a person")).toBeDefined();
    expect(within(row("Fatima")).getByText(/^Waiting 5\d min$/)).toBeDefined();
    expect(within(row("Sana")).queryByText(/Waiting|Asked/)).toBeNull();
    expect(within(row("Khalid")).queryByText("VIP")).toBeNull();
    expect(within(row("Khalid")).queryByText("P")).toBeNull();
    expect(within(row("Khalid")).getByText("2")).toBeDefined(); // the unread badge
  });

  it("has a title, search and filter chips instead of the desktop header, and a button for the one main thing", () => {
    view();
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Refresh from WhatsApp" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Unread" })).toBeNull();
    const chips = within(screen.getByRole("group", { name: "Show" }));
    expect(chips.getAllByRole("button").map((b) => b.textContent?.replace(/\d+$/, ""))).toEqual(["All", "Unread", "Waiting", "Mine", "Groups", "Filters"]);
    expect(screen.getByRole("button", { name: "New chat" })).toBeDefined();
  });

  it("counts what is waiting on its chip, and narrows the list from the chips", async () => {
    const { props } = view();
    expect(within(screen.getByRole("group", { name: "Show" })).getByRole("button", { name: /^Waiting/ }).textContent).toContain("2");
    fireEvent.click(screen.getByRole("button", { name: /^Unread/ }));
    expect(listed("Sana")).toBe(false);
    expect(listed("Khalid")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /^Groups/ }));
    expect(listed("Team group")).toBe(true);
    expect(listed("Khalid")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /^Waiting/ }));
    await waitFor(() => expect(props.onFilterChange).toHaveBeenLastCalledWith("", "groups", "", expect.objectContaining({ waiting: "waiting" })));
    fireEvent.click(screen.getByRole("button", { name: /^Mine/ }));
    await waitFor(() => expect(props.onFilterChange).toHaveBeenLastCalledWith("", "groups", "", expect.objectContaining({ waiting: "waiting", assigned: "me" })));
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    await waitFor(() => expect(props.onFilterChange).toHaveBeenLastCalledWith("", "all", "", expect.objectContaining({ waiting: "", assigned: "" })));
  });

  it("keeps the rest of the filters in a sheet with a live count", () => {
    view();
    fireEvent.click(screen.getByRole("button", { name: /^Filters/ }));
    const sheet = within(screen.getByRole("dialog", { name: "Filters" }));
    expect(sheet.getByRole("group", { name: "Chat filters" })).toBeDefined();
    expect(sheet.getByRole("button", { name: "Show 4 chats" })).toBeDefined();
    fireEvent.click(sheet.getByRole("button", { name: "Show 4 chats" }));
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull();
  });

  it("opens search from the icon, and Cancel puts it away", () => {
    view();
    expect(screen.queryByRole("textbox", { name: "Search conversations" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    const box = screen.getByRole("textbox", { name: "Search conversations" });
    fireEvent.change(box, { target: { value: "Sana" } });
    expect(listed("Khalid")).toBe(false);
    expect(listed("Sana")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("textbox", { name: "Search conversations" })).toBeNull();
    expect(listed("Khalid")).toBe(true);
  });

  it("warns, in one line, only when a number is not connected", () => {
    view();
    expect(screen.queryByText(/not connected/)).toBeNull();
    cleanup();
    view({ sessions: [{ ...session, status: "DISCONNECTED" }] });
    expect(screen.getByText("A number is not connected")).toBeDefined();
  });

  it("opens a chat on a tap, hides the new-chat button there, and Back returns to the list", async () => {
    const { props } = view();
    fireEvent.click(row("Khalid"));
    expect(props.onOpenChat).toHaveBeenCalledWith("asked");
    expect(screen.getByRole("button", { name: "Back to conversations" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "New chat" })).toBeNull();
    expect(window.history.state?.scriwoOverlay).toBeDefined();
    window.history.back(); // the Android button, or the iOS edge swipe
    await waitFor(() => expect(screen.getByRole("button", { name: "New chat" })).toBeDefined());
  });

  it("offers the whole menu when a row is held, and acts on a choice", () => {
    const { props } = view();
    fireEvent.contextMenu(row("Khalid"));
    const menu = within(screen.getByRole("dialog", { name: "Khalid" }));
    expect(menu.getAllByRole("button").map((b) => b.textContent)).toEqual(["Open chat", "Assign to me", "Assign to…Now: Priya", "Unassign", "Mark as read", "Pin to the top", "Mark as done"]);
    fireEvent.click(menu.getByRole("button", { name: "Assign to me" }));
    expect(props.onAssignAgent).toHaveBeenCalledWith("asked", "Karnveer");
  });

  it("finishes a chat from the menu with an Undo, and the Undo reverses it", () => {
    const { props } = view();
    fireEvent.contextMenu(row("Sana"));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Sana" })).getByRole("button", { name: "Mark as done" }));
    expect(props.onToggleResolve).toHaveBeenCalledTimes(1);
    expect(props.onToggleResolve).toHaveBeenLastCalledWith("plain", true);
    expect(screen.getByRole("status").textContent).toContain("Marked done");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    // the Undo says what it wants (open again), so it cannot be turned around by a list that has not caught up yet
    expect(props.onToggleResolve).toHaveBeenCalledTimes(2);
    expect(props.onToggleResolve).toHaveBeenLastCalledWith("plain", false);
  });

  it("picks a teammate from a second sheet", () => {
    const { props } = view();
    fireEvent.contextMenu(row("Sana"));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Sana" })).getByRole("button", { name: /Assign to…/ }));
    const pick = within(screen.getByRole("dialog", { name: "Assign to" }));
    fireEvent.click(pick.getByRole("button", { name: "Priya" }));
    expect(props.onAssignAgent).toHaveBeenCalledWith("plain", "Priya");
  });
});

describe("the phone chat", () => {
  const open = () => {
    const utils = view();
    fireEvent.click(row("Khalid"));
    return utils;
  };

  it("has a back button with the other unread chats, the name that opens the details, and one more menu", () => {
    open();
    expect(screen.getByRole("button", { name: "Back to conversations" }).textContent).toBe("1"); // Fatima
    expect(screen.queryByRole("button", { name: "Assign conversation" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark as resolved" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Details for Khalid/ }));
    expect(screen.getByRole("dialog", { name: "Details" })).toBeDefined();
  });

  it("has one row for writing: send is off until there is something, and Enter writes a new line", () => {
    const { props } = open();
    const box = screen.getByRole("textbox", { name: "Write a message" }) as HTMLTextAreaElement;
    expect((screen.getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(box, { target: { value: "On my way" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(props.onSendMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(props.onSendMessage).toHaveBeenCalledWith("asked", "On my way", false);
    expect(box.value).toBe("");
  });

  it("keeps a private note behind the + and says so in the box, and leaves with one tap", () => {
    const { props } = open();
    fireEvent.click(screen.getByRole("button", { name: "More to send" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Add to this chat" })).getByRole("button", { name: /Private team note/ }));
    expect(screen.getByText(/Private note · only your team sees it/)).toBeDefined();
    const box = screen.getByRole("textbox", { name: "Write a private team note" });
    fireEvent.change(box, { target: { value: "Call back after lunch" } });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(props.onSendMessage).toHaveBeenCalledWith("asked", "Call back after lunch", true);
    fireEvent.click(screen.getByRole("button", { name: "Leave the private note" }));
    expect(screen.queryByText(/Private note · only your team sees it/)).toBeNull();
  });

  it("puts a saved reply into the box from a sheet", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "More to send" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Add to this chat" })).getByRole("button", { name: /Quick replies/ }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Quick replies" })).getByRole("button", { name: /Hello/ }));
    expect((screen.getByRole("textbox", { name: "Write a message" }) as HTMLTextAreaElement).value).toBe("Hello, how can I help?");
  });

  it("offers Riwo's draft on the send button only when nothing is written and a customer is waiting", () => {
    const run = vi.fn();
    cleanup();
    view({ assistant: { available: true }, aiClient: { suggestReply: run, summarize: vi.fn(), improve: vi.fn(), translate: vi.fn() } });
    fireEvent.click(row("Khalid"));
    expect(screen.getByRole("button", { name: "Ask Riwo for a reply" })).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "Write a message" }), { target: { value: "Hi" } });
    expect(screen.queryByRole("button", { name: "Ask Riwo for a reply" })).toBeNull();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDefined();
  });

  const hold = (el: HTMLElement) => {
    const e = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.assign(e, { touches: [{ clientX: 10, clientY: 10 }] });
    act(() => void el.dispatchEvent(e));
  };

  it("opens a menu on a message that is held, instead of asking to delete it", () => {
    vi.useFakeTimers();
    try {
      const { props } = open();
      hold(screen.getByText("Please check, this is the second time").closest("div") as HTMLElement);
      act(() => void vi.advanceTimersByTime(600));
      const menu = within(screen.getByRole("dialog", { name: "Message" }));
      expect(menu.getAllByRole("button").map((b) => b.textContent)).toEqual(["Reply", "Copy", "Delete"]);
      expect(screen.queryByText(/Delete message\?/i)).toBeNull();
      fireEvent.click(menu.getByRole("button", { name: "Reply" }));
      expect(screen.getByText(/Replying to Khalid/)).toBeDefined();
      expect(props.onDeleteMessage).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps Translate out of the bubble, and offers it in the message menu when the company has Riwo", async () => {
    vi.useFakeTimers();
    const translate = vi.fn(async () => ({ text: "Please check" }));
    try {
      cleanup();
      view({ assistant: { available: true }, aiClient: { translate, suggestReply: vi.fn(), summarize: vi.fn(), improve: vi.fn() } });
      fireEvent.click(row("Khalid"));
      expect(screen.queryByText(/Translate to/)).toBeNull();
      expect(screen.queryByText(/Translating/)).toBeNull();
      await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
      expect(translate).not.toHaveBeenCalled(); // nothing is translated until it is asked for
      hold(screen.getByText("Please check, this is the second time").closest("div") as HTMLElement);
      act(() => void vi.advanceTimersByTime(600));
      fireEvent.click(within(screen.getByRole("dialog", { name: "Message" })).getByRole("button", { name: /Translate/ }));
      await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
      expect(translate).toHaveBeenCalledTimes(1);
      expect(screen.getAllByText("Please check").length).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
