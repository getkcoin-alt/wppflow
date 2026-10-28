import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { chatTitle, chatMatches, chatSubtitle, mobileText } from "../utils/chatName";

const api = vi.hoisted(() => ({ getStoredTenantId: () => "t1", searchInbox: vi.fn() }));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { Inbox } from "../components/user/Inbox";
import { Dock } from "../components/layout/Dock";
import { Marked } from "../components/user/SearchResults";
import type { ChatThread, WhatsAppSession } from "../types";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  api.searchInbox.mockReset();
});

describe("what a chat is called", () => {
  it("is the person's name, else their mobile number, and never a WhatsApp id", () => {
    expect(chatTitle("Asha Rao", "971500000001")).toBe("Asha Rao");
    expect(chatTitle("83752348860497@lid", "83752348860497@lid")).toBe("Unknown contact");
    expect(chatTitle("971500000001@c.us", "971500000001")).toBe("+971500000001");
    expect(chatTitle("", "971500000001@c.us")).toBe("+971500000001");
    expect(chatTitle("83752348860497@lid", "971555550100")).toBe("+971555550100");
    expect(chatTitle("120363@g.us", "120363@g.us", true)).toBe("WhatsApp Group");
    expect(mobileText("83752348860497@lid")).toBe("");
    expect(chatSubtitle({ phone: "83752348860497@lid" })).toBe("");
    expect(chatSubtitle({ phone: "971500000001", isGroup: true })).toBe("");
  });

  it("is found by name or by number in any way of writing it, and a hidden id is never matched", () => {
    const asha = { contactName: "Asha Rao", phone: "919810011122" };
    for (const q of ["asha", "RAO", "9810011122", "+91 98100 11122", "98100-11122", "(981) 001"]) expect(chatMatches(asha, q), q).toBe(true);
    for (const q of ["ben", "9810099999", "981009"]) expect(chatMatches(asha, q), q).toBe(false);
    const hidden = { contactName: "83752348860497@lid", phone: "83752348860497@lid" };
    expect(chatMatches(hidden, "83752348")).toBe(false);
    expect(chatMatches(hidden, "unknown")).toBe(true);
    expect(chatMatches({ contactName: "Team", phone: "1203@g.us", isGroup: true }, "1203")).toBe(false);
    expect(chatMatches(asha, "   ")).toBe(true);
  });
});

describe("the words found in a message", () => {
  it("are marked inside the snippet", () => {
    const { container } = render(<Marked snippet={{ text: "…quotation for the villa in Dubai…", start: "…quotation for the villa in Dubai…".indexOf("villa"), length: 5 }} />);
    expect(container.querySelector("mark")?.textContent).toBe("villa");
    expect(container.textContent).toBe("…quotation for the villa in Dubai…");
  });
});

describe("the left navigation on a short window", () => {
  it("keeps the logo and the search, notifications and profile buttons outside the scrolling part, and every screen inside it", () => {
    render(<Dock view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager bell={<button>Bell</button>} profile={<button>Me</button>} onSearch={() => {}} />);
    const scroller = screen.getByTestId("dock-scroll");
    expect(scroller.className).toContain("overflow-y-auto");
    expect(scroller.className).toContain("min-h-0");
    expect(within(scroller).getByRole("navigation", { name: "Main" })).toBeDefined();
    expect(within(scroller).getByRole("navigation", { name: "Workspace" })).toBeDefined();
    for (const outside of [screen.getByRole("button", { name: /Search and commands/ }), screen.getByText("Bell"), screen.getByText("Me")]) expect(scroller.contains(outside)).toBe(false);
  });
});

describe("searching the inbox", () => {
  const line = { id: "s1", sessionKey: "line-1", name: "Sales line", status: "CONNECTED", phone: "971500000000" } as unknown as WhatsAppSession;
  const chat = (over: Partial<ChatThread>): ChatThread => ({
    id: "c1", contactId: "p1", contactName: "Asha Rao", phone: "919810011122", avatar: "", unreadCount: 0, isGroup: false, channel: "line-1", assignedTo: "", tags: [],
    lastMessage: { text: "hello", timestamp: "10:30 AM", status: "delivered", fromMe: false }, ...over,
  });
  const chats = [
    chat({}),
    chat({ id: "c2", contactId: "p2", contactName: "83752348860497@lid", phone: "83752348860497@lid", displayPhone: "" }),
    chat({ id: "c3", contactId: "p3", contactName: "971500000001", phone: "971500000001" }),
  ];
  const mount = (props: Partial<React.ComponentProps<typeof Inbox>> = {}) => {
    Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
    return render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Inbox
          chats={chats} messages={{}} contacts={{}} cannedReplies={[]} sessions={[line]} selectedChatId="c1"
          onSendMessage={vi.fn()} onSendAttachment={vi.fn()} onAssignAgent={vi.fn()} onToggleResolve={vi.fn()} onOpenChat={vi.fn()} onSyncInbox={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    );
  };
  const type = (text: string) => fireEvent.change(screen.getByLabelText("Search conversations"), { target: { value: text } });

  it("never shows a WhatsApp id: a hidden id is a plain label and a bare number is a formatted one", () => {
    const { container } = mount();
    expect(container.textContent).not.toContain("@lid");
    expect(container.textContent).not.toContain("83752348860497");
    expect(screen.getByText("Unknown contact")).toBeDefined();
    expect(screen.getByText("+971500000001")).toBeDefined();
  });

  it("finds a chat by a number written any way, ignoring the hidden ones", () => {
    mount();
    type("+91 98100 11122");
    const list = screen.getAllByText("Asha Rao");
    expect(list.length).toBeGreaterThan(0);
    expect(screen.queryByText("Unknown contact")).toBeNull();
    type("83752348");
    expect(screen.queryByText("Unknown contact")).toBeNull();
    expect(screen.getByText(/No chats match "83752348"/)).toBeDefined();
  });

  it("looks for messages once typing pauses, shows each with its chat and the marked words, and opens the chat on a click", async () => {
    vi.useFakeTimers();
    api.searchInbox.mockResolvedValue({
      query: "villa", partial: false, chats: [],
      messages: [
        { messageId: "m1", conversationId: "far-away", fromMe: false, timestampEpoch: 1_700_000_000, snippet: { text: "…the quotation for the villa in Dubai…", start: 23, length: 5 },
          chat: { id: "far-away", contactName: "Chitra Das", phone: "919000000002", avatar: "", isGroup: false, sessionName: "line-1" } },
        { messageId: "m2", conversationId: "c1", fromMe: true, timestampEpoch: 1_700_000_100, snippet: { text: "Villa viewing at 5", start: 0, length: 5 },
          chat: { id: "c1", contactName: "83752348860497@lid", phone: "83752348860497@lid", avatar: "", isGroup: false, sessionName: "line-1" } },
      ],
    });
    const onOpenFound = vi.fn();
    mount({ onOpenFound });
    type("v");
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(api.searchInbox).not.toHaveBeenCalled();
    type("vil");
    type("villa");
    expect(api.searchInbox).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(api.searchInbox).toHaveBeenCalledTimes(1);
    expect(api.searchInbox).toHaveBeenCalledWith("villa", "");
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    const results = screen.getByRole("region", { name: "Messages found" });
    expect(within(results).getByText("Chitra Das")).toBeDefined();
    expect(within(results).getByText("Unknown contact")).toBeDefined();
    expect(results.textContent).not.toContain("@lid");
    expect(within(results).getByText("You:")).toBeDefined();
    expect([...results.querySelectorAll("mark")].map((m) => m.textContent)).toEqual(["villa", "Villa"]);
    fireEvent.click(within(results).getByText("Chitra Das"));
    expect(onOpenFound).toHaveBeenCalledWith("far-away");
  });

  it("says plainly when no message has the words, and when messages could not be searched", async () => {
    api.searchInbox.mockResolvedValueOnce({ query: "zzzz", partial: false, chats: [], messages: [] });
    mount();
    type("zzzz");
    expect(await screen.findByText("No messages contain “zzzz”.")).toBeDefined();
    cleanup();
    api.searchInbox.mockRejectedValueOnce(new Error("down"));
    mount();
    type("qqqq");
    expect(await screen.findByText("Messages could not be searched just now.")).toBeDefined();
  });

  it("keeps the search box when a search finds no chats and no number is connected, instead of showing the empty inbox", () => {
    const view = mount({ sessions: [] });
    type("zzzz");
    const again = (list: ChatThread[]) => view.rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Inbox chats={list} messages={{}} contacts={{}} cannedReplies={[]} sessions={[]} selectedChatId="" onSendMessage={vi.fn()} onSendAttachment={vi.fn()} onAssignAgent={vi.fn()} onToggleResolve={vi.fn()} onOpenChat={vi.fn()} onSyncInbox={vi.fn()} />
      </QueryClientProvider>,
    );
    again([]);
    expect(screen.getByLabelText("Search conversations")).toBeDefined();
    expect(screen.queryByText("Connect your first WhatsApp number")).toBeNull();
  });

  it("does not search messages for a single letter", async () => {
    mount();
    type("a");
    await new Promise((r) => setTimeout(r, 450));
    expect(api.searchInbox).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Messages found" })).toBeNull();
  });
});
