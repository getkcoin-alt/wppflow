import React, { useRef, useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Phone,
  Lock,
  Sparkles,
  Users,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Loader2,
  Video,
  X,
  PanelRightClose,
  PanelRightOpen,
  Clock,
  ShoppingBag,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { ScriwoMark } from "../brand/Logo";
import { MediaBlock } from "./MediaBlock";
import { MediaViewer } from "./MediaViewer";
import { NumberSwitch } from "./NumberSwitch";
import { RiwoButton, RiwoTray, TranslateMessage } from "./Riwo";
import { useRiwo } from "../../hooks/useRiwo";
import type { AiClient } from "../../services/ai";
import { numberName, phoneText, sessionOfChat } from "../../utils/numbers";
import { galleryItems } from "../../utils/viewer";
import { ChatThread, ChatMessage, WhatsAppSession } from "../../types";
import { safeAvatarFallback } from "../../utils/avatar";
import { useVirtualizer } from "@tanstack/react-virtual";

interface InboxProps {
  chats: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  contacts: Record<string, any>;
  cannedReplies: { shortcut: string; title: string; text: string }[];
  sessions: WhatsAppSession[];
  selectedChatId?: string | null;
  onSendMessage: (chatId: string, text: string, isNote?: boolean) => void;
  onSendAttachment: (
    chatId: string,
    attachment: {
      data: string;
      filename: string;
      kind: string;
      mimeType: string;
    },
  ) => void;
  onAssignAgent: (chatId: string, agentName: string) => void;
  onToggleResolve: (chatId: string) => void;
  onOpenChat: (chatId: string, sync?: boolean) => void;
  onSyncInbox: (sessionKey: string) => Promise<void>;
  teammates?: { id: string | number; name: string }[];
  mediaEnabled?: boolean;
  isLoading?: boolean;
  hasMoreChats?: boolean;
  onLoadMoreChats?: () => void;
  hasOlderMessages?: boolean;
  onLoadOlder?: () => void;
  onFilterChange?: (search: string, filter: string, sessionName: string) => void;
  /** The signed-in person, so their own number reads "(you)" */
  currentUserId?: number | string | null;
  /** The AI assistant: usable, or shown as locked when the plan doesn't include it */
  assistant?: { available: boolean; locked?: boolean };
  aiClient?: AiClient;
  onSaveReply?: (data: {
    shortcut: string;
    title: string;
    text: string;
  }) => Promise<void>;
  canManage?: boolean;
  /** A bar under the chat's header, such as where this customer is in the sales pipeline */
  renderLeadPanel?: (chat: ChatThread) => ReactNode;
  onOpenSessions?: () => void;
  /** Whether WhatsApp history for the open chat is loading, or why it could not be loaded */
  historyStatus?: { loading: boolean; note?: string } | null;
  /** Files in the open chat that were never saved */
  mediaPending?: number;
  mediaProgress?: {
    chatId: string;
    loading: boolean;
    saved: number;
    failed: number;
    note?: string;
  } | null;
  onLoadMedia?: (chatId: string, messageId: string) => Promise<void>;
  onLoadAllMedia?: (chatId: string) => void;
  /** Photo addresses stopped working (the chat sat open for a long time): fetch fresh ones */
  onRefreshMedia?: () => void;
}

const avatarFallback = safeAvatarFallback;

function formatChatTimestamp(timestampStr?: string): string {
  if (!timestampStr) return "";
  // Check if it's already formatted like "10:45 AM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(timestampStr)) {
    return timestampStr;
  }
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return timestampStr;

  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return "Yesterday";
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function getMessageDateGroup(timestampStr?: string): string {
  if (!timestampStr) return "TODAY";
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return "TODAY";

  const now = new Date();
  if (now.toDateString() === date.toDateString()) return "TODAY";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return "YESTERDAY";

  return date
    .toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
}

export const Inbox: React.FC<InboxProps> = ({
  chats,
  messages,
  contacts,
  cannedReplies,
  sessions,
  selectedChatId,
  onSendMessage,
  onSendAttachment,
  onAssignAgent,
  onToggleResolve,
  onOpenChat,
  historyStatus,
  mediaPending = 0,
  mediaProgress,
  onLoadMedia,
  onLoadAllMedia,
  onRefreshMedia,
  onSyncInbox,
  teammates = [],
  mediaEnabled = false,
  isLoading = false,
  hasMoreChats = false,
  onLoadMoreChats,
  hasOlderMessages = false,
  onLoadOlder,
  onFilterChange,
  currentUserId,
  assistant,
  aiClient,
  onSaveReply,
  canManage = false,
  renderLeadPanel,
  onOpenSessions,
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "groups">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [numberFilter, setNumberFilter] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(
    selectedChatId || null,
  );
  const [showCrmPanel, setShowCrmPanel] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1280,
  );
  // Phones show the list first and the conversation after a tap; wider screens show both.
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Automatically select and load messages for the active or first chat
  useEffect(() => {
    if (
      selectedChatId &&
      selectedChatId !== activeChatId &&
      chats.some((c) => c.id === selectedChatId)
    ) {
      setActiveChatId(selectedChatId);
      return;
    }
    if (
      (!activeChatId || !chats.some((c) => c.id === activeChatId)) &&
      chats.length > 0
    ) {
      const firstId = chats[0].id;
      setActiveChatId(firstId);
      onOpenChat(firstId);
    }
  }, [chats, selectedChatId, activeChatId, onOpenChat]);

  // Composer state
  const [inputText, setInputText] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const composerInput = useRef<HTMLInputElement>(null);
  const [showCannedMenu, setShowCannedMenu] = useState(false);

  // Sync & Media state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [isSyncingChat, setIsSyncingChat] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const chatListRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const olderHeight = useRef<number | null>(null);
  const previousChat = useRef<string | null>(null);
  const [replyError, setReplyError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat =
    chats.find((c) => c.id === activeChatId) || chats[0] || null;
  const activeContact = activeChat ? contacts[activeChat.contactId] : null;
  const currentMessages = useMemo(() => {
    return activeChat ? messages[activeChat.id] || [] : [];
  }, [messages, activeChat]);
  // Every saved photo and video of the open chat, for the viewer.
  const gallery = useMemo(
    () => galleryItems(currentMessages, activeContact?.name || "Customer"),
    [currentMessages, activeContact?.name],
  );
  // Switching chats closes the viewer: its photos belong to the chat it was opened from.
  useEffect(() => setViewerId(null), [activeChatId]);
  const riwo = useRiwo({
    chatId: activeChat?.id ?? null,
    draft: inputText,
    client: aiClient,
  });

  // Auto-scroll on new messages
  useEffect(() => {
    const feed = feedRef.current;
    if (feed && olderHeight.current !== null) {
      feed.scrollTop += feed.scrollHeight - olderHeight.current;
      olderHeight.current = null;
      return;
    }
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === "function" &&
      (!feed ||
        previousChat.current !== activeChatId ||
        feed.scrollHeight - feed.scrollTop - feed.clientHeight < 180)
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    previousChat.current = activeChatId;
  }, [currentMessages.length, activeChatId]);

  // A number that was removed while chosen falls back to every number.
  const activeNumber = sessions.some((s) => s.sessionKey === numberFilter)
    ? numberFilter
    : "";
  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      const matchesSearch =
        (c.contactName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (c.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filterTab === "unread") return c.unreadCount > 0;
      if (filterTab === "groups") return Boolean(c.isGroup);
      return true;
    });
  }, [chats, searchQuery, filterTab]);
  useEffect(() => {
    const timer = setTimeout(
      () => onFilterChange?.(searchQuery, filterTab, activeNumber),
      250,
    );
    return () => clearTimeout(timer);
  }, [searchQuery, filterTab, activeNumber, onFilterChange]);
  const virtualChats = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => chatListRef.current,
    estimateSize: () => 82,
    overscan: 8,
    enabled: filteredChats.length > 100,
  });
  const chatRows =
    filteredChats.length > 100 && virtualChats.getVirtualItems().length
      ? virtualChats
          .getVirtualItems()
          .map((v) => ({ chat: filteredChats[v.index], virtual: v }))
      : filteredChats.map((chat) => ({ chat, virtual: undefined }));

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    onSendMessage(activeChat.id, inputText, isNoteMode);
    setInputText("");
    setShowCannedMenu(false);
  };

  const handleInsertCanned = (text: string) => {
    setInputText(text);
    setShowCannedMenu(false);
  };

  const connectedSessions = sessions.filter((s) => s.status === "CONNECTED");

  const handleSync = async () => {
    if (isSyncing || connectedSessions.length === 0) return;
    setIsSyncing(true);
    setSyncStatus("Syncing WhatsApp chats…");
    try {
      for (const s of connectedSessions) {
        await onSyncInbox(s.sessionKey);
      }
      setSyncStatus("Synced! Refreshing…");
      setTimeout(() => setSyncStatus(""), 3000);
    } catch {
      setSyncStatus("Sync failed");
      setTimeout(() => setSyncStatus(""), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const renderStatusTick = (msg: ChatMessage) => {
    if (msg.status === "uncertain")
      return (
        <span
          className="text-warn"
          title="Delivery uncertain. Check WhatsApp before retrying."
        >
          ?
        </span>
      );
    if (msg.status === "sending" || msg.status === "dispatching")
      return <Clock className="w-3.5 h-3.5" aria-label="Sending" />;
    if (msg.status === "failed") {
      return (
        <span
          className="text-danger font-bold text-[10px]"
          title="Failed to deliver"
        >
          !
        </span>
      );
    }
    if (msg.status === "read" || msg.ack === 3 || msg.ack === 4) {
      return (
        <span title="Read">
          <CheckCheck className="w-3.5 h-3.5 text-info" />
        </span>
      );
    }
    if (msg.status === "delivered" || msg.ack === 2) {
      return (
        <span title="Delivered">
          <CheckCheck className="w-3.5 h-3.5 text-fg-2" />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check className="w-3.5 h-3.5 text-fg-2" />
      </span>
    );
  };

  // Empty state: no connected sessions
  if (connectedSessions.length === 0 && chats.length === 0) {
    return (
      <div className="flex h-full min-h-[70vh] bg-surface items-center justify-center animate-fade">
        <div className="text-center space-y-5 max-w-sm px-6">
          <ScriwoMark size={64} className="mx-auto drop-shadow-2xl" />
          <h3 className="text-fg font-semibold text-xl">
            Connect your first WhatsApp number
          </h3>
          <p className="text-fg-2 text-[15px] leading-relaxed">
            Link a phone in a minute and every conversation lands here, shared
            with your team.
          </p>
          {onOpenSessions && (
            <button
              onClick={onOpenSessions}
              className="inline-flex items-center gap-2 rounded-full bg-fg text-app px-5 h-11 text-sm font-semibold hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Connect WhatsApp
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-surface overflow-hidden">
      {/* ── Conversations ─────────────────────────────────────────────────── */}
      <div
        className={`${mobileChatOpen ? "hidden lg:flex" : "flex"} w-full lg:w-[380px] lg:border-r border-line flex-col bg-surface shrink-0 min-h-0`}
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[26px] font-semibold leading-tight text-fg">
              Inbox
            </h2>
            <div className="mt-0.5 text-[13px] text-fg-2 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
              </span>
              {connectedSessions.length === 1
                ? "1 number connected"
                : `${connectedSessions.length} numbers connected`}
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Refresh from WhatsApp"
            aria-label="Refresh from WhatsApp"
            className="h-10 w-10 grid place-items-center rounded-full text-fg-2 hover:text-fg hover:bg-surface-2 transition disabled:opacity-40"
          >
            {isSyncing ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <RefreshCw className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>

        {syncStatus && (
          <div className="mx-5 mb-2 px-3 py-1.5 rounded-xl bg-brand/10 text-[12px] text-brand text-center font-medium animate-fade">
            {syncStatus}
          </div>
        )}

        <div className="px-4 pb-3 space-y-3 shrink-0">
          <div className="relative flex items-center bg-surface-2 rounded-2xl h-11 ring-1 ring-transparent focus-within:ring-gold/60 transition">
            <Search className="w-4 h-4 text-fg-3 ml-3.5 shrink-0" />
            <input
              type="text"
              placeholder="Search conversations"
              aria-label="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-2.5 pr-9 text-[15px] focus:outline-none"
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-fg-3 hover:text-fg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-1 p-1 bg-surface-2 rounded-2xl"
            role="tablist"
            aria-label="Filter conversations"
          >
            {(
              [
                ["all", "All"],
                ["unread", "Unread"],
                ["groups", "Groups"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={filterTab === key}
                onClick={() => setFilterTab(key)}
                className={`flex-1 h-8 rounded-xl text-[13px] font-medium transition flex items-center justify-center gap-1.5 ${
                  filterTab === key
                    ? "bg-surface text-fg shadow-card"
                    : "text-fg-2 hover:text-fg"
                }`}
              >
                {label}
                {key === "unread" && chats.some((c) => c.unreadCount > 0) && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-solid text-white text-[10px] font-semibold grid place-items-center num">
                    {chats.filter((c) => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <NumberSwitch
            sessions={sessions}
            value={activeNumber}
            onChange={setNumberFilter}
            currentUserId={currentUserId}
          />
        </div>

        {/* Conversation list */}
        <div
          ref={chatListRef}
          className="flex-1 overflow-y-auto px-2 pb-3 min-h-0"
        >
          {isLoading && filteredChats.length === 0 && (
            <div
              role="status"
              aria-label="Loading conversations"
              className="px-4 py-2 space-y-3"
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="skeleton h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-1/2" />
                    <div className="skeleton h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            style={
              filteredChats.length > 100 &&
              virtualChats.getVirtualItems().length
                ? { height: virtualChats.getTotalSize(), position: "relative" }
                : undefined
            }
          >
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-fg-2 text-sm space-y-2">
                <MessageSquare className="w-8 h-8 text-fg-3 mx-auto" />
                <p>
                  {searchQuery
                    ? `No chats match "${searchQuery}"`
                    : activeNumber
                      ? "No conversations on this number yet"
                      : "No conversations found"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleSync}
                    className="mt-2 px-3 py-1.5 bg-brand-solid hover:bg-brand-solid/90 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Import WhatsApp Chats
                  </button>
                )}
              </div>
            ) : (
              chatRows.map(({ chat, virtual }) => {
                const isActive = chat.id === activeChatId;
                const formattedTime = formatChatTimestamp(
                  chat.lastMessage?.timestamp,
                );
                const isOut = Boolean(chat.lastMessage?.fromMe);

                return (
                  <div
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    aria-current={isActive ? "true" : undefined}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setActiveChatId(chat.id);
                        setMobileChatOpen(true);
                        onOpenChat(chat.id);
                      }
                    }}
                    style={
                      virtual
                        ? {
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: virtual.size,
                            transform: `translateY(${virtual.start}px)`,
                          }
                        : undefined
                    }
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setMobileChatOpen(true);
                      onOpenChat(chat.id);
                    }}
                    className={`group px-3 py-3 my-0.5 cursor-pointer rounded-2xl transition-colors flex items-center gap-3 ${
                      isActive ? "bg-surface-2" : "hover:bg-surface-2/60"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          chat.avatar ||
                          avatarFallback(chat.contactName, chat.isGroup)
                        }
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = avatarFallback(
                            chat.contactName,
                            chat.isGroup,
                          );
                        }}
                      />
                      {chat.isGroup && (
                        <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center w-[18px] h-[18px] rounded-full bg-surface ring-2 ring-surface text-fg-2">
                          <Users className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`text-[15px] truncate ${chat.unreadCount > 0 ? "font-semibold text-fg" : "font-medium text-fg"}`}
                        >
                          {chat.contactName}
                        </span>
                        <span
                          className={`text-[12px] shrink-0 num ${chat.unreadCount > 0 ? "text-brand font-medium" : "text-fg-3"}`}
                        >
                          {formattedTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div
                          className={`text-[13.5px] truncate flex items-center gap-1 min-w-0 ${chat.unreadCount > 0 ? "text-fg-2" : "text-fg-3"}`}
                        >
                          {isOut && (
                            <span className="shrink-0">
                              {chat.lastMessage?.status === "read" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-info" />
                              ) : chat.lastMessage?.status === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                              ) : chat.lastMessage?.status === "sending" ? (
                                <Clock className="w-3 h-3" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                          <span className="truncate">
                            {chat.lastMessage?.text || "No messages yet"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {chat.assignedTo && (
                            <span
                              title={`Assigned to ${chat.assignedTo}`}
                              className="w-5 h-5 rounded-full bg-gold/15 text-gold text-[10px] font-semibold grid place-items-center"
                            >
                              {chat.assignedTo.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {chat.unreadCount > 0 && (
                            <span className="bg-brand-solid text-white text-[11px] font-semibold px-1.5 rounded-full min-w-[20px] h-5 grid place-items-center num">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* With several numbers in one list, say which one each chat is on */}
                      {sessions.length > 1 && !activeNumber && (() => {
                        const line = sessionOfChat(sessions, chat);
                        return line ? (
                          <div className="mt-0.5 text-[11.5px] text-fg-3 truncate">
                            via {numberName(line, currentUserId)}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {hasMoreChats && (
            <button
              onClick={onLoadMoreChats}
              className="w-full p-3 text-brand text-sm"
            >
              Load more conversations
            </button>
          )}
        </div>
      </div>

      {/* ── Conversation ──────────────────────────────────────────────────── */}
      <div
        className={`${mobileChatOpen ? "flex" : "hidden lg:flex"} flex-1 flex-col bg-app min-w-0 min-h-0 relative`}
      >
        {activeChat ? (
          <div className="h-[68px] px-3 sm:px-5 glass border-b border-line flex items-center justify-between gap-3 shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button
                aria-label="Back to conversations"
                onClick={() => setMobileChatOpen(false)}
                className="lg:hidden h-10 w-10 -ml-1 grid place-items-center rounded-full text-fg-2 hover:text-fg hover:bg-surface-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <img
                src={
                  activeChat.avatar ||
                  avatarFallback(activeChat.contactName, activeChat.isGroup)
                }
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = avatarFallback(
                    activeChat.contactName,
                    activeChat.isGroup,
                  );
                }}
              />
              <div className="min-w-0">
                <div className="font-semibold text-[16px] text-fg truncate leading-tight">
                  {activeChat.contactName}
                </div>
                <div className="text-[12.5px] text-fg-3 truncate num">
                  {activeChat.isGroup
                    ? `${activeChat.groupMembersCount || ""} ${activeChat.groupMembersCount ? "members" : "Group"}`
                    : activeChat.phone}
                  {sessions.length > 1 &&
                    (() => {
                      const line = sessionOfChat(sessions, activeChat);
                      return line ? (
                        <span
                          className="ml-2 text-fg-2"
                          title={phoneText(line.phone) || undefined}
                        >
                          · via {numberName(line, currentUserId)}
                        </span>
                      ) : null;
                    })()}
                  {activeChat.isClosed && (
                    <span className="ml-2 text-ok">Resolved</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <label className="hidden md:flex items-center gap-2 h-9 pl-2.5 pr-1.5 rounded-full bg-surface-2 text-[13px] text-fg-2 hover:text-fg transition">
                <UserCheck className="w-4 h-4 text-gold" />
                <span className="sr-only">Assign conversation</span>
                <select
                  value={activeChat.assignedTo || "Unassigned"}
                  onChange={(e) => onAssignAgent(activeChat.id, e.target.value)}
                  className="bg-transparent text-fg focus:outline-none cursor-pointer max-w-[140px] truncate pr-1"
                >
                  <option value="Unassigned" className="bg-surface">
                    Unassigned
                  </option>
                  {teammates.map((member) => (
                    <option
                      key={member.id}
                      value={member.name}
                      className="bg-surface"
                    >
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={async () => {
                  if (!activeChat.id || isSyncingChat) return;
                  setIsSyncingChat(true);
                  try {
                    await onOpenChat(activeChat.id, true);
                  } finally {
                    setIsSyncingChat(false);
                  }
                }}
                disabled={isSyncingChat}
                title="Load earlier messages from WhatsApp"
                aria-label="Load earlier messages from WhatsApp"
                className="h-10 w-10 grid place-items-center rounded-full text-fg-2 hover:text-fg hover:bg-surface-2 transition disabled:opacity-40"
              >
                <RefreshCw
                  className={`w-[18px] h-[18px] ${isSyncingChat ? "animate-spin" : ""}`}
                />
              </button>

              <button
                onClick={() => onToggleResolve(activeChat.id)}
                title={
                  activeChat.isClosed
                    ? "Reopen conversation"
                    : "Mark as resolved"
                }
                aria-label={
                  activeChat.isClosed
                    ? "Reopen conversation"
                    : "Mark as resolved"
                }
                className={`h-10 w-10 grid place-items-center rounded-full transition ${activeChat.isClosed ? "text-ok bg-ok/10" : "text-fg-2 hover:text-fg hover:bg-surface-2"}`}
              >
                <CheckCircle2 className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setShowCrmPanel(!showCrmPanel)}
                title={showCrmPanel ? "Hide details" : "Show details"}
                aria-label={showCrmPanel ? "Hide details" : "Show details"}
                className={`h-10 w-10 grid place-items-center rounded-full transition ${
                  showCrmPanel
                    ? "text-fg bg-surface-2"
                    : "text-fg-2 hover:text-fg hover:bg-surface-2"
                }`}
              >
                {showCrmPanel ? (
                  <PanelRightClose className="w-[18px] h-[18px]" />
                ) : (
                  <PanelRightOpen className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-[68px] border-b border-line shrink-0" />
        )}

        {activeChat && !activeChat.isGroup && renderLeadPanel?.(activeChat)}

        {/* ── Messages ── */}
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto px-3 sm:px-8 py-6 space-y-1.5 chat-wallpaper min-h-0"
        >
          {!activeChat && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-fg-2">
              <ScriwoMark size={56} className="opacity-90" />
              <h3 className="text-lg font-semibold text-fg">
                Select a conversation
              </h3>
              <p className="max-w-xs text-sm leading-relaxed">
                Pick a chat on the left to read it, reply, or leave a private
                note for your team.
              </p>
            </div>
          )}

          {activeChat && (
            <>
              <div className="flex justify-center pb-3">
                <div className="glass ring-1 ring-line text-fg-2 text-[12px] px-3.5 py-1 rounded-full font-medium">
                  {getMessageDateGroup(activeChat.lastMessage?.timestamp)}
                </div>
              </div>

              {activeChat &&
                (mediaPending > 0 || mediaProgress?.chatId === activeChat.id) &&
                onLoadAllMedia && (
                  <div
                    role="status"
                    className="mx-auto mb-3 max-w-md glass ring-1 ring-line rounded-2xl px-4 py-3 text-[13.5px] text-fg flex items-center gap-3"
                  >
                    {mediaProgress?.chatId === activeChat.id &&
                    mediaProgress.loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-gold shrink-0" />
                        <span>
                          Loading files from WhatsApp… {mediaProgress.saved}{" "}
                          saved
                          {mediaProgress.failed
                            ? `, ${mediaProgress.failed} unavailable`
                            : ""}
                        </span>
                      </>
                    ) : mediaProgress?.chatId === activeChat.id &&
                      !mediaPending ? (
                      <span>
                        {mediaProgress.note
                          ? mediaProgress.note
                          : `${mediaProgress.saved} file${mediaProgress.saved === 1 ? "" : "s"} saved.`}
                      </span>
                    ) : (
                      <>
                        <span className="flex-1">
                          {mediaPending} file{mediaPending === 1 ? "" : "s"} in
                          this chat
                          {mediaPending === 1 ? " isn't" : " aren't"} saved yet.
                          {mediaProgress?.chatId === activeChat.id &&
                          mediaProgress.failed
                            ? ` ${mediaProgress.failed} could not be loaded.`
                            : ""}
                        </span>
                        <button
                          className="shrink-0 font-medium text-gold hover:underline"
                          onClick={() => onLoadAllMedia(activeChat.id)}
                        >
                          Load them all
                        </button>
                      </>
                    )}
                  </div>
                )}

              {currentMessages.length === 0 &&
                (historyStatus?.loading ? (
                  <div
                    role="status"
                    className="h-48 flex flex-col items-center justify-center gap-3 text-fg-2 text-[14px]"
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-gold" />
                    Loading messages from WhatsApp…
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center gap-3 text-center text-fg-2 text-[14px]">
                    <p>
                      {historyStatus?.note ||
                        "No messages yet. Send a message to start the conversation!"}
                    </p>
                    {activeChat.lastMessage?.text && (
                      <p className="max-w-sm rounded-2xl bg-surface-2 px-4 py-3 text-fg">
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-3 mb-1">
                          Last message
                        </span>
                        {activeChat.lastMessage.text}
                      </p>
                    )}
                    {historyStatus?.note && (
                      <button
                        className="text-[13.5px] font-medium text-gold hover:underline"
                        onClick={() => onOpenChat(activeChat.id, true)}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                ))}

              {/* Render Message Bubbles */}
              {hasOlderMessages && (
                <button
                  className="block mx-auto text-[13px] font-medium text-fg-2 hover:text-fg glass ring-1 ring-line rounded-full px-4 py-1.5 transition"
                  onClick={() => {
                    olderHeight.current = feedRef.current?.scrollHeight || null;
                    onLoadOlder?.();
                  }}
                >
                  Load older messages
                </button>
              )}
              {currentMessages.map((msg) => {
                const isOut = msg.sender === "agent" || msg.sender === "bot";

                // Internal Team Note Bubble
                if (msg.isNote || msg.type === "internal_note") {
                  return (
                    <div key={msg.id} className="flex justify-center py-2">
                      <div className="note-bubble max-w-xl w-full sm:w-auto rounded-2xl px-4 py-3 text-warn space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
                          <Lock className="w-3 h-3" />
                          <span>Private team note</span>
                          <span className="normal-case tracking-normal font-normal opacity-75">
                            · customers never see this
                          </span>
                        </div>
                        <p className="text-[14.5px] leading-snug text-fg whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        <div className="text-[11px] text-fg-3 flex items-center justify-between gap-4 num">
                          <span>{msg.agentName}</span>
                          <span>{formatChatTimestamp(msg.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[82%] md:max-w-[68%] rounded-[20px] px-3.5 py-2 text-[14.5px] text-fg space-y-1 animate-fade ${
                        isOut
                          ? "bg-bubble-out rounded-br-md"
                          : "bg-bubble-in ring-1 ring-line rounded-bl-md"
                      }`}
                    >
                      {/* Sender label for group participants or outgoing agents */}
                      {isOut
                        ? msg.agentName && (
                            <div className="text-[12px] font-semibold text-brand leading-tight">
                              {msg.agentName}
                            </div>
                          )
                        : activeChat.isGroup &&
                          msg.agentName && (
                            <div className="text-[12px] font-semibold text-gold leading-tight">
                              {msg.agentName}
                            </div>
                          )}

                      {/* Text Message */}
                      {(!msg.type || msg.type === "text") && (
                        <>
                          <p
                            dir="auto"
                            className="leading-[1.4] whitespace-pre-wrap break-words"
                          >
                            {msg.text}
                          </p>
                          {assistant?.available &&
                            !isOut &&
                            msg.text.trim().length > 1 && (
                              <TranslateMessage
                                text={msg.text}
                                client={aiClient}
                              />
                            )}
                        </>
                      )}

                      {/* Call Log */}
                      {msg.type === "call_log" && (
                        <div className="flex items-center gap-2.5 py-1">
                          <div
                            className={`p-2 rounded-full ${
                              msg.text.includes("Missed")
                                ? "bg-danger/20 text-danger"
                                : "bg-brand-solid/20 text-brand"
                            }`}
                          >
                            {msg.text.includes("Video") ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <Phone className="w-4 h-4" />
                            )}
                          </div>
                          <div className="text-xs">
                            <div className="font-semibold text-fg">
                              {msg.text.includes("Video")
                                ? "Video call"
                                : "Voice call"}
                            </div>
                            <div className="text-[11px] text-fg-2">
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Photos, videos, voice notes, stickers and files */}
                      {[
                        "image",
                        "video",
                        "audio",
                        "document",
                        "sticker",
                        "gif",
                      ].includes(String(msg.type)) && (
                        <MediaBlock
                          msg={msg}
                          onOpen={setViewerId}
                          onBroken={onRefreshMedia}
                          onLoad={
                            onLoadMedia
                              ? (messageId) =>
                                  onLoadMedia(activeChat.id, messageId)
                              : undefined
                          }
                        />
                      )}

                      {/* Timestamp & Status Tick (Bottom Right aligned) */}
                      <div className="flex items-center justify-end gap-1 text-[11px] text-fg-3 num select-none -mb-0.5">
                        <span>{formatChatTimestamp(msg.timestamp)}</span>
                        {isOut && renderStatusTick(msg)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Canned Quick Replies Menu */}
        {showCannedMenu && (
          <div className="mx-3 sm:mx-6 mb-2 p-3 rounded-3xl bg-surface border border-line shadow-card animate-rise z-20">
            {canManage && onSaveReply && (
              <form
                className="flex flex-wrap gap-2 mb-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  try {
                    await onSaveReply({
                      shortcut: String(data.get("shortcut")),
                      title: String(data.get("title")),
                      text: String(data.get("text")),
                    });
                    form.reset();
                    setReplyError("");
                  } catch (error: any) {
                    setReplyError(error.message);
                  }
                }}
              >
                <input
                  required
                  name="shortcut"
                  aria-label="Reply shortcut"
                  placeholder="/shortcut"
                  className="bg-surface p-1 rounded"
                />
                <input
                  required
                  name="title"
                  aria-label="Reply title"
                  placeholder="Title"
                  className="bg-surface p-1 rounded"
                />
                <input
                  required
                  name="text"
                  aria-label="Reply text"
                  placeholder="Saved reply text"
                  className="bg-surface p-1 rounded flex-1"
                />
                <button className="text-brand">Save reply</button>
              </form>
            )}
            {replyError && <p role="alert">{replyError}</p>}
            <div className="flex items-center justify-between text-xs text-fg-2 font-medium mb-2">
              <span>Quick replies — pick one, or type “/” to search</span>
              <button
                onClick={() => setShowCannedMenu(false)}
                className="text-fg-2 hover:text-fg"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {cannedReplies.map((cr) => (
                <button
                  key={cr.shortcut}
                  onClick={() => handleInsertCanned(cr.text)}
                  className="text-left p-2 rounded-lg bg-surface hover:bg-surface-3 border border-line transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-brand font-bold text-xs">
                      {cr.shortcut}
                    </span>
                    <span className="font-semibold text-fg text-xs">
                      {cr.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-fg-2 truncate mt-0.5">
                    {cr.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Riwo's draft, summary or translation, shown until it is used or dismissed */}
        {activeChat && assistant?.available && (
          <RiwoTray
            riwo={riwo}
            canManage={canManage}
            onUse={(text) => {
              setInputText(text);
              setIsNoteMode(false);
              riwo.dismiss();
              composerInput.current?.focus();
            }}
            onSaveNote={(text) => {
              onSendMessage(activeChat.id, text, true);
              riwo.dismiss();
            }}
          />
        )}

        {/* ── Composer ── */}
        {activeChat && (
          <div className="px-3 sm:px-6 pt-2 pb-3 sm:pb-4 shrink-0 relative z-30 bg-app">
            <div
              className={`rounded-[26px] border bg-surface shadow-card transition-colors ${
                isNoteMode ? "border-warn/50" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between px-3 pt-2.5">
                <div
                  className="flex items-center gap-0.5 p-0.5 bg-surface-2 rounded-full"
                  role="tablist"
                  aria-label="Reply type"
                >
                  <button
                    role="tab"
                    aria-selected={!isNoteMode}
                    onClick={() => setIsNoteMode(false)}
                    className={`px-3 h-7 rounded-full text-[12.5px] font-medium transition ${
                      !isNoteMode
                        ? "bg-surface text-fg shadow-card"
                        : "text-fg-2 hover:text-fg"
                    }`}
                  >
                    Reply
                  </button>
                  <button
                    role="tab"
                    aria-selected={isNoteMode}
                    onClick={() => setIsNoteMode(true)}
                    className={`flex items-center gap-1 px-3 h-7 rounded-full text-[12.5px] font-medium transition ${
                      isNoteMode
                        ? "bg-note text-warn shadow-card"
                        : "text-fg-2 hover:text-fg"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span className="whitespace-nowrap">Team note</span>
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  {assistant?.available && <RiwoButton riwo={riwo} />}
                  {!assistant?.available && assistant?.locked && (
                    <RiwoButton riwo={riwo} locked />
                  )}
                  <button
                    onClick={() => setShowCannedMenu(!showCannedMenu)}
                    aria-label="Quick replies"
                    title="Quick replies"
                    className="text-[12.5px] font-medium text-fg-2 hover:text-fg flex items-center gap-1.5 px-2 h-7 rounded-full hover:bg-surface-2 transition whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span className="hidden sm:inline">Quick replies</span>
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-end gap-1.5 p-2 pt-1"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/ogg,audio/webm,application/pdf,text/plain"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file || !activeChat) return;
                    if (file.size > 10 * 1024 * 1024) {
                      setReplyError("Files must be 10 MB or smaller");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const kind = file.type.startsWith("image/")
                        ? "image"
                        : file.type.startsWith("video/")
                          ? "video"
                          : file.type.startsWith("audio/")
                            ? "audio"
                            : "document";
                      onSendAttachment(activeChat.id, {
                        data: String(reader.result),
                        filename: file.name,
                        kind,
                        mimeType: file.type,
                      });
                      event.target.value = "";
                    };
                    reader.readAsDataURL(file);
                  }}
                />

                <button
                  type="button"
                  disabled={!mediaEnabled}
                  onClick={() => fileInputRef.current?.click()}
                  title={
                    mediaEnabled
                      ? "Attach a file (maximum 10 MB)"
                      : "Media storage is not configured"
                  }
                  aria-label="Attach a file"
                  className="h-10 w-10 shrink-0 grid place-items-center rounded-full text-fg-2 hover:text-fg hover:bg-surface-2 transition-colors disabled:opacity-40"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={composerInput}
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (e.target.value === "/") setShowCannedMenu(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    aria-label={
                      isNoteMode
                        ? "Write a private team note"
                        : "Write a message"
                    }
                    placeholder={
                      isNoteMode
                        ? "Private note for your team… type @Name to notify someone"
                        : "Write a message"
                    }
                    className="w-full bg-transparent h-10 px-2 text-[15px] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label={isNoteMode ? "Save note" : "Send message"}
                  className={`h-10 w-10 grid place-items-center rounded-full transition shrink-0 ${
                    isNoteMode
                      ? "bg-warn text-white"
                      : "bg-brand-solid hover:bg-brand-hover text-white"
                  } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
                >
                  <Send className="w-[18px] h-[18px]" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Details (a side panel on wide screens, a sheet on small ones) ─── */}
      {showCrmPanel && activeContact && activeChat && (
        <>
          <button
            aria-label="Close details"
            onClick={() => setShowCrmPanel(false)}
            className="xl:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade"
          />
          <aside className="fixed inset-y-0 right-0 z-40 w-[min(92vw,380px)] xl:static xl:z-auto xl:w-[340px] bg-surface border-l border-line flex flex-col overflow-y-auto shrink-0 animate-fade pop xl:shadow-none">
            <div className="h-[68px] px-5 border-b border-line flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-[16px] text-fg">Details</h3>
              <button
                onClick={() => setShowCrmPanel(false)}
                aria-label="Close details"
                className="h-9 w-9 grid place-items-center rounded-full text-fg-2 hover:text-fg hover:bg-surface-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="text-center">
                <img
                  src={
                    activeContact.avatar || avatarFallback(activeContact.name)
                  }
                  alt=""
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = avatarFallback(
                      activeContact.name,
                    );
                  }}
                />
                <h4 className="font-semibold text-[20px] text-fg mt-3">
                  {activeContact.name}
                </h4>
                <div className="text-[14px] text-fg-2 mt-0.5 num">
                  {activeContact.phone}
                </div>
                {activeContact.email && (
                  <div className="text-[13px] text-fg-3 mt-0.5">
                    {activeContact.email}
                  </div>
                )}
                {activeContact.storeConnected && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-brand/10 text-brand text-[12.5px] font-medium">
                    Lifetime value $
                    {activeContact.lifetimeValue?.toLocaleString()}
                  </div>
                )}
              </div>

              <section className="space-y-2">
                <h5 className="eyebrow">Tags</h5>
                <div className="flex flex-wrap gap-1.5">
                  {(activeContact.tags || []).length === 0 && (
                    <span className="text-[13px] text-fg-3">No tags yet</span>
                  )}
                  {(activeContact.tags || []).map((t: string) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-full bg-surface-2 text-fg text-[12.5px] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              {activeContact.storeConnected && (
                <section className="space-y-2">
                  <h5 className="eyebrow flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3" />
                    Orders
                  </h5>
                  {(activeContact.orders || []).length > 0 ? (
                    <div className="space-y-2">
                      {(activeContact.orders || []).map((ord: any) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-surface-2 rounded-2xl text-[13px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-fg num">
                              {ord.orderNumber}
                            </span>
                            <span className="text-brand font-semibold num">
                              {ord.total} {ord.currency}
                            </span>
                          </div>
                          <div className="text-fg-2 line-clamp-1">
                            {ord.itemsSummary}
                          </div>
                          <div className="flex items-center justify-between text-[12px] text-fg-3">
                            <span>{ord.date}</span>
                            <span>{ord.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-fg-3">
                      No orders recorded yet.
                    </p>
                  )}
                </section>
              )}

              {Object.keys(activeContact.customTraits || {}).length > 0 && (
                <section className="space-y-2">
                  <h5 className="eyebrow">Details</h5>
                  <dl className="text-[13.5px] divide-y divide-line">
                    {Object.entries(activeContact.customTraits || {}).map(
                      ([key, val]) => (
                        <div
                          key={key}
                          className="flex justify-between gap-4 py-2"
                        >
                          <dt className="text-fg-2">{key}</dt>
                          <dd className="text-fg font-medium text-right">
                            {String(val)}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </section>
              )}

              <section className="space-y-2">
                <h5 className="eyebrow flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Team notes
                </h5>
                {(activeContact.notes || []).length > 0 ? (
                  <div className="space-y-2">
                    {activeContact.notes.map((n: any) => (
                      <div
                        key={n.id}
                        className="note-bubble rounded-2xl px-3.5 py-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[12px] text-warn font-medium">
                          <span>{n.author}</span>
                          <span className="text-fg-3 font-normal num">
                            {formatChatTimestamp(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-fg text-[13.5px] leading-snug whitespace-pre-wrap">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-fg-3 leading-relaxed">
                    Switch the composer to “Team note” to leave a private note
                    only your team can see.
                  </p>
                )}
              </section>
            </div>
          </aside>
        </>
      )}

      {/* Photo and video viewer */}
      {viewerId && (
        <MediaViewer
          items={gallery}
          currentId={viewerId}
          onChange={setViewerId}
          onClose={() => setViewerId(null)}
          hasOlder={hasOlderMessages}
          onLoadOlder={() => {
            olderHeight.current = feedRef.current?.scrollHeight || null;
            onLoadOlder?.();
          }}
          onExpired={onRefreshMedia}
        />
      )}
    </div>
  );
};
