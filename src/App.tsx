import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, UserSubTab, AdminSubTab, DevSubTab } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
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
  initialUsers,
  initialSessions,
  initialContacts,
  initialChats,
  initialMessages,
  cannedReplies,
  initialCampaigns,
  initialAutomations,
  apiEndpoints,
  initialWebhookLogs,
  clusterMetrics as initialMetrics
} from './data/mockData';

import { 
  UserAccount, 
  WhatsAppSession, 
  ChatThread, 
  ChatMessage, 
  BroadcastCampaign, 
  AutomationRule, 
  WebhookLog, 
  AccountStatus,
  AuthUser
} from './types';
import { AuthModal } from './components/auth/AuthModal';
import { 
  getStoredToken, 
  getCurrentUser, 
  clearStoredToken,
  getLiveSessions,
  closeLiveSession
} from './services/api';

export function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'user' | 'admin' | 'developer'>('user');
  const [activeUserTab, setActiveUserTab] = useState<UserSubTab>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSubTab>('users');
  const [activeDevTab, setActiveDevTab] = useState<DevSubTab>('docs');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
  };

  // App Data State
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);

  // Fetch live sessions from backend when user logs in
  useEffect(() => {
    if (!currentUser) return;
    getLiveSessions().then(liveList => {
      if (liveList && liveList.length > 0) {
        const mapped: WhatsAppSession[] = liveList.map((ls) => ({
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
          channel: 'sales'
        }));
        setSessions(mapped);
      }
    });
  }, [currentUser]);

  // Real-time socket: session status & incoming messages
  useEffect(() => {
    if (!currentUser) return;
    const sock = getSocket();

    sock.on('session:status', ({ session, status, phone, battery }: any) => {
      setSessions(prev => prev.map(s =>
        s.sessionKey === session
          ? { ...s, status, ...(phone ? { phone } : {}), ...(battery ? { battery } : {}) }
          : s
      ));
    });

    sock.on('session:message', ({ session, message }: any) => {
      // Find chat by session/phone and append message
      setMessages(prev => {
        const chatId = Object.keys(prev).find(id => id.includes(session)) || `chat_${session}`;
        const newMsg: ChatMessage = {
          id: message.id || `m_${Date.now()}`,
          chatId,
          sender: 'customer',
          text: message.body || '',
          type: 'text',
          timestamp: message.timestamp || 'Just now',
          status: 'delivered'
        };
        return { ...prev, [chatId]: [...(prev[chatId] || []), newMsg] };
      });
    });

    return () => {
      sock.off('session:status');
      sock.off('session:message');
    };
  }, [currentUser]);
  const [contacts, setContacts] = useState(initialContacts);
  const [chats, setChats] = useState<ChatThread[]>(initialChats);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>(initialCampaigns);
  const [automations, setAutomations] = useState<AutomationRule[]>(initialAutomations);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(initialWebhookLogs);
  const [metrics, setMetrics] = useState(initialMetrics);

  // Global Modals State
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);

  // Calculate global unread count
  const unreadChatCount = chats.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0);

  // Total Meta savings across all campaigns
  const totalSavedDollars = campaigns.reduce((acc, c) => acc + c.costSavedMeta, 0);

  // Message Sending Handler
  const handleSendMessage = (chatId: string, text: string, isNote: boolean = false) => {
    const newMsgId = `m_${Date.now()}`;
    const timestamp = 'Just now';

    const newMsg: ChatMessage = {
      id: newMsgId,
      chatId,
      sender: 'agent',
      agentName: 'Aarav Mehta',
      text,
      type: isNote ? 'internal_note' : 'text',
      isNote,
      timestamp,
      status: 'sent'
    };

    // Append to messages
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg]
    }));

    // Update chat thread preview
    if (!isNote) {
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: {
              text,
              timestamp,
              status: 'sent',
              fromMe: true
            }
          };
        }
        return c;
      }));

      // Simulate delivery to device in 800ms
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(m => m.id === newMsgId ? { ...m, status: 'delivered' } : m)
        }));
      }, 800);

      // Simulate customer read tick in 1800ms
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(m => m.id === newMsgId ? { ...m, status: 'read' } : m)
        }));
      }, 1800);
    }
  };

  // Add Session Handler
  const handleAddSession = (name: string, phone: string, channel: 'sales' | 'support' | 'vip' | 'general') => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newSession: WhatsAppSession = {
      id: `sess_${key}_${Date.now()}`,
      sessionKey: key,
      displayName: name,
      phone,
      status: 'CONNECTED',
      battery: 95,
      isCharging: true,
      antiBanHealth: 99,
      warmupDay: 1,
      proxyIp: '198.51.100.88 (Cloud Engine)',
      messagesSentToday: 0,
      messagesLimitToday: 3000,
      lastActive: 'Just now',
      wppVersion: '2.3000.101',
      channel
    };

    setSessions(prev => [newSession, ...prev.filter(s => s.sessionKey !== key)]);
  };

  const handleRestartSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: 'CONNECTED',
          lastActive: 'Just now'
        };
      }
      return s;
    }));
  };

  const handleDeleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      try {
        await closeLiveSession(session.sessionKey);
      } catch (e) {
        console.warn('Error closing session:', e);
      }
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Admin User Handlers
  const handleAddUser = (newUserData: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin' | 'broadcastsUsed' | 'apiCallsThisMonth'>) => {
    const newUser: UserAccount = {
      ...newUserData,
      id: `usr_${Date.now()}`,
      broadcastsUsed: 0,
      apiCallsThisMonth: 0,
      createdAt: '2026-09-06',
      lastLogin: 'Never'
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const handleUpdateStatus = (userId: string, status: AccountStatus) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  };

  const handleUpdateQuotas = (userId: string, sessionQuota: number, broadcastLimit: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { 
      ...u, 
      whatsappSessionsQuota: sessionQuota, 
      monthlyBroadcastLimit: broadcastLimit 
    } : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Campaign Creation Handler
  const handleAddCampaign = (campaignData: Omit<BroadcastCampaign, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'repliedCount' | 'failedCount'>) => {
    const newCamp: BroadcastCampaign = {
      ...campaignData,
      id: `camp_${Date.now()}`,
      sentCount: campaignData.totalRecipients,
      deliveredCount: Math.floor(campaignData.totalRecipients * 0.98),
      readCount: Math.floor(campaignData.totalRecipients * 0.88),
      repliedCount: Math.floor(campaignData.totalRecipients * 0.18),
      failedCount: Math.floor(campaignData.totalRecipients * 0.02),
      createdAt: '2026-09-06 08:30'
    };
    setCampaigns(prev => [newCamp, ...prev]);
  };

  // Automation Rule Toggle
  const handleToggleRule = (ruleId: string) => {
    setAutomations(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  // Assign Agent in Chat
  const handleAssignAgent = (chatId: string, agentName: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, assignedTo: agentName } : c));
  };

  // Toggle Resolve
  const handleToggleResolve = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { 
      ...c, 
      unreadCount: 0,
      isClosed: !c.isClosed 
    } : c));
  };

  // Trigger Mock Webhook Dispatch
  const handleTriggerTestWebhook = () => {
    const newLog: WebhookLog = {
      id: `wh_${Date.now()}`,
      event: 'onmessage',
      session: 'sales-primary',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'delivered',
      payload: {
        id: `true_14158902134@c.us_${Date.now()}`,
        from: '14158902134@c.us',
        body: 'Hello, could you share your wholesale catalog prices for Q4?',
        type: 'chat',
        notifyName: 'David K. Miller',
        isGroupMsg: false
      }
    };
    setWebhookLogs(prev => [newLog, ...prev]);
  };

  // Show nothing while checking stored token
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0c1317] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Auth gate — show full-page login if not authenticated
  if (!currentUser) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0c1317] flex flex-col">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        sessions={sessions}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenNewSession={() => {
          setCurrentView('user');
          setActiveUserTab('sessions');
          setIsPairModalOpen(true);
        }}
        onOpenNewBroadcast={() => {
          setCurrentView('user');
          setActiveUserTab('campaigns');
          setIsCreateCampaignModalOpen(true);
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
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

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0c1317]">
          <div className="max-w-7xl mx-auto">
            
            {/* VIEW 1: User Workspace */}
            {currentView === 'user' && (
              <>
                {activeUserTab === 'dashboard' && (
                  <Dashboard
                    sessions={sessions}
                    campaigns={campaigns}
                    onOpenSessionModal={() => {
                      setActiveUserTab('sessions');
                      setIsPairModalOpen(true);
                    }}
                    onOpenNewBroadcast={() => {
                      setActiveUserTab('campaigns');
                      setIsCreateCampaignModalOpen(true);
                    }}
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
                    onAssignAgent={handleAssignAgent}
                    onToggleResolve={handleToggleResolve}
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
                    onSelectChat={(contactId) => {
                      setActiveUserTab('inbox');
                    }}
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

            {/* VIEW 2: Super Admin Console */}
            {currentView === 'admin' && (
              <>
                {activeAdminTab === 'users' && (
                  <UserManagement
                    users={users}
                    onAddUser={handleAddUser}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateQuotas={handleUpdateQuotas}
                    onDeleteUser={handleDeleteUser}
                  />
                )}

                {activeAdminTab === 'cluster' && (
                  <ClusterHealth
                    metrics={metrics}
                    onRefreshMetrics={() => {
                      setMetrics(prev => ({
                        ...prev,
                        ramUsageGb: Math.max(4.2, +(prev.ramUsageGb + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                        cpuUsagePercent: Math.floor(Math.random() * 15) + 18,
                        avgResponseMs: Math.floor(Math.random() * 25) + 120
                      }));
                    }}
                  />
                )}

                {activeAdminTab === 'audit' && (
                  <AuditLogs />
                )}
              </>
            )}

            {/* VIEW 3: Developer Guide & API Playground */}
            {currentView === 'developer' && (
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

      {/* Auth Modal (for re-auth flows) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}
