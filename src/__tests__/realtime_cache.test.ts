import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  applyConversationChanges,
  patchMessageStatus,
  upsertConversation,
  upsertMessage,
} from "../services/realtimeCache";

const T = "tenant_1";
const conv = (id: string, epoch: number, over: any = {}) =>
  ({
    id,
    contactName: id,
    unreadCount: 0,
    isGroup: false,
    lastActiveEpoch: epoch,
    lastMessage: { text: "x" },
    ...over,
  }) as any;
const msg = (id: string, epoch: number, over: any = {}) =>
  ({
    id,
    chatId: "c1",
    sender: "customer",
    text: id,
    ack: 0,
    status: "delivered",
    timestampEpoch: epoch,
    ...over,
  }) as any;

function listWith(qc: QueryClient, filter: any, rows: any[], hasMore = false) {
  qc.setQueryData(["conversations", T, filter], {
    pages: [{ conversations: rows, nextCursor: null, hasMore }],
    pageParams: [null],
  });
}
const ids = (qc: QueryClient, filter: any) =>
  (qc.getQueryData(["conversations", T, filter]) as any).pages.flatMap(
    (p: any) => p.conversations.map((c: any) => c.id),
  );

describe("conversation list updates in place", () => {
  it("moves a conversation with new activity to the top without refetching", () => {
    const qc = new QueryClient();
    const f = { search: "", filter: "all" };
    listWith(qc, f, [conv("a", 300), conv("b", 200), conv("c", 100)]);
    upsertConversation(qc, T, conv("c", 400, { unreadCount: 1 }));
    expect(ids(qc, f)).toEqual(["c", "a", "b"]);
    expect(
      (qc.getQueryData(["conversations", T, f]) as any).pages[0]
        .conversations[0].unreadCount,
    ).toBe(1);
  });

  it("adds a brand-new chat at the top and keeps place when only metadata changed", () => {
    const qc = new QueryClient();
    const f = { search: "", filter: "all" };
    listWith(qc, f, [conv("a", 300), conv("b", 200)]);
    upsertConversation(qc, T, conv("new", 500));
    upsertConversation(qc, T, conv("b", 200, { assignedTo: "Sam" }));
    expect(ids(qc, f)).toEqual(["new", "a", "b"]);
    expect(
      (qc.getQueryData(["conversations", T, f]) as any).pages[0]
        .conversations[2].assignedTo,
    ).toBe("Sam");
  });

  it("respects filters: unread lists drop read chats, group lists ignore direct chats, searches only update rows they show", () => {
    const qc = new QueryClient();
    const unread = { search: "", filter: "unread" },
      groups = { search: "", filter: "groups" },
      search = { search: "ali", filter: "all" };
    listWith(qc, unread, [conv("a", 300, { unreadCount: 2 })]);
    listWith(qc, groups, [conv("g", 250, { isGroup: true })]);
    listWith(qc, search, [conv("a", 300, { contactName: "Alice" })]);
    upsertConversation(qc, T, conv("a", 300, { unreadCount: 0 })); // read elsewhere
    upsertConversation(qc, T, conv("d", 600, { unreadCount: 1 })); // new direct chat
    expect(ids(qc, unread)).toEqual(["d"]);
    expect(ids(qc, groups)).toEqual(["g"]);
    expect(ids(qc, search)).toEqual(["a"]);
  });

  it("does not insert an old chat into a first page that is only part of the list", () => {
    const qc = new QueryClient();
    const f = { search: "", filter: "all" };
    listWith(qc, f, [conv("a", 300), conv("b", 200)], true);
    upsertConversation(qc, T, conv("ancient", 5));
    expect(ids(qc, f)).toEqual(["a", "b"]);
  });

  it("applies a whole catch-up batch and reports which chats changed", () => {
    const qc = new QueryClient();
    const f = { search: "", filter: "all" };
    listWith(qc, f, [conv("a", 300), conv("b", 200)]);
    const changed = applyConversationChanges(qc, T, [
      conv("b", 700),
      conv("z", 650),
    ]);
    expect([...changed].sort()).toEqual(["b", "z"]);
    expect(ids(qc, f)).toEqual(["b", "z", "a"]);
  });
});

describe("open conversation updates in place", () => {
  const open = (qc: QueryClient, rows: any[]) =>
    qc.setQueryData(["messages", T, "c1"], {
      pages: [{ messages: rows, nextCursor: null, hasMore: false }],
      pageParams: [null],
    });
  const rows = (qc: QueryClient) =>
    (qc.getQueryData(["messages", T, "c1"]) as any).pages[0].messages;

  it("appends a new message once, even if the event is delivered twice", () => {
    const qc = new QueryClient();
    open(qc, [msg("m1", 100)]);
    upsertMessage(qc, T, "c1", msg("m2", 200));
    upsertMessage(qc, T, "c1", msg("m2", 200));
    expect(rows(qc).map((m: any) => m.id)).toEqual(["m1", "m2"]);
  });

  it("ignores conversations that are not open", () => {
    const qc = new QueryClient();
    upsertMessage(qc, T, "c9", msg("m1", 100));
    expect(qc.getQueryData(["messages", T, "c9"])).toBeUndefined();
  });

  it("moves ticks forward only, and lets a failure replace 'sending'", () => {
    const qc = new QueryClient();
    open(qc, [
      msg("m1", 100, {
        providerMessageId: "p1",
        ack: 2,
        status: "delivered",
        sender: "agent",
      }),
      msg("m2", 110, { ack: 0, status: "sending", sender: "agent" }),
    ]);
    patchMessageStatus(qc, T, "c1", {
      providerMessageId: "p1",
      ack: 1,
      status: "sent",
    });
    expect(rows(qc)[0].ack).toBe(2); // a late "sent" cannot undo "delivered"
    patchMessageStatus(qc, T, "c1", {
      providerMessageId: "p1",
      ack: 3,
      status: "read",
    });
    expect(rows(qc)[0]).toMatchObject({ ack: 3, status: "read" });
    patchMessageStatus(qc, T, "c1", { messageId: "m2", status: "failed" });
    expect(rows(qc)[1].status).toBe("failed");
  });
});
