import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Dock } from "./components/layout/Dock";
import { TabBar } from "./components/layout/TabBar";
import { ProfileMenu, ThemeSwitch } from "./components/layout/ProfileMenu";
import {
  CommandPalette,
  type Command,
} from "./components/layout/CommandPalette";
import {
  ADMIN_TABS,
  NAV,
  NAV_SECONDARY,
  type AdminSubTab,
  type DevSubTab,
  type NavItem,
  type UserSubTab,
  type View,
} from "./components/layout/navigation";
import { Page, PageHeader, Segmented } from "./components/ui/Page";
import { ScriwoMark } from "./components/brand/Logo";
import { useTheme } from "./hooks/useTheme";
import { useBackendHealth } from "./hooks/useBackendHealth";
import { LogOut, Moon, Plus, RefreshCw, Sun } from "lucide-react";
import { LoginPage } from "./components/auth/LoginPage";
import { ChangePassword } from "./components/auth/ChangePassword";
import { PlatformAdmin } from "./components/platform/PlatformAdmin";
import { Inbox } from "./components/user/Inbox";
import { SessionManager } from "./components/user/SessionManager";
import { Contacts } from "./components/user/Contacts";
import { Campaigns } from "./components/user/Campaigns";
import { Automations } from "./components/user/Automations";
import { Pipeline } from "./components/pipeline/Pipeline";
import { LeadPanel } from "./components/pipeline/LeadPanel";
import { SupportAccessCard } from "./components/admin/SupportAccessCard";
import { Dashboard } from "./components/user/Dashboard";
import { FeatureLocked } from "./components/ui/FeatureLocked";
import { UserManagement } from "./components/admin/UserManagement";
import { AuditLogs } from "./components/admin/AuditLogs";
import { ClusterHealth } from "./components/admin/ClusterHealth";
import { BillingPage } from "./components/billing/BillingPage";
import { Reports } from "./components/reports/Reports";
import { NewChatSheet, type NewChatPerson } from "./components/user/NewChatSheet";
import { NO_EXTRA, type InboxExtraFilters } from "./components/user/InboxFilters";
import { useLabels } from "./components/labels/useLabels";
import { DeveloperGuide } from "./components/developer/DeveloperGuide";
import type {
  AuthUser,
  ChatMessage,
  ChatThread,
  WhatsAppSession,
} from "./types";
import * as api from "./services/api";
import { getSocket, disconnectSocket } from "./services/socket";
import { useInboxRealtime } from "./hooks/useInboxRealtime";
import {
  NotificationBell,
  NotificationToasts,
} from "./components/layout/NotificationBell";
import {
  desktopPermission,
  playPing,
  requestDesktopPermission,
  setTitleBadge,
  showDesktopNotification,
} from "./utils/alerts";
import { markNotificationsRead } from "./services/realtimeCache";
import type { AppNotification } from "./types";
import { reconcileMessages } from "./utils/messages";

export function App() {
  const qc = useQueryClient();
  const theme = useTheme();
  const engine = useBackendHealth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [view, setView] = useState<View>("user");
  const [tab, setTab] = useState<UserSubTab>("inbox"),
    [adminTab, setAdminTab] = useState<AdminSubTab>("users"),
    [devTab, setDevTab] = useState<DevSubTab>("docs");
  const [pairOpen, setPairOpen] = useState(false),
    [campaignOpen, setCampaignOpen] = useState(false),
    [selected, setSelected] = useState<string | null>(null);
  const [openedThread, setOpenedThread] = useState<ChatThread | null>(null);
  const [filter, setFilter] = useState({
    search: "",
    filter: "all",
    sessionName: "",
    labels: "",
    labelMode: "any" as "any" | "all",
    assigned: "",
    activeDays: "",
    team: "",
    awaiting: "",
    overdue: "",
  }),
    [newChat, setNewChat] = useState<{ person?: NewChatPerson } | null>(null),
    [optimistic, setOptimistic] = useState<Record<string, ChatMessage[]>>({});
  const tenant = api.getStoredTenantId(),
    platformAdmin = user?.role === "superadmin",
    enabled = Boolean(user) && !platformAdmin && !user?.mustChangePassword,
    manager = user?.role === "admin";
  useEffect(() => {
    let active = true;
    api.getCurrentUser().then((u) => {
      if (active) {
        setUser(u);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const sessionsQuery = useQuery({
    queryKey: ["sessions", tenant],
    queryFn: api.getLiveSessions,
    enabled,
    refetchInterval: 30000,
  });
  // How each number is doing, while the Numbers screen is open
  const numberHealth = useQuery({
    queryKey: ["number-health", tenant],
    queryFn: api.fetchNumberHealth,
    enabled: enabled && view === "user" && tab === "sessions",
    refetchInterval: 30000,
  });
  // The person's own "I'm taking new chats" switch, shown only if the company put them in its rotation
  const myAvailability = useQuery({
    queryKey: ["my-availability", tenant],
    queryFn: api.fetchMyAvailability,
    enabled: enabled && view === "user" && tab === "inbox",
  });
  const healthByNumber = useMemo(
    () => Object.fromEntries((numberHealth.data?.numbers || []).map((n) => [n.sessionName, n])),
    [numberHealth.data],
  );
  const workspaces = useQuery({
    queryKey: ["workspaces", user?.id],
    queryFn: () => api.apiGet("/api/auth/workspaces"),
    enabled,
  });
  const capabilities = useQuery({
    queryKey: ["capabilities", tenant],
    queryFn: () => api.apiGet("/api/workspace/capabilities"),
    enabled,
  });
  const team = useQuery({
    queryKey: ["team", tenant],
    queryFn: () => api.apiGet("/api/workspace/team"),
    enabled,
  });
  const replies = useQuery({
    queryKey: ["replies", tenant],
    queryFn: () => api.apiGet("/api/workspace/canned-replies"),
    enabled,
  });
  const conversations = useInfiniteQuery({
    queryKey: ["conversations", tenant, filter],
    queryFn: ({ pageParam }) =>
      api.fetchConversations({ ...filter, cursor: pageParam, limit: 50 }),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor || undefined,
    enabled,
  });
  const labelList = useLabels(enabled);
  const contactQuery = useInfiniteQuery({
    queryKey: ["contacts", tenant],
    queryFn: ({ pageParam }) =>
      api.fetchContacts(pageParam ? { cursor: pageParam } : {}),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor || undefined,
    enabled,
  });
  const history = useInfiniteQuery({
    queryKey: ["messages", tenant, selected],
    queryFn: ({ pageParam }) =>
      api.fetchConversationMessages(selected!, { cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor || undefined,
    enabled: enabled && Boolean(selected),
    refetchInterval: 240000,
  });
  // Photos saved before previews existed get theirs in the background: look again shortly, a few times.
  const previewsPending = history.data?.pages[0]?.previewsPending || 0;
  const previewChecks = useRef({ chat: "", count: 0 });
  useEffect(() => {
    if (!previewsPending || !selected) return;
    if (previewChecks.current.chat !== selected)
      previewChecks.current = { chat: selected, count: 0 };
    if (previewChecks.current.count >= 4) return;
    const timer = setTimeout(() => {
      previewChecks.current.count += 1;
      void history.refetch();
    }, 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewsPending, selected, history.dataUpdatedAt]);
  // A photo failed to open, or the chat sat open until its photo addresses expired: fetch fresh ones.
  const lastMediaRefresh = useRef(0);
  const refreshMedia = useCallback(() => {
    if (Date.now() - lastMediaRefresh.current < 15000) return;
    lastMediaRefresh.current = Date.now();
    void qc.invalidateQueries({ queryKey: ["messages", tenant, selected] });
  }, [qc, tenant, selected]);
  const campaigns = useQuery({
    queryKey: ["campaigns", tenant],
    queryFn: api.fetchCampaigns,
    enabled: enabled && manager,
  });
  const automations = useQuery({
    queryKey: ["automations", tenant],
    queryFn: api.fetchAutomations,
    enabled: enabled && manager,
  });
  const sessions = (sessionsQuery.data || []) as WhatsAppSession[];
  const chats = useMemo(() => {
    const rows =
      conversations.data?.pages.flatMap((p) => p.conversations) || [];
    return openedThread?.id === selected && !rows.some((c) => c.id === selected)
      ? [openedThread, ...rows]
      : rows;
  }, [conversations.data, openedThread, selected]);
  const selectedContactId = chats.find((c) => c.id === selected)?.contactId;
  const selectedContact = useQuery({
    queryKey: ["contact", tenant, selectedContactId],
    queryFn: () => api.apiGet("/api/contacts/" + selectedContactId),
    enabled: enabled && Boolean(selectedContactId),
  });
  const visibleMessages = useMemo(
    () =>
      reconcileMessages(
        optimistic[selected || ""] || [],
        history.data?.pages.flatMap((p) => p.messages) || [],
      ),
    [optimistic, selected, history.data],
  );
  const contacts = useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of contactQuery.data?.pages.flatMap((p) => p.contacts) || [])
      map[c.id] = c;
    if (selectedContact.data?.contact)
      map[selectedContact.data.contact.id] = selectedContact.data.contact;
    const active = chats.find((c) => c.id === selected);
    if (active && map[active.contactId])
      map[active.contactId] = {
        ...map[active.contactId],
        notes: visibleMessages
          .filter((m) => m.isNote || m.type === "internal_note")
          .map((m) => ({
            id: m.id,
            author: m.agentName,
            content: m.text,
            createdAt: m.timestamp,
          })),
      };
    return map;
  }, [
    contactQuery.data,
    selectedContact.data,
    chats,
    selected,
    visibleMessages,
  ]);
  const refresh = useCallback(
    async (...keys: string[]) => {
      await Promise.all(
        [
          ...new Set([
            ...keys,
            ...(keys.includes("contacts") ? ["contact"] : []),
          ]),
        ].map((key) => qc.invalidateQueries({ queryKey: [key, tenant] })),
      );
    },
    [qc, tenant],
  );
  const changeFilter = useCallback(
    (search: string, filterTab: string, sessionName = "", extra: InboxExtraFilters = NO_EXTRA) =>
      setFilter((old) => {
        const labels = extra.labels.join(",");
        // the any/all choice only matters with two labels, so it does not reload the list on its own
        const labelMode = extra.labels.length > 1 ? extra.labelMode : "any";
        return old.search === search &&
          old.filter === filterTab &&
          old.sessionName === sessionName &&
          old.labels === labels &&
          old.labelMode === labelMode &&
          old.assigned === extra.assigned &&
          old.activeDays === extra.activeDays &&
          old.team === extra.team &&
          old.awaiting === (extra.waiting ? "1" : "") &&
          old.overdue === (extra.waiting === "overdue" ? "1" : "")
          ? old
          : {
              search,
              filter: filterTab,
              sessionName,
              labels,
              labelMode,
              assigned: extra.assigned,
              activeDays: extra.activeDays,
              team: extra.team,
              awaiting: extra.waiting ? "1" : "",
              overdue: extra.waiting === "overdue" ? "1" : "",
            };
      }),
    [],
  );
  useEffect(() => {
    if (!enabled) return;
    getSocket();
    return () => disconnectSocket();
  }, [enabled]);
  const notificationsQuery = useQuery({
    queryKey: ["notifications", tenant],
    queryFn: api.fetchNotifications,
    enabled,
    refetchInterval: 120000,
  });
  const [toasts, setToasts] = useState<AppNotification[]>([]),
    [desktop, setDesktop] = useState(desktopPermission());
  const unreadNotifications = notificationsQuery.data?.unreadCount || 0;
  useEffect(() => setTitleBadge(unreadNotifications), [unreadNotifications]);
  const openConversationRef = useRef<(id: string) => void>(() => {});
  const goTo = useCallback(
    (n: AppNotification) => {
      setToasts((t) => t.filter((x) => x.id !== n.id));
      markNotificationsRead(qc, tenant, n.id);
      void api.markNotificationRead(n.id).catch(() => {});
      if (n.conversationId) openConversationRef.current(n.conversationId);
      else if (n.type === "lead_task") {
        setView("user");
        setTab("pipeline");
      } else if (n.type === "report") {
        setView("user");
        setTab("reports");
      } else if (n.type === "support") {
        // the list of support sessions is under Team
        setView("admin");
        setAdminTab("users");
      } else if (n.type === "subscription") {
        // the renewal, the invoices and the pay buttons are under Team, Plans & Billing
        setView("admin");
        setAdminTab("billing");
      } else {
        setView("user");
        setTab("sessions");
      }
    },
    [qc, tenant],
  );
  // Who is writing a reply in which chat: a teammate's note that goes stale if they stop without saying so.
  const [typers, setTypers] = useState<Record<string, { name: string; at: number }>>({});
  const onCompose = useCallback(
    (p: { conversationId: string; userId: number; name: string; typing: boolean }) => {
      if (String(p.userId) === String(user?.id)) return;
      const key = `${p.conversationId}|${p.userId}`;
      setTypers((old) => {
        if (!p.typing) {
          if (!(key in old)) return old;
          const { [key]: _gone, ...rest } = old;
          return rest;
        }
        return { ...old, [key]: { name: p.name, at: Date.now() } };
      });
    },
    [user?.id],
  );
  const anyTypers = Object.keys(typers).length > 0;
  useEffect(() => {
    if (!anyTypers) return;
    const t = setInterval(() => {
      setTypers((old) => {
        const live = Object.entries(old).filter(([, v]) => Date.now() - v.at < 8000);
        return live.length === Object.keys(old).length ? old : Object.fromEntries(live);
      });
    }, 2000);
    return () => clearInterval(t);
  }, [anyTypers]);
  const typing = useMemo(() => {
    const by: Record<string, string[]> = {};
    for (const [key, v] of Object.entries(typers)) (by[key.split("|")[0]] ||= []).push(v.name);
    return by;
  }, [typers]);
  const sync = useInboxRealtime({
    enabled,
    qc,
    tenant,
    selected,
    onCompose,
    onNotification: (n) => {
      playPing();
      setToasts((t) => [n, ...t].slice(0, 3));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 7000);
      if (document.visibilityState !== "visible")
        showDesktopNotification(n.title, n.body, () => goTo(n));
    },
    onIncoming: ({ conversation, message }) => {
      // Only when nobody is looking at this chat; the list badge covers the rest.
      if (document.visibilityState === "visible") return;
      showDesktopNotification(
        conversation?.contactName || "New WhatsApp message",
        String(message.text || "").slice(0, 120),
        () => conversation?.id && openConversationRef.current(conversation.id),
      );
    },
  });
  useEffect(() => {
    if (!user || platformAdmin || user.mustChangePassword) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, platformAdmin]);

  const run = async (action: () => Promise<any>) => {
    setError("");
    try {
      return await action();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };
  // Opening a chat also asks WhatsApp for its recent history, once per chat per visit. The inbox only
  // backfills the most recent chats up front, so without this an older chat can open empty.
  const syncedChats = useRef(new Set<string>());
  const [mediaProgress, setMediaProgress] = useState<{
    chatId: string;
    loading: boolean;
    saved: number;
    failed: number;
    note?: string;
  } | null>(null);
  const [historyState, setHistoryState] = useState<{
    id: string;
    loading: boolean;
    note?: string;
  } | null>(null);
  const openChat = useCallback(
    (id: string, force = false) => {
      setSelected(id);
      if (force || !syncedChats.current.has(id)) {
        syncedChats.current.add(id);
        setHistoryState({ id, loading: true });
        void api
          .fetchConversationMessages(id, { sync: true })
          .then(async (result) => {
            await refresh("messages", "conversations");
            const h = result?.historySync;
            setHistoryState({
              id,
              loading: false,
              note: h?.error
                ? `WhatsApp could not load this chat's history right now (${h.error}).`
                : h && h.fetched === 0
                  ? "WhatsApp has no earlier messages for this chat."
                  : undefined,
            });
          })
          // Older history is a bonus, never an error banner.
          .catch(() =>
            setHistoryState({
              id,
              loading: false,
              note: "Could not reach WhatsApp to load this chat's history.",
            }),
          );
      }
      // Clearing the unread badge also happens locally via the realtime update, so a
      // failure here is not worth interrupting the person who is just reading a chat.
      void api
        .markConversationRead(id)
        .then(() => refresh("conversations"))
        .catch((e) => console.warn("Could not mark chat as read:", e.message));
    },
    [refresh],
  );
  // Files that were never saved are fetched from WhatsApp when someone asks for them.
  const loadMedia = async (chatId: string, messageId: string) => {
    await api.fetchMessageMedia(chatId, messageId);
    await refresh("messages");
  };
  const loadAllMedia = async (chatId: string) => {
    setMediaProgress({ chatId, loading: true, saved: 0, failed: 0 });
    let before: string | null = null,
      saved = 0,
      failed = 0,
      note: string | undefined;
    try {
      for (let batch = 0; batch < 100; batch++) {
        const r = await api.fetchPendingMedia(chatId, { before });
        saved += r.saved;
        failed += r.failed.length;
        if (r.stopped) note = r.stopped;
        before = r.nextBefore;
        setMediaProgress({ chatId, loading: true, saved, failed, note });
        await refresh("messages");
        if (!before) break;
      }
    } catch (e: any) {
      note = e.message;
    }
    setMediaProgress({ chatId, loading: false, saved, failed, note });
  };
  // Open a chat from anywhere (a notification, a toast): fetch it if the list has not
  // loaded it yet, then show it in the inbox.
  useEffect(() => {
    openConversationRef.current = (id: string) => {
      setView("user");
      setTab("inbox");
      void api
        .fetchConversation(id)
        .then((thread) => {
          setOpenedThread(thread);
          openChat(id);
        })
        .catch((e) => setError(e.message));
    };
  }, [openChat]);
  const send = async (id: string, text: string, note = false) => {
    const key = crypto.randomUUID();
    const pending: ChatMessage = {
      id: `optimistic_${key}`,
      idempotencyKey: key,
      chatId: id,
      sender: "agent",
      agentName: user?.name,
      text,
      type: note ? "internal_note" : "text",
      isNote: note,
      status: "sending",
      ack: 0,
      timestamp: new Date().toISOString(),
      timestampEpoch: Math.floor(Date.now() / 1000),
    };
    setOptimistic((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), pending],
    }));
    try {
      const result = await api.addMessage(id, {
        text,
        idempotencyKey: key,
        type: pending.type,
        isNote: note,
      });
      setOptimistic((prev) => ({
        ...prev,
        [id]: reconcileMessages(prev[id] || [], [result.message]),
      }));
      await refresh("messages", "conversations");
    } catch (e: any) {
      setError(e.message);
      setOptimistic((prev) => ({
        ...prev,
        [id]: (prev[id] || []).map((m) =>
          m.id === pending.id
            ? { ...m, status: e.status ? "failed" : "uncertain" }
            : m,
        ),
      }));
    }
  };
  const attachment = async (
    id: string,
    data: { data: string; filename: string; kind: string; mimeType: string },
  ) => {
    try {
      await run(async () => {
        const file = await (await fetch(data.data)).blob();
        await api.uploadAttachment(id, file, data.filename, data.mimeType);
        await refresh("messages", "conversations");
      });
    } catch {}
  };
  const logout = async () => {
    try {
      await api.logoutUser();
    } catch {
    } finally {
      disconnectSocket();
      qc.clear();
      setOptimistic({});
      setSelected(null);
      setOpenedThread(null);
      syncedChats.current.clear();
      setUser(null);
    }
  };
  if (!ready)
    return (
      <div
        className="h-dvh grid place-items-center bg-app"
        role="status"
        aria-label="Loading Scriwo"
      >
        <ScriwoMark size={56} className="animate-pulse" />
      </div>
    );
  if (!user)
    return (
      <LoginPage
        onAuthSuccess={(u) => {
          qc.clear();
          setUser(u);
        }}
      />
    );
  if (user.mustChangePassword)
    return (
      <ChangePassword
        user={user}
        onChanged={(u) => {
          qc.clear();
          setUser(u);
        }}
        onLogout={logout}
      />
    );
  if (platformAdmin)
    return <PlatformAdmin adminName={user.name} onLogout={logout} />;
  const queryError =
    sessionsQuery.error ||
    conversations.error ||
    contactQuery.error ||
    history.error;
  // Features the company's plan doesn't include are shown as locked rather than as screens that fail.
  const planName: string = capabilities.data?.plan?.name || "current";
  const locked = (feature: string) =>
    capabilities.data?.plan?.features?.[feature] === false;
  const lapsed = Boolean(capabilities.data?.plan?.lapsed);
  const openPlan = () => {
    setView("admin");
    setAdminTab("billing");
  };
  // owners and administrators can open the plan screen; everyone else is told to ask them
  const planAction = manager ? openPlan : undefined;
  const connected = sessions.filter((x) => x.status === "CONNECTED").length;
  const unreadChats = chats.filter((c) => c.unreadCount > 0).length;
  // A chat was opened or created (from Contacts or New chat): refresh and go to it.
  const openStartedChat = async (result: api.StartedChat) => {
    await refresh("conversations", ...(result.contactCreated ? ["contacts"] : []));
    setOpenedThread(result.conversation);
    setSelected(result.conversation.id);
    setTab("inbox");
    setView("user");
  };
  const go = (item: NavItem) => {
    setView(item.view);
    if (item.tab) setTab(item.tab);
  };
  const openPair = () => {
    setView("user");
    setTab("sessions");
    setPairOpen(true);
  };
  const openBroadcast = () => {
    setView("user");
    setTab("campaigns");
    setCampaignOpen(true);
  };
  const switchWorkspace = async (id: string) => {
    const result = await api.switchWorkspace(id);
    if (result.status === "error") {
      setError(result.message || "Workspace switch failed");
      return;
    }
    disconnectSocket();
    qc.clear();
    setOptimistic({});
    setSelected(null);
    setOpenedThread(null);
    syncedChats.current.clear();
    setUser(result.user);
  };
  const commands: Command[] = [
    ...[...NAV, ...NAV_SECONDARY]
      .filter((i) => !i.manager || manager)
      .map((i) => ({
        id: `go-${i.key}`,
        label: i.label,
        hint: "Go to",
        icon: i.icon,
        run: () => go(i),
      })),
    {
      id: "pair",
      label: "Connect a WhatsApp number",
      hint: "Action",
      icon: Plus,
      run: openPair,
    },
    ...(manager
      ? [
          {
            id: "broadcast",
            label: "New broadcast",
            hint: "Action",
            icon: Plus,
            run: openBroadcast,
          },
        ]
      : []),
    {
      id: "light",
      label: "Switch to light appearance",
      hint: "Appearance",
      icon: Sun,
      run: () => theme.setChoice("light"),
    },
    {
      id: "dark",
      label: "Switch to dark appearance",
      hint: "Appearance",
      icon: Moon,
      run: () => theme.setChoice("dark"),
    },
    {
      id: "refresh",
      label: "Refresh everything",
      hint: "Action",
      icon: RefreshCw,
      run: () =>
        void refresh("sessions", "conversations", "contacts", "messages"),
    },
    {
      id: "logout",
      label: "Sign out",
      hint: "Account",
      icon: LogOut,
      run: () => void logout(),
    },
  ];
  const bell = (placement: "dock" | "tab") => (
    <NotificationBell
      placement={placement}
      items={notificationsQuery.data?.notifications || []}
      unreadCount={unreadNotifications}
      desktop={desktop}
      onOpen={goTo}
      onMarkAllRead={() => {
        markNotificationsRead(qc, tenant, "all");
        void api.markAllNotificationsRead().catch(() => {});
      }}
      onEnableDesktop={() =>
        void requestDesktopPermission().then(() =>
          setDesktop(desktopPermission()),
        )
      }
    />
  );
  const workspaceList = workspaces.data?.workspaces || [];
  const inbox = view === "user" && tab === "inbox";
  return (
    <div className="h-dvh flex flex-col lg:flex-row bg-app text-fg overflow-hidden">
      <Dock
        view={view}
        tab={tab}
        onNavigate={go}
        unreadChats={unreadChats}
        manager={manager}
        onSearch={() => setPaletteOpen(true)}
        bell={bell("dock")}
        profile={
          <ProfileMenu
            user={user}
            theme={theme.choice}
            onTheme={theme.setChoice}
            onLogout={() => void logout()}
            workspaces={workspaceList}
            currentWorkspace={tenant}
            onSwitchWorkspace={(id) => void switchWorkspace(id)}
            status={
              engine === "ok" ? "ok" : engine === "down" ? "warn" : undefined
            }
            connected={connected}
          />
        }
      />
      <NotificationToasts
        toasts={toasts}
        onOpen={goTo}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
      <div className="flex-1 min-h-0 min-w-0 relative">
        {(error || queryError || sync || info) && (
          <div className="absolute top-3 inset-x-0 z-40 flex flex-col items-center gap-2 px-4 pointer-events-none">
            {(error || queryError) && (
              <div
                role="alert"
                className="pointer-events-auto glass ring-1 ring-danger/30 pop rounded-full pl-5 pr-2 h-12 flex items-center gap-3 text-[14px] text-fg max-w-full animate-rise"
              >
                <span className="truncate">
                  {error || (queryError as Error).message}
                </span>
                <button
                  className={`${"h-8 px-4 rounded-full bg-danger/10 text-danger text-[13px] font-medium hover:bg-danger/20 shrink-0"}`}
                  onClick={() => {
                    setError("");
                    void refresh(
                      "sessions",
                      "conversations",
                      "contacts",
                      "messages",
                    );
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            {info && (
              <div
                role="status"
                className="pointer-events-auto glass ring-1 ring-gold/40 pop rounded-3xl pl-5 pr-2 py-2.5 flex items-center gap-3 text-[14px] text-fg max-w-xl animate-rise"
              >
                <span>{info}</span>
                <button
                  className="h-8 px-4 rounded-full bg-surface-2 text-[13px] font-medium hover:bg-surface-3 shrink-0"
                  onClick={() => setInfo("")}
                >
                  Got it
                </button>
              </div>
            )}
            {sync && (
              <div
                role="status"
                className="pointer-events-auto glass ring-1 ring-line pop rounded-full px-5 h-10 flex items-center gap-2.5 text-[13.5px] text-fg-2 animate-rise"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-gold ${sync.phase === "failed" ? "" : "animate-spin"}`}
                />
                {sync.phase === "failed"
                  ? "Couldn't finish syncing WhatsApp. It will retry automatically."
                  : sync.total
                    ? `Syncing your WhatsApp · ${sync.done} of ${sync.total} chats`
                    : "Syncing your WhatsApp…"}
              </div>
            )}
          </div>
        )}
        <main
          className={`h-full min-w-0 ${inbox ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {view === "user" && tab === "inbox" && (
            <Inbox
              chats={chats}
              messages={selected ? { [selected]: visibleMessages } : {}}
              contacts={contacts}
              cannedReplies={replies.data?.replies || []}
              sessions={sessions}
              selectedChatId={selected}
              onOpenChat={openChat}
              historyStatus={
                historyState?.id === selected ? historyState : null
              }
              mediaPending={history.data?.pages[0]?.mediaPending || 0}
              mediaProgress={mediaProgress}
              onLoadMedia={loadMedia}
              onRefreshMedia={refreshMedia}
              assistant={{
                available: Boolean(capabilities.data?.ai?.available),
                locked: capabilities.data?.ai?.reason === "plan",
              }}
              onLoadAllMedia={(id) => void loadAllMedia(id)}
              onSendMessage={send}
              onSendAttachment={attachment}
              onAssignAgent={(id, name) => {
                void run(async () => {
                  const unassign = name === "Unassigned";
                  // Send the teammate's id so access and notifications reach the right person.
                  const member = (team.data?.members || []).find(
                    (m: { id: number; name: string }) => m.name === name,
                  );
                  await api.patchChat(id, {
                    assignedTo: unassign ? "" : name,
                    ...(member ? { assignedUserId: member.id } : {}),
                  });
                  await refresh("conversations");
                }).catch(() => {});
              }}
              onToggleResolve={(id) => {
                void run(async () => {
                  await api.patchChat(id, {
                    isClosed: !chats.find((c) => c.id === id)?.isClosed,
                  });
                  await refresh("conversations");
                }).catch(() => {});
              }}
              onSyncInbox={async (name) => {
                await run(() => api.syncInboxForSession(name));
                await refresh("contacts", "conversations", "messages");
              }}
              teammates={team.data?.members || []}
              mediaEnabled={Boolean(capabilities.data?.media)}
              isLoading={conversations.isPending || history.isFetching}
              hasMoreChats={Boolean(conversations.hasNextPage)}
              onLoadMoreChats={() => void conversations.fetchNextPage()}
              hasOlderMessages={Boolean(history.hasNextPage)}
              onLoadOlder={() => void history.fetchNextPage()}
              onFilterChange={changeFilter}
              availability={myAvailability.data}
              onSetAvailable={(available) => {
                void run(async () => {
                  await api.setMyAvailability(available);
                  await qc.invalidateQueries({ queryKey: ["my-availability", tenant] });
                  await qc.invalidateQueries({ queryKey: ["assignment", tenant] });
                }).catch(() => {});
              }}
              replyTargetMinutes={capabilities.data?.replyTargetMinutes}
              teams={capabilities.data?.teams}
              typing={typing}
              onCompose={(conversationId, isTyping) => getSocket().emit("compose", { conversationId, typing: isTyping })}
              onTogglePin={(id, pinned) => {
                void run(async () => {
                  await api.patchChat(id, { isPinned: pinned });
                  await refresh("conversations");
                }).catch(() => {});
              }}
              labels={labelList.data ?? []}
              onNewChat={() => setNewChat({})}
              onRenameContact={async (contactId, patch) => {
                await api.patchContact(contactId, patch);
                await refresh("contacts", "conversations");
              }}
              onSetContactLabels={async (contactId, labelIds) => {
                await api.patchContact(contactId, { labelIds });
                await refresh("contacts", "conversations", "labels");
              }}
              currentUserId={user?.id}
              onSaveReply={async (data) => {
                await api.apiPost("/api/workspace/canned-replies", data);
                await refresh("replies");
              }}
              canManage={manager}
              renderLeadPanel={
                locked("leads")
                  ? undefined
                  : (chat) => (
                      <LeadPanel
                        conversationId={chat.id}
                        contactName={chat.contactName}
                        teammates={team.data?.members || []}
                        aiAvailable={Boolean(capabilities.data?.ai?.available)}
                        isManager={manager}
                        onOpenChat={(id) => openConversationRef.current(id)}
                      />
                    )
              }
            />
          )}
          {view === "user" && tab === "pipeline" &&
            (locked("leads") ? (
              <FeatureLocked feature="The sales pipeline" plan={planName} needs="Growth" lapsed={lapsed} onOpenPlan={planAction} />
            ) : (
              <Pipeline
                teammates={team.data?.members || []}
                sessions={sessions}
                currentUserId={Number(user?.id)}
                isManager={manager}
                aiAvailable={Boolean(capabilities.data?.ai?.available)}
                onOpenChat={(id) => openConversationRef.current(id)}
              />
            ))}
          {view === "user" && tab === "sessions" && (
            <SessionManager
              canManage={manager}
              health={healthByNumber}
              sessions={sessions}
              isPairModalOpen={pairOpen}
              setIsPairModalOpen={setPairOpen}
              onAddSession={() => void refresh("sessions")}
              onRestartSession={(id) => {
                const s = sessions.find((x) => x.id === id);
                if (s)
                  void run(async () => {
                    await api.startLiveSession(s.sessionKey);
                    await refresh("sessions");
                  }).catch(() => {});
              }}
              onDeleteSession={(id) => {
                const s = sessions.find((x) => x.id === id);
                if (
                  s &&
                  window.confirm(
                    "Remove this number? It will be disconnected from WhatsApp and unlinked from the phone. Your saved conversations stay in Scriwo.",
                  )
                )
                  void run(async () => {
                    const result = await api.deleteSession(s.sessionKey);
                    // The phone could not be unlinked automatically: tell the person exactly what to do.
                    if (result?.unlinked === false && result?.message)
                      setInfo(result.message);
                    await refresh("sessions");
                  }).catch(() => {});
              }}
            />
          )}
          {view === "user" && tab === "contacts" && (
            <Contacts
              canManageLabels={manager}
              pipeline={locked("leads") ? undefined : { teammates: team.data?.members || [], isManager: manager, aiAvailable: false }}
              onSelectChat={(person) => {
                const usable = sessions.filter((x) => x.status === "CONNECTED");
                if (usable.length !== 1) return setNewChat({ person });
                // one connected number: no need to ask which
                void run(async () => {
                  const result = await api.startChat({ contactId: person.contactId, sessionName: usable[0].sessionKey });
                  await openStartedChat(result);
                }).catch(() => {});
              }}
            />
          )}
          {view === "user" && tab === "reports" && manager && (
            <Reports sessions={sessions} currentUserId={user?.id} onOpenChat={(id) => openConversationRef.current(id)} />
          )}
          {view === "user" && tab === "dashboard" && (
            <Dashboard
              workspaceName={user.company_name}
              onNavigateToInbox={() => setTab("inbox")}
              onOpenSessionModal={() => {
                setTab("sessions");
                setPairOpen(true);
              }}
              onOpenNewBroadcast={() => {
                setTab("campaigns");
                setCampaignOpen(true);
              }}
            />
          )}
          {view === "user" &&
            tab === "campaigns" &&
            (!manager ? (
              <p className="p-5">
                Campaigns require workspace administrator access.
              </p>
            ) : locked("broadcasts") ? (
              <FeatureLocked feature="Broadcasts" plan={planName} needs="Growth" lapsed={lapsed} onOpenPlan={planAction} />
            ) : (
              <Campaigns
                campaigns={campaigns.data?.campaigns || []}
                sessions={sessions}
                companyName={user.company_name}
                onAddCampaign={async (data) => {
                  await run(() => api.addCampaign(data));
                  await refresh("campaigns");
                }}
                onDuplicateCampaign={async (id) => {
                  await run(() => api.duplicateCampaign(id));
                  await refresh("campaigns");
                }}
                onStartCampaign={async (id) => {
                  await run(() => api.startCampaign(id));
                  await refresh("campaigns");
                }}
                onStopCampaign={async (id) => {
                  await run(() => api.stopCampaign(id));
                  await refresh("campaigns");
                }}
                isCreateModalOpen={campaignOpen}
                setIsCreateModalOpen={setCampaignOpen}
              />
            ))}
          {view === "user" &&
            tab === "automations" &&
            (!manager ? (
              <p className="p-5">
                Automations require workspace administrator access.
              </p>
            ) : locked("automations") ? (
              <FeatureLocked feature="Automations" plan={planName} needs="Growth" lapsed={lapsed} onOpenPlan={planAction} />
            ) : (
              <Automations
                automations={automations.data?.automations || []}
                teammates={team.data?.members || []}
                onChanged={() => void refresh("automations")}
              />
            ))}
          {view === "admin" && manager && (
            <Page>
              <PageHeader
                eyebrow={user.company_name}
                title="Team"
                subtitle="Invite teammates, keep an eye on the system and review activity."
                actions={
                  <Segmented
                    label="Team sections"
                    items={ADMIN_TABS}
                    value={adminTab}
                    onChange={setAdminTab}
                  />
                }
              />
              {adminTab === "users" && (
                <>
                  <UserManagement
                    canChangeRoles={Boolean(
                      (user as any).membershipRole === "owner" ||
                      user.isSuperAdmin,
                    )}
                  />
                  <SupportAccessCard />
                </>
              )}
              {adminTab === "audit" &&
                (locked("audit") ? (
                  <FeatureLocked feature="The audit log" plan={planName} needs="Growth" lapsed={lapsed} onOpenPlan={planAction} />
                ) : (
                  <AuditLogs />
                ))}
              {adminTab === "billing" && (
                <BillingPage
                  plan={capabilities.data?.plan}
                  numbersLimit={capabilities.data?.numbersLimit}
                  numbersUsed={sessionsQuery.data?.length}
                  ai={capabilities.data?.ai}
                  subscription={capabilities.data?.subscription}
                />
              )}
              {adminTab === "cluster" && <ClusterHealth />}
            </Page>
          )}
          {view === "developer" && (
            <DeveloperGuide
              canManage={manager}
              apiPlan={locked("api") ? planName : undefined}
              activeDevTab={
                !manager && (devTab === "keys" || devTab === "webhooks")
                  ? "docs"
                  : devTab
              }
              onSelectDevTab={setDevTab}
            />
          )}
        </main>
      </div>
      <TabBar
        view={view}
        tab={tab}
        onNavigate={go}
        unreadChats={unreadChats}
        manager={manager}
        bell={bell("tab")}
        sheetExtras={
          <div className="space-y-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full h-12 rounded-2xl bg-surface-2 text-[14.5px] text-fg-2 text-left px-4"
            >
              Search or jump to…
            </button>
            <div className="rounded-3xl bg-surface-2 p-4 space-y-3">
              <div>
                <div className="font-semibold text-[15px]">{user.name}</div>
                <div className="text-[13px] text-fg-2">{user.email}</div>
                <div className="text-[12px] text-gold font-medium mt-1">
                  {user.company_name}
                </div>
              </div>
              <ThemeSwitch value={theme.choice} onChange={theme.setChoice} />
              <button
                onClick={() => void logout()}
                className="w-full h-11 rounded-2xl bg-danger/10 text-danger text-[14px] font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        }
      />
      <NewChatSheet
        open={newChat !== null}
        person={newChat?.person}
        sessions={sessions}
        currentUserId={user?.id}
        preferredNumber={filter.sessionName}
        onClose={() => setNewChat(null)}
        onStarted={(result) => {
          setNewChat(null);
          void openStartedChat(result);
        }}
      />
    </div>
  );
}
