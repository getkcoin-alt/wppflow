import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
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
import { initialUsers, initialSessions, initialContacts, initialChats, initialMessages, cannedReplies, initialCampaigns, initialAutomations, apiEndpoints, initialWebhookLogs, clusterMetrics as initialMetrics } from './data/mockData';
export function App() {
    // Navigation View State
    const [currentView, setCurrentView] = useState('user');
    const [activeUserTab, setActiveUserTab] = useState('dashboard');
    const [activeAdminTab, setActiveAdminTab] = useState('users');
    const [activeDevTab, setActiveDevTab] = useState('docs');
    // App Data State
    const [users, setUsers] = useState(initialUsers);
    const [sessions, setSessions] = useState(initialSessions);
    const [contacts, setContacts] = useState(initialContacts);
    const [chats, setChats] = useState(initialChats);
    const [messages, setMessages] = useState(initialMessages);
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [automations, setAutomations] = useState(initialAutomations);
    const [webhookLogs, setWebhookLogs] = useState(initialWebhookLogs);
    const [metrics, setMetrics] = useState(initialMetrics);
    // Global Modals State
    const [isPairModalOpen, setIsPairModalOpen] = useState(false);
    const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
    // Calculate global unread count
    const unreadChatCount = chats.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0);
    // Total Meta savings across all campaigns
    const totalSavedDollars = campaigns.reduce((acc, c) => acc + c.costSavedMeta, 0);
    // Message Sending Handler
    const handleSendMessage = (chatId, text, isNote = false) => {
        const newMsgId = `m_${Date.now()}`;
        const timestamp = 'Just now';
        const newMsg = {
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
    const handleAddSession = (name, phone, channel) => {
        const newSession = {
            id: `sess_${Date.now()}`,
            sessionKey: name.toLowerCase().replace(/\s+/g, '-'),
            displayName: name,
            phone,
            status: 'CONNECTED',
            battery: 92,
            isCharging: true,
            antiBanHealth: 99,
            warmupDay: 1,
            proxyIp: '198.51.100.88 (US Dedicated)',
            messagesSentToday: 0,
            messagesLimitToday: 500,
            lastActive: 'Just now',
            wppVersion: '2.3000.101',
            channel
        };
        setSessions(prev => [newSession, ...prev]);
    };
    const handleRestartSession = (sessionId) => {
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
    const handleDeleteSession = (sessionId) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    };
    // Admin User Handlers
    const handleAddUser = (newUserData) => {
        const newUser = {
            ...newUserData,
            id: `usr_${Date.now()}`,
            broadcastsUsed: 0,
            apiCallsThisMonth: 0,
            createdAt: '2026-09-06',
            lastLogin: 'Never'
        };
        setUsers(prev => [newUser, ...prev]);
    };
    const handleUpdateStatus = (userId, status) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    };
    const handleUpdateQuotas = (userId, sessionQuota, broadcastLimit) => {
        setUsers(prev => prev.map(u => u.id === userId ? {
            ...u,
            whatsappSessionsQuota: sessionQuota,
            monthlyBroadcastLimit: broadcastLimit
        } : u));
    };
    const handleDeleteUser = (userId) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    };
    // Campaign Creation Handler
    const handleAddCampaign = (campaignData) => {
        const newCamp = {
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
    const handleToggleRule = (ruleId) => {
        setAutomations(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r));
    };
    // Assign Agent in Chat
    const handleAssignAgent = (chatId, agentName) => {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, assignedTo: agentName } : c));
    };
    // Toggle Resolve
    const handleToggleResolve = (chatId) => {
        setChats(prev => prev.map(c => c.id === chatId ? {
            ...c,
            unreadCount: 0,
            isClosed: !c.isClosed
        } : c));
    };
    // Trigger Mock Webhook Dispatch
    const handleTriggerTestWebhook = () => {
        const newLog = {
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
    return (_jsxs("div", { className: "min-h-screen bg-[#0c1317] flex flex-col", children: [_jsx(Navbar, { currentView: currentView, onSelectView: setCurrentView, sessions: sessions, onOpenNewSession: () => {
                    setCurrentView('user');
                    setActiveUserTab('sessions');
                    setIsPairModalOpen(true);
                }, onOpenNewBroadcast: () => {
                    setCurrentView('user');
                    setActiveUserTab('campaigns');
                    setIsCreateCampaignModalOpen(true);
                } }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsx(Sidebar, { currentView: currentView, activeUserTab: activeUserTab, onSelectUserTab: setActiveUserTab, activeAdminTab: activeAdminTab, onSelectAdminTab: setActiveAdminTab, activeDevTab: activeDevTab, onSelectDevTab: setActiveDevTab, unreadChatCount: unreadChatCount, totalSavedDollars: totalSavedDollars }), _jsx("main", { className: "flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0c1317]", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [currentView === 'user' && (_jsxs(_Fragment, { children: [activeUserTab === 'dashboard' && (_jsx(Dashboard, { sessions: sessions, campaigns: campaigns, onOpenSessionModal: () => {
                                                setActiveUserTab('sessions');
                                                setIsPairModalOpen(true);
                                            }, onOpenNewBroadcast: () => {
                                                setActiveUserTab('campaigns');
                                                setIsCreateCampaignModalOpen(true);
                                            }, onNavigateToInbox: () => setActiveUserTab('inbox') })), activeUserTab === 'inbox' && (_jsx(Inbox, { chats: chats, messages: messages, contacts: contacts, cannedReplies: cannedReplies, onSendMessage: handleSendMessage, onAssignAgent: handleAssignAgent, onToggleResolve: handleToggleResolve })), activeUserTab === 'sessions' && (_jsx(SessionManager, { sessions: sessions, onAddSession: handleAddSession, onRestartSession: handleRestartSession, onDeleteSession: handleDeleteSession, isPairModalOpen: isPairModalOpen, setIsPairModalOpen: setIsPairModalOpen })), activeUserTab === 'campaigns' && (_jsx(Campaigns, { campaigns: campaigns, onAddCampaign: handleAddCampaign, isCreateModalOpen: isCreateCampaignModalOpen, setIsCreateModalOpen: setIsCreateCampaignModalOpen })), activeUserTab === 'contacts' && (_jsx(Contacts, { contacts: contacts, onSelectChat: (contactId) => {
                                                setActiveUserTab('inbox');
                                            } })), activeUserTab === 'automations' && (_jsx(Automations, { automations: automations, onToggleRule: handleToggleRule }))] })), currentView === 'admin' && (_jsxs(_Fragment, { children: [activeAdminTab === 'users' && (_jsx(UserManagement, { users: users, onAddUser: handleAddUser, onUpdateStatus: handleUpdateStatus, onUpdateQuotas: handleUpdateQuotas, onDeleteUser: handleDeleteUser })), activeAdminTab === 'cluster' && (_jsx(ClusterHealth, { metrics: metrics, onRefreshMetrics: () => {
                                                setMetrics(prev => ({
                                                    ...prev,
                                                    ramUsageGb: Math.max(4.2, +(prev.ramUsageGb + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                                                    cpuUsagePercent: Math.floor(Math.random() * 15) + 18,
                                                    avgResponseMs: Math.floor(Math.random() * 25) + 120
                                                }));
                                            } })), activeAdminTab === 'audit' && (_jsx(AuditLogs, {}))] })), currentView === 'developer' && (_jsx(DeveloperGuide, { endpoints: apiEndpoints, webhookLogs: webhookLogs, onTriggerTestWebhook: handleTriggerTestWebhook, activeDevTab: activeDevTab, onSelectDevTab: setActiveDevTab }))] }) })] })] }));
}
