import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, UserSubTab, AdminSubTab, DevSubTab } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { AuthModal } from './components/auth/AuthModal';
import { getSocket, disconnectSocket } from './services/socket';
import { UserManagement } from './components/admin/UserManagement';
import { ClusterHealth } from './components/admin/ClusterHealth';
import { AuditLogs } from './components/admin/AuditLogs';
import { Dashboard } from './components/user/Dashboard';
import { SessionManager } from './components/user/SessionManager';
import { Inbox } from './components/user/Inbox';
import { Campaigns } from './components/user/Campaigns';
import { Contacts } from './components/user/Contacts';
import { Automations } from './components/user/Automations';
import { DeveloperGuide } from './components/developer/DeveloperGuide';

import {
  UserAccount, WhatsAppSession, ChatThread, ChatMessage,
  BroadcastCampaign, AutomationRule, WebhookLog, AccountStatus, AuthUser
} from './types';

import {
  getStoredToken, getCurrentUser, clearStoredToken,
  getLiveSessions, closeLiveSession,
  fetchContacts, addContact,
  fetchChats, addChat, patchChat,
  fetchMessages, addMessage,
  sendLiveMessage,
  sendLiveMedia,
  fetchCampaigns, addCampaign,
  fetchAutomations, addAutomation, toggleAutomationApi,
  createTenantUser, updateTenantUser, deleteTenantUser,
} from './services/api';

import { apiEndpoints, initialWebhookLogs, cannedReplies } from './data/staticData';

const CLUSTER_METRICS_BASE = {
  activeContainers: 1, totalSessions: 0, cpuUsagePercent: 24,
  ramUsagePercent: 42, ramUsageGb: 2.4, totalRamGb: 8.0,
  queueDepth: 0, avgResponseMs: 142, uptimeHours: 0, systemStatus: 'healthy' as const
};

export function App() {
  const [currentView, setCurrentView] = useState<'user' | 'admin' | 'developer'>('user');
  const [activeUserTab, setActiveUserTab] = useState<UserSubTab>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSubTab>('users');
  const [activeDevTab, setActiveDevTab] = useState<DevSubTab>('docs');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const canManageWorkspace = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isPlatformSuperAdmin = currentUser?.email?.toLowerCase() === 'admin@wppflow.io';

  useEffect(() => {
    if (currentUser && !canManageWorkspace && currentView !== 'user') setCurrentView('user');
  }, [currentUser, canManageWorkspace, currentView]);

  // Restore session on load
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      getCurrentUser(token).then(user => {
        if (user) setCurrentUser(user);
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleAuthSuccess = (user: AuthUser, _token: string) => {
    setCurrentUser(user);
    if (user.role === 'admin') setCurrentView('admin');
  };

  const handleLogout = () => {
    clearStoredToken();
    disconnectSocket();
    setCurrentUser(null);
    setSessions([]);
    setContacts({});
    setChats([]);
    setMessages({});
    setCampaigns([]);
    setAutomations([]);
  };

  // ─── App Data State ───────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [contacts, setContacts] = useState<Record<string, any>>({});
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(initialWebhookLogs);
  const [metrics, setMetrics] = useState(CLUSTER_METRICS_BASE);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);

  // ─── Load all data when user logs in ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    // Sessions
    getLiveSessions().then(liveList => {
      if (liveList?.length > 0) {
        setSessions(liveList.map(ls => ({
          id: `sess_${ls.sessionKey}`,
          sessionKey: ls.sessionKey,
          displayName: ls.sessionKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          phone: ls.phone || 'WhatsApp Connected',
          status: (ls.status === 'CONNECTED' ? 'CONNECTED' : ls.status === 'QRCODE' ? 'QRCODE' : 'STARTING') as any,
          battery: ls.battery || 100,
          isCharging: true,
          antiBanHealth: ls.antiBanHealth || 98,
          warmupDay: ls.warmupDay || 14,
          proxyIp: 'Railway Cloud Engine',
          messagesSentToday: 0,
          messagesLimitToday: 3000,
          lastActive: ls.lastActive || 'Just now',
          wppVersion: '2.3000.101',
          channel: 'sales' as const
        })));
      }
    });

    // Contacts
    fetchContacts().then(d => {
      const map: Record<string, any> = {};
      (d.contacts || []).forEach((c: any) => { map[c.id] = c; });
      setContacts(map);
    }).catch(() => {});

    // Chats
    fetchChats().then(d => {
      setChats(d.chats || []);
    }).catch(() => {});

    // Campaigns
    fetchCampaigns().then(d => {
      setCampaigns(d.campaigns || []);
    }).catch(() => {});

    // Automations
    fetchAutomations().then(d => {
      setAutomations(d.automations || []);
    }).catch(() => {});

  }, [currentUser]);

  // Load messages when a chat is opened (lazy)
  const loadMessages = async (chatId: string) => {
    if (messages[chatId]) return; // already loaded
    try {
      const d = await fetchMessages(chatId);
      setMessages(prev => ({ ...prev, [chatId]: d.messages || [] }));
    } catch {}
  };

  // ─── Real-time socket ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const sock = getSocket();

    sock.on('session:status', ({ session, status, phone, battery, filesRemoved }: any) => {
      if (status === 'DISCONNECTED' && filesRemoved) {
        setSessions(prev => prev.filter(s => s.sessionKey !== session));
        setChats(prev => {
          const removedChatIds = new Set(prev.filter(chat => chat.channel === session).map(chat => chat.id));
          setMessages(previousMessages => Object.fromEntries(Object.entries(previousMessages).filter(([chatId]) => !removedChatIds.has(chatId))));
          return prev.filter(chat => chat.channel !== session);
        });
        return;
      }
      setSessions(prev => prev.map(s =>
        s.sessionKey === session
          ? { ...s, status, ...(phone ? { phone } : {}), ...(battery ? { battery } : {}) }
          : s
      ));
    });

    const onChatCreated = ({ chat }: any) => {
      if (!chat?.id) return;
      setChats(prev => prev.some(c => c.id === chat.id) ? prev : [chat, ...prev]);
    };

    const onSessionMessage = ({ chatId, message }: any) => {
      if (!chatId || !message) return;
      setMessages(prev => {
        const newMsg: ChatMessage = {
          id: message.savedMessageId || message.id || `m_${Date.now()}`,
          chatId,
          sender: 'customer',
          text: message.body || '',
          type: (message.type === 'image' || message.type === 'video' || message.type === 'audio' || message.type === 'document' ? message.type : 'text') as ChatMessage['type'],
          mediaUrl: message.mediaUrl,
          timestamp: message.timestamp || 'Just now',
          status: 'delivered'
        };
        return { ...prev, [chatId]: [...(prev[chatId] || []), newMsg] };
      });
      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c,
        unreadCount: (c.unreadCount || 0) + 1,
        lastMessage: { text: message.body || '', timestamp: message.timestamp || 'Just now', status: 'delivered', fromMe: false }
      } : c));
    };

    sock.on('chat:created', onChatCreated);
    sock.on('session:message', onSessionMessage);

    return () => {
      sock.off('session:status');
      sock.off('chat:created', onChatCreated);
      sock.off('session:message', onSessionMessage);
    };
  }, [currentUser]);

  // ─── Derived state ────────────────────────────────────────────────────────
  const unreadChatCount = chats.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0);
  const totalSavedDollars = campaigns.reduce((acc, c) => acc + c.costSavedMeta, 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSendMessage = async (chatId: string, text: string, isNote: boolean = false) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const agentName = currentUser?.name || 'Agent';

    const optimistic: ChatMessage = {
      id: `m_${Date.now()}`, chatId,
      sender: 'agent', agentName,
      text, type: isNote ? 'internal_note' : 'text',
      isNote, timestamp, status: 'sent'
    };

    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), optimistic] }));

    if (!isNote) {
      setChats(prev => prev.map(c => c.id === chatId
        ? { ...c, lastMessage: { text, timestamp, status: 'sent', fromMe: true } }
        : c
      ));
    }

    try {
      if (!isNote) {
        const chat = chats.find(c => c.id === chatId);
        if (!chat?.channel || !chat.phone) throw new Error('This conversation has no WhatsApp session or phone number.');
        await sendLiveMessage(chat.channel, chat.phone, text);
      }
      const d = await addMessage(chatId, { sender: 'agent', agentName, text, type: isNote ? 'internal_note' : 'text', isNote, timestamp, status: 'sent' });
      // Replace optimistic with real
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(m => m.id === optimistic.id ? d.message : m)
      }));
      if (!isNote) {
        await patchChat(chatId, { lastMessage: { text, timestamp, status: 'sent', fromMe: true } });
      }
    } catch (error) {
      console.error('Inbox send failed:', error);
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m)
      }));
    }
  };

  const handleSendAttachment = async (chatId: string, attachment: { data: string; filename: string; kind: string; mimeType: string }) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat?.channel || !chat.phone) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const optimistic: ChatMessage = {
      id: `m_${Date.now()}`, chatId, sender: 'agent', agentName: currentUser?.name || 'Agent',
      text: attachment.filename, type: attachment.kind as ChatMessage['type'], mediaUrl: attachment.data,
      fileName: attachment.filename, timestamp, status: 'sending'
    };
    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), optimistic] }));
    try {
      await sendLiveMedia(chat.channel, chat.phone, attachment.data, attachment.filename, attachment.kind);
      const d = await addMessage(chatId, { sender: 'agent', agentName: currentUser?.name || 'Agent', text: attachment.filename, type: attachment.kind, mediaUrl: attachment.data, fileName: attachment.filename, status: 'sent', timestamp });
      setMessages(prev => ({ ...prev, [chatId]: (prev[chatId] || []).map(m => m.id === optimistic.id ? d.message : m) }));
      await patchChat(chatId, { lastMessage: { text: `Attachment: ${attachment.filename}`, timestamp, status: 'sent', fromMe: true } });
    } catch (error) {
      console.error('Inbox attachment send failed:', error);
      setMessages(prev => ({ ...prev, [chatId]: (prev[chatId] || []).map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m) }));
    }
  };

  const handleAddSession = (name: string, phone: string, channel: 'sales' | 'support' | 'vip' | 'general') => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newSession: WhatsAppSession = {
      id: `sess_${key}_${Date.now()}`, sessionKey: key, displayName: name, phone,
      status: 'CONNECTED', battery: 95, isCharging: true, antiBanHealth: 99, warmupDay: 1,
      proxyIp: 'Railway Cloud Engine', messagesSentToday: 0, messagesLimitToday: 3000,
      lastActive: 'Just now', wppVersion: '2.3000.101', channel
    };
    setSessions(prev => [newSession, ...prev.filter(s => s.sessionKey !== key)]);
  };

  const handleRestartSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'CONNECTED', lastActive: 'Just now' } : s));
  };

  const handleDeleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    if (!window.confirm(`Remove ${session.displayName || session.sessionKey}? This deletes its WhatsApp profile and inbox history.`)) return;
    try {
      const result = await closeLiveSession(session.sessionKey);
      if (result?.status !== 'success') throw new Error(result?.message || 'Session cleanup failed');
      const removedChatIds = new Set(chats.filter(chat => chat.channel === session.sessionKey).map(chat => chat.id));
      setChats(prev => prev.filter(chat => chat.channel !== session.sessionKey));
      setMessages(prev => Object.fromEntries(Object.entries(prev).filter(([chatId]) => !removedChatIds.has(chatId))));
    } catch (error) {
      console.error('Session cleanup failed:', error);
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleAddUser = async (newUserData: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin' | 'broadcastsUsed' | 'apiCallsThisMonth'>) => {
    const backendRole = newUserData.role === 'tenant_admin' ? 'admin' : newUserData.role === 'superadmin' ? 'superadmin' : newUserData.role === 'sales' ? 'sales' : 'support';
    const result = await createTenantUser({
      name: newUserData.name,
      email: newUserData.email,
      companyName: newUserData.company,
      role: backendRole,
    });
    setUsers(prev => [{ ...newUserData, id: `usr_${Date.now()}`, broadcastsUsed: 0, apiCallsThisMonth: 0, createdAt: new Date().toISOString().slice(0, 10), lastLogin: 'Never' }, ...prev]);
    return result;
  };

  const handleUpdateStatus = async (userId: string, status: AccountStatus) => {
    const result = await updateTenantUser(userId, { status });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    return result;
  };

  const handleUpdateUser = async (userId: string, updates: Record<string, unknown>) => {
    const result = await updateTenantUser(userId, updates);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...(updates.name ? { name: String(updates.name) } : {}), ...(updates.email ? { email: String(updates.email) } : {}), ...(updates.status ? { status: updates.status as AccountStatus } : {}) } : u));
    return result;
  };

  const handleUpdateQuotas = (userId: string, sessionQuota: number, broadcastLimit: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, whatsappSessionsQuota: sessionQuota, monthlyBroadcastLimit: broadcastLimit } : u));
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteTenantUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleAddCampaign = async (campaignData: Omit<BroadcastCampaign, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'repliedCount' | 'failedCount'>) => {
    const payload = {
      ...campaignData,
      sentCount: campaignData.totalRecipients,
      deliveredCount: Math.floor(campaignData.totalRecipients * 0.98),
      readCount: Math.floor(campaignData.totalRecipients * 0.88),
      repliedCount: Math.floor(campaignData.totalRecipients * 0.18),
      failedCount: Math.floor(campaignData.totalRecipients * 0.02),
    };
    try {
      const d = await addCampaign(payload);
      setCampaigns(prev => [d.campaign, ...prev]);
    } catch {
      // optimistic fallback
      setCampaigns(prev => [{ ...payload, id: `camp_${Date.now()}`, createdAt: new Date().toISOString() }, ...prev]);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    setAutomations(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r));
    try {
      const d = await toggleAutomationApi(ruleId);
      if (d.automation) {
        setAutomations(prev => prev.map(r => r.id === ruleId ? d.automation : r));
      }
    } catch {}
  };

  const handleAssignAgent = async (chatId: string, agentName: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, assignedTo: agentName } : c));
    try { await patchChat(chatId, { assignedTo: agentName }); } catch {}
  };

  const handleToggleResolve = async (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0, isClosed: !c.isClosed } : c));
    const chat = chats.find(c => c.id === chatId);
    try { await patchChat(chatId, { isClosed: !chat?.isClosed, unreadCount: 0 }); } catch {}
  };

  const handleTriggerTestWebhook = () => {
    const newLog: WebhookLog = {
      id: `wh_${Date.now()}`, event: 'onmessage', session: 'sales-primary',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'delivered',
      payload: { id: `true_14158902134@c.us_${Date.now()}`, from: '14158902134@c.us', body: 'Hello, could you share your wholesale catalog prices for Q4?', type: 'chat', notifyName: 'David K. Miller', isGroupMsg: false }
    };
    setWebhookLogs(prev => [newLog, ...prev]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0c1317] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0c1317] flex flex-col">

      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        sessions={sessions}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenNewSession={() => { setCurrentView('user'); setActiveUserTab('sessions'); setIsPairModalOpen(true); }}
        onOpenNewBroadcast={() => { setCurrentView('user'); setActiveUserTab('campaigns'); setIsCreateCampaignModalOpen(true); }}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          activeUserTab={activeUserTab}
          onSelectUserTab={setActiveUserTab}
          activeAdminTab={activeAdminTab}
          onSelectAdminTab={setActiveAdminTab}
          activeDevTab={activeDevTab}
          onSelectDevTab={setActiveDevTab}
          unreadChatCount={unreadChatCount}
          totalSavedDollars={totalSavedDollars}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0c1317]">
          <div className="max-w-7xl mx-auto">

            {currentView === 'user' && (
              <>
                {activeUserTab === 'dashboard' && (
                  <Dashboard
                    sessions={sessions}
                    campaigns={campaigns}
                    onOpenSessionModal={() => { setActiveUserTab('sessions'); setIsPairModalOpen(true); }}
                    onOpenNewBroadcast={() => { setActiveUserTab('campaigns'); setIsCreateCampaignModalOpen(true); }}
                    onNavigateToInbox={() => setActiveUserTab('inbox')}
                  />
                )}

                {activeUserTab === 'inbox' && (
                  <Inbox
                    chats={chats}
                    messages={messages}
                    contacts={contacts}
                    cannedReplies={cannedReplies}
                    onSendMessage={handleSendMessage}
                    onSendAttachment={handleSendAttachment}
                    onAssignAgent={handleAssignAgent}
                    onToggleResolve={handleToggleResolve}
                    onOpenChat={loadMessages}
                  />
                )}

                {activeUserTab === 'sessions' && (
                  <SessionManager
                    sessions={sessions}
                    onAddSession={handleAddSession}
                    onRestartSession={handleRestartSession}
                    onDeleteSession={handleDeleteSession}
                    isPairModalOpen={isPairModalOpen}
                    setIsPairModalOpen={setIsPairModalOpen}
                  />
                )}

                {activeUserTab === 'campaigns' && (
                  <Campaigns
                    campaigns={campaigns}
                    onAddCampaign={handleAddCampaign}
                    isCreateModalOpen={isCreateCampaignModalOpen}
                    setIsCreateModalOpen={setIsCreateCampaignModalOpen}
                  />
                )}

                {activeUserTab === 'contacts' && (
                  <Contacts
                    contacts={contacts}
                    onSelectChat={() => setActiveUserTab('inbox')}
                  />
                )}

                {activeUserTab === 'automations' && (
                  <Automations
                    automations={automations}
                    onToggleRule={handleToggleRule}
                  />
                )}
              </>
            )}

            {canManageWorkspace && currentView === 'admin' && (
              <>
                {activeAdminTab === 'users' && (
                  <UserManagement
                    users={users}
                    onAddUser={handleAddUser}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateUser={handleUpdateUser}
                    onUpdateQuotas={handleUpdateQuotas}
                    onDeleteUser={handleDeleteUser}
                    isPlatformSuperAdmin={isPlatformSuperAdmin}
                    workspaceName={currentUser?.company_name || ''}
                  />
                )}

                {activeAdminTab === 'cluster' && (
                  <ClusterHealth
                    metrics={metrics}
                    onRefreshMetrics={() => {
                      setMetrics(prev => ({
                        ...prev,
                        ramUsageGb: Math.max(1.2, +(prev.ramUsageGb + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                        cpuUsagePercent: Math.floor(Math.random() * 15) + 18,
                        avgResponseMs: Math.floor(Math.random() * 25) + 120,
                        totalSessions: sessions.length
                      }));
                    }}
                  />
                )}

                {activeAdminTab === 'audit' && <AuditLogs />}
              </>
            )}

            {canManageWorkspace && currentView === 'developer' && (
              <DeveloperGuide
                endpoints={apiEndpoints}
                webhookLogs={webhookLogs}
                onTriggerTestWebhook={handleTriggerTestWebhook}
                activeDevTab={activeDevTab}
                onSelectDevTab={setActiveDevTab}
              />
            )}

          </div>
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}
