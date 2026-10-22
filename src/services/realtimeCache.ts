import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { AppNotification, ChatMessage, ChatThread } from "../types";
import { reconcileMessages } from "../utils/messages";

// The inbox keeps its server state in TanStack Query caches. Instead of refetching whole
// lists whenever something happens, these helpers apply the event's data straight to the
// caches, so the screen changes the moment the event arrives and no request is needed.

type ConversationPage = {
  conversations: ChatThread[];
  nextCursor?: string | null;
  hasMore?: boolean;
  [key: string]: unknown;
};
type MessagePage = { messages: ChatMessage[]; [key: string]: unknown };
type ListFilter = { search?: string; filter?: string; sessionName?: string };

const epochOf = (c: Partial<ChatThread> & { lastActiveEpoch?: number }) =>
  Number(c.lastActiveEpoch || 0);

// Would this conversation appear in a list loaded with these filters?
function belongsIn(conv: ChatThread, f: ListFilter) {
  if (f.search?.trim()) return false; // searches are only updated for rows they already show
  // A list for one WhatsApp number never takes in another number's chats.
  if (f.sessionName && conv.channel !== f.sessionName) return false;
  if (f.filter === "unread") return conv.unreadCount > 0;
  if (f.filter === "groups") return conv.isGroup;
  return true;
}

export function upsertConversation(
  qc: QueryClient,
  tenant: string | null,
  conv: ChatThread,
) {
  qc.getQueriesData<InfiniteData<ConversationPage>>({
    queryKey: ["conversations", tenant],
  }).forEach(([key, data]) => {
    if (!data?.pages?.length) return;
    const f = (key[2] || {}) as ListFilter;
    let previous: ChatThread | undefined;
    const pages = data.pages.map((p) => ({
      ...p,
      conversations: p.conversations.filter((c) => {
        if (c.id !== conv.id) return true;
        previous = c;
        return false;
      }),
    }));
    const wanted = previous
      ? f.search?.trim()
        ? true
        : belongsIn(conv, f)
      : belongsIn(conv, f);
    if (!wanted) {
      qc.setQueryData(key, { ...data, pages });
      return;
    }
    const first = pages[0];
    // Unchanged activity => keep its place; newer activity => it belongs near the top.
    if (previous && epochOf(previous) === epochOf(conv)) {
      const rebuilt = data.pages.map((p) => ({
        ...p,
        conversations: p.conversations.map((c) =>
          c.id === conv.id ? conv : c,
        ),
      }));
      qc.setQueryData(key, { ...data, pages: rebuilt });
      return;
    }
    let at = first.conversations.findIndex((c) => epochOf(c) < epochOf(conv));
    if (at === -1) {
      // Older than everything on the first page: only place it if that page is the whole list.
      if (first.hasMore && !previous)
        return qc.setQueryData(key, { ...data, pages });
      at = first.conversations.length;
    }
    first.conversations.splice(at, 0, conv);
    qc.setQueryData(key, { ...data, pages });
  });
}

export function upsertMessage(
  qc: QueryClient,
  tenant: string | null,
  conversationId: string,
  message: ChatMessage,
) {
  const key = ["messages", tenant, conversationId];
  const data = qc.getQueryData<InfiniteData<MessagePage>>(key);
  if (!data?.pages?.length) return; // not open: it loads fresh when opened
  const pages = [...data.pages];
  pages[0] = {
    ...pages[0],
    messages: reconcileMessages(pages[0].messages, [message]),
  };
  qc.setQueryData(key, { ...data, pages });
}

export function patchMessageStatus(
  qc: QueryClient,
  tenant: string | null,
  conversationId: string,
  update: {
    messageId?: string;
    providerMessageId?: string;
    ack?: number;
    status?: string;
  },
) {
  const key = ["messages", tenant, conversationId];
  const data = qc.getQueryData<InfiniteData<MessagePage>>(key);
  if (!data?.pages?.length) return;
  let changed = false;
  const pages = data.pages.map((p) => ({
    ...p,
    messages: p.messages.map((m) => {
      const same =
        (update.messageId && m.id === update.messageId) ||
        (update.providerMessageId &&
          m.providerMessageId === update.providerMessageId);
      if (!same) return m;
      const ack = update.ack ?? m.ack ?? 0;
      const failed =
        update.status === "failed" || update.status === "uncertain";
      // Receipts only move forward; a failure may replace "still sending".
      if (!failed && ack < (m.ack || 0)) return m;
      changed = true;
      return {
        ...m,
        ack: failed ? m.ack : ack,
        status: (update.status as ChatMessage["status"]) || m.status,
      };
    }),
  }));
  if (changed) qc.setQueryData(key, { ...data, pages });
}

// Apply a batch of changed conversations (the catch-up response).
export function applyConversationChanges(
  qc: QueryClient,
  tenant: string | null,
  conversations: ChatThread[],
) {
  for (const c of conversations) upsertConversation(qc, tenant, c);
  return new Set(conversations.map((c) => c.id));
}

type NotificationData = {
  notifications: AppNotification[];
  unreadCount: number;
  nextCursor?: string | null;
};

// A pushed notification goes to the top of the bell and bumps the badge — once, even if the
// same event is delivered twice.
export function upsertNotification(
  qc: QueryClient,
  tenant: string | null,
  n: AppNotification,
) {
  const key = ["notifications", tenant];
  const data = qc.getQueryData<NotificationData>(key);
  if (!data) return void qc.invalidateQueries({ queryKey: key });
  if (data.notifications.some((x) => x.id === n.id)) return;
  qc.setQueryData<NotificationData>(key, {
    ...data,
    notifications: [n, ...data.notifications],
    unreadCount: data.unreadCount + (n.read ? 0 : 1),
  });
}

export function markNotificationsRead(
  qc: QueryClient,
  tenant: string | null,
  which: string | "all",
) {
  const key = ["notifications", tenant];
  const data = qc.getQueryData<NotificationData>(key);
  if (!data) return;
  let cleared = 0;
  const notifications = data.notifications.map((n) => {
    if ((which === "all" || n.id === which) && !n.read) {
      cleared++;
      return { ...n, read: true };
    }
    return n;
  });
  qc.setQueryData<NotificationData>(key, {
    ...data,
    notifications,
    // Older, not-yet-loaded notifications also clear when marking everything read.
    unreadCount: which === "all" ? 0 : Math.max(0, data.unreadCount - cleared),
  });
}
