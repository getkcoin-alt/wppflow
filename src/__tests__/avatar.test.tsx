import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Avatar } from "../components/ui/Avatar";
import { assetUrl } from "../utils/backendBase";
import { safeAvatarFallback } from "../utils/avatar";

const api = vi.hoisted(() => ({ getStoredTenantId: () => "t1" }));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { Inbox } from "../components/user/Inbox";
import type { ChatThread, WhatsAppSession } from "../types";

afterEach(cleanup);
const img = (container: HTMLElement) => container.querySelector("img") as HTMLImageElement;

describe("addresses the server gives for pictures", () => {
  it("are relative to the API, so a developer machine gets the API's own origin and a hosted one is already right", () => {
    // in the tests the page is on localhost, as on a developer machine
    expect(assetUrl("/api/avatars/chat/abc?s=1f")).toBe("http://localhost:8080/api/avatars/chat/abc?s=1f");
    expect(assetUrl("https://cdn.example/pic.jpg")).toBe("https://cdn.example/pic.jpg");
    expect(assetUrl("")).toBe("");
  });
});

describe("a person's picture", () => {
  it("is the one the server gave, loaded only when it comes into view, and never sent the page's address", () => {
    const { container } = render(<Avatar src="/api/avatars/chat/c1?s=abc" name="Asha Rao" className="w-12" />);
    const i = img(container);
    expect(i.getAttribute("src")).toBe("http://localhost:8080/api/avatars/chat/c1?s=abc");
    expect(i.getAttribute("loading")).toBe("lazy");
    expect(i.getAttribute("decoding")).toBe("async");
    expect(i.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(i.getAttribute("alt")).toBe("");
    expect(i.className).toBe("w-12");
  });

  it("is their initials when there is no picture to show", () => {
    const { container } = render(<Avatar src="" name="Asha Rao" />);
    expect(img(container).getAttribute("src")).toBe(safeAvatarFallback("Asha Rao"));
    const group = render(<Avatar name="Team chat" isGroup />);
    expect(img(group.container).getAttribute("src")).toBe(safeAvatarFallback("Team chat", true));
  });

  it("becomes their initials, once, if the picture cannot be loaded, and stays that way", () => {
    const { container } = render(<Avatar src="/api/avatars/chat/c1?s=abc" name="Asha Rao" />);
    fireEvent.error(img(container));
    expect(img(container).getAttribute("src")).toBe(safeAvatarFallback("Asha Rao"));
    // the initials are a drawing, not an address: if they somehow raise an error there is nothing more to try and no loop
    fireEvent.error(img(container));
    expect(img(container).getAttribute("src")).toBe(safeAvatarFallback("Asha Rao"));
  });

  it("is tried again when the chat is given a different picture", () => {
    const { container, rerender } = render(<Avatar src="/api/avatars/chat/c1?s=abc" name="Asha Rao" />);
    fireEvent.error(img(container));
    rerender(<Avatar src="/api/avatars/chat/c2?s=def" name="Ben Hall" />);
    expect(img(container).getAttribute("src")).toBe("http://localhost:8080/api/avatars/chat/c2?s=def");
  });
});

describe("in the inbox", () => {
  const line = (): WhatsAppSession => ({ id: "s1", sessionKey: "line-1", name: "Sales line", status: "CONNECTED", phone: "971500000000" }) as unknown as WhatsAppSession;
  const chat = (over: Partial<ChatThread>): ChatThread => ({
    id: "conv_1", contactId: "cont_1", contactName: "Aisha Khan", phone: "971500000001", avatar: "", unreadCount: 0, isGroup: false, channel: "line-1", assignedTo: "", tags: [],
    lastMessage: { text: "hello", timestamp: "10:30 AM", status: "delivered", fromMe: false }, ...over,
  });
  const contact = { id: "cont_1", name: "Aisha Khan", whatsappName: "Aisha", phone: "971500000001", email: "", avatar: "/api/avatars/contact/cont_1?s=zz", labels: [], tags: [], storeConnected: false, notes: [], orders: [] };

  it("each chat in the list and the open chat's header show the picture the server gave, and a chat without one shows initials", () => {
    Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
    const chats = [chat({ avatar: "/api/avatars/chat/conv_1?s=aa" }), chat({ id: "conv_2", contactId: "cont_2", contactName: "Ben Hall", avatar: "" })];
    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Inbox
          chats={chats} messages={{}} contacts={{ cont_1: contact }} cannedReplies={[]} sessions={[line()]} selectedChatId="conv_1"
          onSendMessage={vi.fn()} onSendAttachment={vi.fn()} onAssignAgent={vi.fn()} onToggleResolve={vi.fn()} onOpenChat={vi.fn()} onSyncInbox={vi.fn()}
        />
      </QueryClientProvider>,
    );
    const sources = [...container.querySelectorAll("img")].map((i) => i.getAttribute("src") || "");
    expect(sources.filter((s) => s === "http://localhost:8080/api/avatars/chat/conv_1?s=aa").length, "the list and the header").toBeGreaterThanOrEqual(2);
    expect(sources.some((s) => s === safeAvatarFallback("Ben Hall")), "a chat without a picture shows initials").toBe(true);
    expect(screen.getAllByText("Aisha Khan").length).toBeGreaterThan(0);
  });
});
