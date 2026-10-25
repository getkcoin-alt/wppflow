import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import { Inbox } from "../components/user/Inbox";
import { ChatThread, ChatMessage, WhatsAppSession } from "../types";

const mockSessions: WhatsAppSession[] = [
  {
    id: "sess_1",
    sessionKey: "sales-primary",
    displayName: "Sales Primary",
    phone: "+1 555-0100",
    status: "CONNECTED",
    battery: 100,
    isCharging: true,
    antiBanHealth: 98,
    warmupDay: 14,
    proxyIp: "127.0.0.1",
    messagesSentToday: 12,
    messagesLimitToday: 3000,
    lastActive: "Just now",
    wppVersion: "2.3000.101",
    channel: "sales",
  },
];

const mockChats: ChatThread[] = [
  {
    id: "conv_1",
    contactId: "cont_1",
    contactName: "Alice Johnson",
    phone: "+1 555-0101",
    avatar: "",
    unreadCount: 2,
    isGroup: false,
    channel: "sales",
    assignedTo: "Aarav Mehta",
    tags: ["VIP", "Customer"],
    lastMessage: {
      text: "Can you confirm order #4120?",
      timestamp: "10:30 AM",
      status: "delivered",
      fromMe: false,
    },
  },
  {
    id: "conv_2",
    contactId: "cont_2",
    contactName: "Product VIP Group",
    phone: "12036304@g.us",
    avatar: "",
    unreadCount: 0,
    isGroup: true,
    groupMembersCount: 15,
    channel: "sales",
    assignedTo: "Priya Sharma",
    tags: ["Community"],
    lastMessage: {
      text: "Thanks everyone for joining!",
      timestamp: "Yesterday",
      status: "read",
      fromMe: true,
    },
  },
];

const mockMessages: Record<string, ChatMessage[]> = {
  conv_1: [
    {
      id: "msg_1",
      chatId: "conv_1",
      sender: "customer",
      text: "Can you confirm order #4120?",
      type: "text",
      timestamp: "10:30 AM",
      status: "delivered",
    },
  ],
};

const mockContacts = {
  cont_1: {
    id: "cont_1",
    name: "Alice Johnson",
    phone: "+1 555-0101",
    email: "alice@example.com",
    avatar: "",
    tags: ["VIP", "Customer"],
    lifetimeValue: 1250,
    orders: [
      {
        id: "ord_1",
        orderNumber: "ORD-4120",
        date: "Yesterday",
        total: 240,
        currency: "USD",
        status: "Processing",
        itemsSummary: "2x Silk shirts",
      },
    ],
    notes: [],
  },
};

describe("Inbox component", () => {
  it("renders chat threads and header indicators", () => {
    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("Product VIP Group")).toBeDefined();
    expect(screen.getByText("Inbox")).toBeDefined();
    expect(screen.getByText("1 number connected")).toBeDefined();
  });

  it("filters conversation list when clicking Unread or Groups pills", () => {
    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />,
    );

    // Click 'Unread' filter pill
    const unreadButton = screen.getByRole("tab", { name: /Unread/i });
    fireEvent.click(unreadButton);

    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.queryByText("Product VIP Group")).toBeNull();

    // Click 'Groups' filter pill
    const groupsButton = screen.getByRole("tab", { name: /Groups/i });
    fireEvent.click(groupsButton);

    expect(screen.queryByText("Product VIP Group")).toBeDefined();
  });

  it("triggers onSendMessage with text when submitting composer", () => {
    const handleSendMessage = vi.fn();

    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        onSendMessage={handleSendMessage}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Write a message");
    fireEvent.change(input, { target: { value: "Your order is confirmed!" } });

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(handleSendMessage).toHaveBeenCalledWith(
      "conv_1",
      "Your order is confirmed!",
      false,
    );
  });

  describe("a chat whose messages are not saved yet", () => {
    const base = (extra: Record<string, unknown>, onOpenChat = vi.fn()) =>
      render(
        <Inbox
          chats={mockChats}
          messages={{ conv_1: [] }}
          contacts={mockContacts}
          cannedReplies={[]}
          sessions={mockSessions}
          selectedChatId="conv_1"
          onSendMessage={vi.fn()}
          onSendAttachment={vi.fn()}
          onAssignAgent={vi.fn()}
          onToggleResolve={vi.fn()}
          onOpenChat={onOpenChat}
          onSyncInbox={vi.fn()}
          {...extra}
        />,
      );

    it("says it is loading from WhatsApp instead of claiming the chat is empty", () => {
      base({ historyStatus: { loading: true } });
      expect(screen.getByText("Loading messages from WhatsApp…")).toBeDefined();
      expect(screen.queryByText(/No messages yet\. Send a message/)).toBeNull();
    });

    it("explains why history could not be loaded and offers to try again", () => {
      const open = vi.fn();
      base(
        {
          historyStatus: {
            loading: false,
            note: "WhatsApp could not load this chat's history right now (WhatsApp session is offline).",
          },
        },
        open,
      );
      expect(screen.getByText(/session is offline/)).toBeDefined();
      fireEvent.click(screen.getByText("Try again"));
      expect(open).toHaveBeenCalledWith("conv_1", true);
    });

    it("keeps the plain empty message for a genuinely new chat", () => {
      base({ historyStatus: null });
      expect(
        screen.getByText(
          /No messages yet\. Send a message to start the conversation!/,
        ),
      ).toBeDefined();
    });
  });

  describe("files that were never saved", () => {
    const base = (extra: Record<string, unknown>) =>
      render(
        <Inbox
          chats={mockChats}
          messages={mockMessages}
          contacts={mockContacts}
          cannedReplies={[]}
          sessions={mockSessions}
          selectedChatId="conv_1"
          onSendMessage={vi.fn()}
          onSendAttachment={vi.fn()}
          onAssignAgent={vi.fn()}
          onToggleResolve={vi.fn()}
          onOpenChat={vi.fn()}
          onSyncInbox={vi.fn()}
          {...extra}
        />,
      );

    it("offers to load a whole chat's files at once", () => {
      const loadAll = vi.fn();
      base({ mediaPending: 3, onLoadAllMedia: loadAll });
      expect(
        screen.getByText(/3 files in this chat aren't saved yet/),
      ).toBeDefined();
      fireEvent.click(screen.getByText("Load them all"));
      expect(loadAll).toHaveBeenCalledWith("conv_1");
    });

    it("shows progress while loading and the outcome afterwards", () => {
      const { unmount } = base({
        mediaPending: 2,
        onLoadAllMedia: vi.fn(),
        mediaProgress: { chatId: "conv_1", loading: true, saved: 4, failed: 1 },
      });
      expect(
        screen.getByText(/Loading files from WhatsApp… 4 saved, 1 unavailable/),
      ).toBeDefined();
      unmount();
      base({
        mediaPending: 0,
        onLoadAllMedia: vi.fn(),
        mediaProgress: {
          chatId: "conv_1",
          loading: false,
          saved: 5,
          failed: 0,
        },
      });
      expect(screen.getByText("5 files saved.")).toBeDefined();
    });

    it("shows no banner when everything is saved", () => {
      base({ mediaPending: 0, onLoadAllMedia: vi.fn() });
      expect(screen.queryByText(/saved yet/)).toBeNull();
    });
  });
});

describe("an inbox with more than one WhatsApp number", () => {
  const second: WhatsAppSession = {
    ...mockSessions[0],
    id: "sess_2",
    sessionKey: "staff-9",
    displayName: "staff-9",
    phone: "+1 555-0200",
    ownerUserId: 9,
    ownerName: "Sam Staff",
  };
  const first: WhatsAppSession = { ...mockSessions[0], sessionKey: "staff-1", ownerUserId: 1, ownerName: "Olivia Owner" };
  const chats = [
    { ...mockChats[0], channel: "staff-1" },
    { ...mockChats[1], channel: "staff-9" },
  ];
  const numbers = () => within(screen.getByRole("group", { name: "WhatsApp number" }));
  const show = (extra: Partial<React.ComponentProps<typeof Inbox>> = {}) =>
    render(
      <Inbox
        chats={chats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={[first, second]}
        selectedChatId="conv_1"
        currentUserId={1}
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
        {...extra}
      />,
    );

  it("lets a manager switch between the numbers and asks for that number's chats", async () => {
    const onFilterChange = vi.fn();
    show({ onFilterChange });
    expect(numbers().getByRole("button", { name: "All numbers" })).toBeDefined();
    fireEvent.click(numbers().getByRole("button", { name: /Sam/ }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "staff-9", expect.objectContaining({ labels: [] })));
    fireEvent.click(numbers().getByRole("button", { name: /Olivia \(you\)/ }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "staff-1", expect.objectContaining({ labels: [] })));
    fireEvent.click(numbers().getByRole("button", { name: "All numbers" }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "", expect.objectContaining({ labels: [] })));
  });

  it("says which number each chat came in on while every number is shown together", () => {
    show();
    expect(screen.getByText("via Olivia (you)")).toBeDefined();
    expect(screen.getByText("via Sam")).toBeDefined();
  });

  it("drops those labels once a single number is chosen, and says so when it has no chats", () => {
    show({ chats: [] });
    fireEvent.click(numbers().getByRole("button", { name: /Sam/ }));
    expect(screen.queryByText(/^via /)).toBeNull();
    expect(screen.getByText("No conversations on this number yet")).toBeDefined();
  });

  it("names the number in the open conversation", () => {
    show();
    const label = screen.getByText(/· via Olivia \(you\)/);
    expect(label).toBeDefined();
    expect(label.getAttribute("title")).toBe("+15550100");
  });

  it("shows no switcher and no labels for a single number", () => {
    show({ sessions: [first] });
    expect(screen.queryByRole("group", { name: "WhatsApp number" })).toBeNull();
    expect(screen.queryByText(/^via /)).toBeNull();
  });
});

describe("the AI assistant in the inbox", () => {
  const messages = {
    conv_1: [
      { id: "m1", chatId: "conv_1", sender: "customer", text: "مرحبا، هل الشقة متاحة؟", type: "text", timestamp: "10:30 AM", status: "delivered" },
      { id: "m2", chatId: "conv_1", sender: "agent", agentName: "Sam", text: "Yes it is.", type: "text", timestamp: "10:31 AM", status: "read" },
    ] as ChatMessage[],
  };
  const aiClient = {
    suggestReply: vi.fn().mockResolvedValue({ text: "Yes, shall we arrange a viewing?" }),
    summarize: vi.fn(),
    improve: vi.fn(),
    translate: vi.fn().mockResolvedValue({ text: "Hello, is the flat available?" }),
  };
  const show = (assistant?: { available: boolean; locked?: boolean }) =>
    render(
      <Inbox
        chats={mockChats}
        messages={messages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        assistant={assistant}
        aiClient={aiClient}
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />,
    );

  it("adds Ask Riwo to the composer and puts a suggestion in the message box when it is used", async () => {
    show({ available: true });
    fireEvent.click(screen.getByRole("button", { name: "Ask Riwo" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Ask Riwo" })).getByRole("button", { name: "Friendly" }));
    expect(await screen.findByText("Yes, shall we arrange a viewing?")).toBeDefined();
    expect(aiClient.suggestReply).toHaveBeenCalledWith("conv_1", "friendly");
    const box = screen.getByLabelText("Write a message") as HTMLInputElement;
    expect(box.value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Use this" }));
    expect(box.value).toBe("Yes, shall we arrange a viewing?");
    expect(screen.queryByText(/Written by AI/)).toBeNull();
  });

  it("offers to translate what a customer wrote, but not what the team wrote", async () => {
    show({ available: true });
    const links = screen.getAllByRole("button", { name: /Translate to/ });
    expect(links).toHaveLength(1);
    fireEvent.click(links[0]);
    expect(await screen.findByText("Hello, is the flat available?")).toBeDefined();
    expect(aiClient.translate).toHaveBeenCalledWith("مرحبا، هل الشقة متاحة؟", "English");
  });

  it("shows Arabic and other right-to-left text the right way round", () => {
    show({ available: true });
    expect(screen.getByText("مرحبا، هل الشقة متاحة؟").getAttribute("dir")).toBe("auto");
  });

  it("shows nothing at all when the assistant isn't available to this company", () => {
    show({ available: false });
    expect(screen.queryByRole("button", { name: "Ask Riwo" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Translate to/ })).toBeNull();
    expect(screen.queryByText(/Riwo/)).toBeNull();
  });

  it("tells a plan that doesn't include it, instead of hiding it", () => {
    show({ available: false, locked: true });
    expect(screen.getByText("Riwo · Growth plan")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Translate to/ })).toBeNull();
  });
});

describe("the sales bar under a chat's header", () => {
  const open = (selectedChatId: string, renderLeadPanel?: (chat: ChatThread) => React.ReactNode) =>
    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId={selectedChatId}
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
        renderLeadPanel={renderLeadPanel}
      />,
    );

  it("shows what the app puts there, for the chat that is open", () => {
    open("conv_1", (chat) => <div>Pipeline bar for {chat.contactName}</div>);
    expect(screen.getByText("Pipeline bar for Alice Johnson")).toBeDefined();
  });

  it("is not shown for a group, which is never a lead", () => {
    open("conv_2", () => <div>Pipeline bar</div>);
    expect(screen.queryByText("Pipeline bar")).toBeNull();
  });

  it("is simply absent on a plan without the pipeline", () => {
    open("conv_1", undefined);
    expect(screen.queryByText(/Pipeline bar/)).toBeNull();
  });
});
