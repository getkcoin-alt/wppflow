import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Navbar } from "./components/layout/Navbar";
import {
  Sidebar,
  type UserSubTab,
  type AdminSubTab,
  type DevSubTab,
} from "./components/layout/Sidebar";
import { LoginPage } from "./components/auth/LoginPage";
import { ChangePassword } from "./components/auth/ChangePassword";
import { PlatformAdmin } from "./components/platform/PlatformAdmin";
import { Inbox } from "./components/user/Inbox";
import { SessionManager } from "./components/user/SessionManager";
import { Contacts } from "./components/user/Contacts";
import { Campaigns } from "./components/user/Campaigns";
import { Automations } from "./components/user/Automations";
import { Dashboard } from "./components/user/Dashboard";
import { UserManagement } from "./components/admin/UserManagement";
import { AuditLogs } from "./components/admin/AuditLogs";
import { ClusterHealth } from "./components/admin/ClusterHealth";
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
import { reconcileMessages } from "./utils/messages";

export function App() {
  const qc = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const [view, setView] = useState<"user" | "admin" | "developer">("user");
  const [tab, setTab] = useState<UserSubTab>("inbox"),
    [adminTab, setAdminTab] = useState<AdminSubTab>("users"),
    [devTab, setDevTab] = useState<DevSubTab>("docs");
  const [pairOpen, setPairOpen] = useState(false),
    [campaignOpen, setCampaignOpen] = useState(false),
    [selected, setSelected] = useState<string | null>(null);
  const [openedThread, setOpenedThread] = useState<ChatThread | null>(null);
  const [filter, setFilter] = useState({ search: "", filter: "all" }),
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
    (search: string, filter: string) =>
      setFilter((old) =>
        old.search === search && old.filter === filter
          ? old
          : { search, filter },
      ),
    [],
  );
  useEffect(() => {
    if (!enabled) return;
    getSocket();
    return () => disconnectSocket();
  }, [enabled]);
  const sync = useInboxRealtime({ enabled, qc, tenant, selected });
  const run = async (action: () => Promise<any>) => {
    setError("");
    try {
      return await action();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };
  const openChat = useCallback(
    (id: string, sync = false) => {
      setSelected(id);
      if (sync)
        void api
          .fetchConversationMessages(id, { sync: true })
          .then(() => refresh("messages"))
          .catch(() => {}); // older history is a bonus, never an error banner
      // Clearing the unread badge also happens locally via the realtime update, so a
      // failure here is not worth interrupting the person who is just reading a chat.
      void api
        .markConversationRead(id)
        .then(() => refresh("conversations"))
        .catch((e) => console.warn("Could not mark chat as read:", e.message));
    },
    [refresh],
  );
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
      setUser(null);
    }
  };
  if (!ready)
    return <div className="p-8 text-slate-300">Restoring your workspace…</div>;
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
  return (
    <div className="min-h-screen bg-[#0c1317] text-[#e9edef]">
      <Navbar
        currentView={view}
        onSelectView={setView}
        sessions={sessions}
        currentUser={user}
        onOpenNewSession={() => {
          setView("user");
          setTab("sessions");
          setPairOpen(true);
        }}
        onOpenNewBroadcast={() => {
          setView("user");
          setTab("campaigns");
          setCampaignOpen(true);
        }}
        onOpenAuthModal={() => {}}
        onLogout={() => void logout()}
      />
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar
            currentView={view}
            activeUserTab={tab}
            onSelectUserTab={setTab}
            activeAdminTab={adminTab}
            onSelectAdminTab={setAdminTab}
            activeDevTab={devTab}
            onSelectDevTab={setDevTab}
            unreadChatCount={chats.filter((c) => c.unreadCount > 0).length}
            canManage={manager}
          />
        </div>
        <main
          className={`flex-1 min-w-0 ${view === "user" && tab === "inbox" ? "" : "p-4 sm:p-6"}`}
        >
          {workspaces.data?.workspaces?.length > 1 && (
            <label className="block p-3 text-sm">
              Workspace{" "}
              <select
                className="ml-2 p-2 bg-[#202c33] rounded"
                value={tenant || ""}
                onChange={async (e) => {
                  const result = await api.switchWorkspace(e.target.value);
                  if (result.status === "error") {
                    setError(result.message || "Workspace switch failed");
                    return;
                  }
                  disconnectSocket();
                  qc.clear();
                  setOptimistic({});
                  setSelected(null);
                  setOpenedThread(null);
                  setUser(result.user);
                }}
              >
                {workspaces.data.workspaces.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <nav className="lg:hidden flex flex-wrap gap-3 p-3 text-sm">
            {(
              [
                "inbox",
                "sessions",
                "contacts",
                "dashboard",
                "campaigns",
                "automations",
              ] as UserSubTab[]
            ).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setView("user");
                  setTab(t);
                }}
              >
                {t}
              </button>
            ))}
          </nav>
          {(error || queryError) && (
            <div
              role="alert"
              className="m-3 p-3 rounded-lg bg-rose-950 text-rose-200"
            >
              {error || (queryError as Error).message}
              <button
                className="ml-3 underline"
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
          {sync && (
            <div
              role="status"
              className="m-3 px-3 py-2 rounded-lg bg-[#202c33] text-sm text-slate-300"
            >
              {sync.phase === "failed"
                ? "Couldn't finish syncing WhatsApp. It will retry automatically."
                : sync.total
                  ? `Syncing your WhatsApp… ${sync.done} of ${sync.total} chats`
                  : "Syncing your WhatsApp…"}
            </div>
          )}
          {view === "user" && tab === "inbox" && (
            <Inbox
              chats={chats}
              messages={selected ? { [selected]: visibleMessages } : {}}
              contacts={contacts}
              cannedReplies={replies.data?.replies || []}
              sessions={sessions}
              selectedChatId={selected}
              onOpenChat={openChat}
              onSendMessage={send}
              onSendAttachment={attachment}
              onAssignAgent={(id, name) => {
                void run(async () => {
                  await api.patchChat(id, {
                    assignedTo: name === "Unassigned" ? "" : name,
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
              onSaveReply={async (data) => {
                await api.apiPost("/api/workspace/canned-replies", data);
                await refresh("replies");
              }}
              canManage={manager}
            />
          )}
          {view === "user" && tab === "sessions" && (
            <SessionManager
              canManage={manager}
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
                    "Disconnect and remove this session? Saved credentials and inbox history will be retained.",
                  )
                )
                  void run(async () => {
                    await api.deleteSession(s.sessionKey);
                    await refresh("sessions");
                  }).catch(() => {});
              }}
            />
          )}
          {view === "user" && tab === "contacts" && (
            <Contacts
              onSelectChat={(id) => {
                void run(async () => {
                  const session = sessions.find(
                    (s) => s.status === "CONNECTED",
                  );
                  if (!session)
                    throw new Error("Connect a WhatsApp session first");
                  const result = await api.addChat({
                    contactId: id,
                    sessionName: session.sessionKey,
                  });
                  await refresh("conversations");
                  setOpenedThread(result.conversation);
                  setSelected(result.conversation.id);
                  setTab("inbox");
                }).catch(() => {});
              }}
            />
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
            (manager ? (
              <Campaigns
                campaigns={campaigns.data?.campaigns || []}
                sessions={sessions}
                onAddCampaign={async (data) => {
                  await run(() => api.addCampaign(data));
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
            ) : (
              <p className="p-5">
                Campaigns require workspace administrator access.
              </p>
            ))}
          {view === "user" &&
            tab === "automations" &&
            (manager ? (
              <Automations
                automations={automations.data?.automations || []}
                onChanged={() => void refresh("automations")}
              />
            ) : (
              <p className="p-5">
                Automations require workspace administrator access.
              </p>
            ))}
          {view === "admin" && manager && adminTab === "users" && (
            <UserManagement
              canChangeRoles={Boolean(
                (user as any).membershipRole === "owner" || user.isSuperAdmin,
              )}
            />
          )}
          {view === "admin" && manager && adminTab === "audit" && <AuditLogs />}
          {view === "admin" && manager && adminTab === "cluster" && (
            <ClusterHealth />
          )}
          {view === "developer" && (
            <DeveloperGuide
              canManage={manager}
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
    </div>
  );
}
