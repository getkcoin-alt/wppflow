import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  Play, 
  Pause, 
  UserCheck, 
  CheckCircle2, 
  RefreshCw, 
  MessageSquare, 
  Loader2, 
  Video, 
  Image as ImageIcon, 
  Maximize2, 
  X, 
  PanelRightClose, 
  PanelRightOpen, 
  Clock, 
  FileText, 
  ShoppingBag 
} from 'lucide-react';
import { ChatThread, ChatMessage, WhatsAppSession } from '../../types';
import { safeAvatarFallback } from '../../utils/avatar';

interface InboxProps {
  chats: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  contacts: Record<string, any>;
  cannedReplies: { shortcut: string; title: string; text: string }[];
  sessions: WhatsAppSession[];
  selectedChatId?: string | null;
  onSendMessage: (chatId: string, text: string, isNote?: boolean) => void;
  onSendAttachment: (chatId: string, attachment: { data: string; filename: string; kind: string; mimeType: string }) => void;
  onAssignAgent: (chatId: string, agentName: string) => void;
  onToggleResolve: (chatId: string) => void;
  onOpenChat: (chatId: string, sync?: boolean) => void;
  onSyncInbox: (sessionKey: string) => Promise<void>;
}

const avatarFallback = safeAvatarFallback;

function formatChatTimestamp(timestampStr?: string): string {
  if (!timestampStr) return '';
  // Check if it's already formatted like "10:45 AM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(timestampStr)) {
    return timestampStr;
  }
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return timestampStr;

  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return 'Yesterday';
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getMessageDateGroup(timestampStr?: string): string {
  if (!timestampStr) return 'TODAY';
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return 'TODAY';

  const now = new Date();
  if (now.toDateString() === date.toDateString()) return 'TODAY';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return 'YESTERDAY';

  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
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
  onSyncInbox,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(selectedChatId || null);
  const [showCrmPanel, setShowCrmPanel] = useState(true);

  // Automatically select and load messages for the active or first chat
  useEffect(() => {
    if (selectedChatId && chats.some(c => c.id === selectedChatId)) {
      setActiveChatId(selectedChatId);
      onOpenChat(selectedChatId);
      return;
    }
    if ((!activeChatId || !chats.some(c => c.id === activeChatId)) && chats.length > 0) {
      const firstId = chats[0].id;
      setActiveChatId(firstId);
      onOpenChat(firstId);
    }
  }, [chats, selectedChatId]);

  // Composer state
  const [inputText, setInputText] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [showCannedMenu, setShowCannedMenu] = useState(false);

  // Sync & Media state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isSyncingChat, setIsSyncingChat] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Audio playback simulator
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0] || null;
  const activeContact = activeChat ? contacts[activeChat.contactId] : null;
  const currentMessages = useMemo(() => {
    return activeChat ? (messages[activeChat.id] || []) : [];
  }, [messages, activeChat]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, activeChatId]);

  const filteredChats = useMemo(() => {
    return chats.filter(c => {
      const matchesSearch = (c.contactName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filterTab === 'unread') return c.unreadCount > 0;
      if (filterTab === 'groups') return Boolean(c.isGroup);
      return true;
    });
  }, [chats, searchQuery, filterTab]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    onSendMessage(activeChat.id, inputText, isNoteMode);
    setInputText('');
    setShowCannedMenu(false);
  };

  const handleInsertCanned = (text: string) => {
    setInputText(text);
    setShowCannedMenu(false);
  };

  const connectedSessions = sessions.filter(s => s.status === 'CONNECTED');

  const handleSync = async () => {
    if (isSyncing || connectedSessions.length === 0) return;
    setIsSyncing(true);
    setSyncStatus('Syncing WhatsApp chats…');
    try {
      for (const s of connectedSessions) {
        await onSyncInbox(s.sessionKey);
      }
      setSyncStatus('Synced! Refreshing…');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch {
      setSyncStatus('Sync failed');
      setTimeout(() => setSyncStatus(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const renderStatusTick = (msg: ChatMessage) => {
    if (msg.status === 'failed') {
      return <span className="text-rose-400 font-bold text-[10px]" title="Failed to deliver">!</span>;
    }
    if (msg.status === 'sending') {
      return <span title="Sending..."><Clock className="w-3 h-3 text-[#8696a0]" /></span>;
    }
    if (msg.status === 'read' || msg.ack === 3 || msg.ack === 4) {
      return <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" /></span>;
    }
    if (msg.status === 'delivered' || msg.ack === 2) {
      return <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" /></span>;
    }
    return <span title="Sent"><Check className="w-3.5 h-3.5 text-[#8696a0]" /></span>;
  };

  // Empty state: no connected sessions
  if (connectedSessions.length === 0) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-[#111b21] rounded-2xl border border-[#222e35] overflow-hidden shadow-2xl items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 bg-[#202c33] rounded-2xl flex items-center justify-center mx-auto border border-[#2a3942]">
            <MessageSquare className="w-8 h-8 text-[#00a884]" />
          </div>
          <h3 className="text-[#e9edef] font-bold text-lg">No WhatsApp Session Connected</h3>
          <p className="text-[#8696a0] text-sm leading-relaxed">
            Pair a WhatsApp account from the <strong className="text-[#e9edef]">Sessions</strong> tab to start receiving and sending messages in the Shared Team Inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#111b21] rounded-2xl border border-[#222e35] overflow-hidden shadow-2xl">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 1: WhatsApp Web Left Pane (Chat List & Filter Tabs)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="w-80 sm:w-96 border-r border-[#222e35] flex flex-col bg-[#111b21] shrink-0">
        
        {/* Top Header Bar */}
        <div className="h-15 px-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#111b21] flex items-center justify-center text-[#00a884] font-bold text-sm ring-1 ring-[#00a884]/40">
                W
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full ring-2 ring-[#202c33]" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#e9edef] leading-tight">
                WhatsApp Inbox
              </h2>
              <div className="text-[11px] text-[#00a884] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                <span>Connected ({connectedSessions.length})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync WhatsApp chats & contacts"
              className="p-2 rounded-full text-[#aebac1] hover:text-[#00a884] hover:bg-[#111b21] transition-all disabled:opacity-40"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-[#00a884]" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="px-3 py-1 bg-[#182229] border-b border-[#222e35] text-[11px] text-[#00a884] text-center font-medium animate-fade-in">
            {syncStatus}
          </div>
        )}

        {/* Search Bar & WhatsApp Web Style Filter Pills */}
        <div className="p-2.5 border-b border-[#222e35] space-y-2">
          <div className="relative flex items-center bg-[#202c33] rounded-lg border border-transparent focus-within:border-[#00a884]">
            <Search className="w-4 h-4 text-[#8696a0] ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-2.5 pr-8 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[#8696a0] hover:text-[#e9edef]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterTab === 'all'
                  ? 'bg-[#00a884] text-[#111b21] font-semibold shadow-sm'
                  : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                filterTab === 'unread'
                  ? 'bg-[#00a884] text-[#111b21] font-semibold shadow-sm'
                  : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]'
              }`}
            >
              <span>Unread</span>
              {chats.some(c => c.unreadCount > 0) && (
                <span className={`w-2 h-2 rounded-full ${filterTab === 'unread' ? 'bg-[#111b21]' : 'bg-[#00a884]'}`} />
              )}
            </button>
            <button
              onClick={() => setFilterTab('groups')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterTab === 'groups'
                  ? 'bg-[#00a884] text-[#111b21] font-semibold shadow-sm'
                  : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]'
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* WhatsApp Web Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/70">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0] text-xs space-y-2">
              <MessageSquare className="w-8 h-8 text-[#8696a0]/40 mx-auto" />
              <p>{searchQuery ? `No chats match "${searchQuery}"` : 'No conversations found'}</p>
              {!searchQuery && (
                <button
                  onClick={handleSync}
                  className="mt-2 px-3 py-1.5 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] text-xs font-bold rounded-lg transition-all"
                >
                  Import WhatsApp Chats
                </button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const formattedTime = formatChatTimestamp(chat.lastMessage?.timestamp);
              const isOut = Boolean(chat.lastMessage?.fromMe);

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    onOpenChat(chat.id);
                  }}
                  className={`px-3 py-3 cursor-pointer transition-all flex items-center gap-3 hover:bg-[#202c33]/70 ${
                    isActive ? 'bg-[#2a3942]' : 'bg-[#111b21]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={chat.avatar || avatarFallback(chat.contactName, chat.isGroup)}
                      alt={chat.contactName}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-[#2a3942]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = avatarFallback(chat.contactName, chat.isGroup);
                      }}
                    />
                    {chat.isGroup && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-[#202c33] p-1 rounded-full text-[#aebac1] ring-1 ring-[#111b21]">
                        <Users className="w-3 h-3 text-[#00a884]" />
                      </span>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0 border-b border-[#202c33]/30 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-[#e9edef] truncate max-w-[150px]">
                        {chat.contactName}
                      </span>
                      <span className={`text-[11px] shrink-0 ${chat.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-[#8696a0] truncate flex items-center gap-1 max-w-[180px]">
                        {isOut && (
                          <span className="shrink-0">
                            {chat.lastMessage?.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : chat.lastMessage?.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                            ) : chat.lastMessage?.status === 'sending' ? (
                              <Clock className="w-3 h-3 text-[#8696a0]" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                            )}
                          </span>
                        )}
                        <span className="truncate">{chat.lastMessage?.text || '—'}</span>
                      </div>

                      {chat.unreadCount > 0 && (
                        <span className="bg-[#00a884] text-[#111b21] text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center leading-tight">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 2: Active Chat Area (WhatsApp Web Viewport & Messages)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#0b141a] min-w-0 relative">
        
        {/* WhatsApp Web Chat Header */}
        {activeChat ? (
          <div className="h-15 px-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between gap-3 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={activeChat.avatar || avatarFallback(activeChat.contactName, activeChat.isGroup)}
                alt={activeChat.contactName}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-[#00a884]/40 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = avatarFallback(activeChat.contactName, activeChat.isGroup);
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#e9edef] truncate">
                    {activeChat.contactName}
                  </span>
                  {activeChat.isGroup ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#182229] text-[#aebac1] border border-[#2a3942]">
                      {activeChat.groupMembersCount || 'Group'} Members
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#00a884]/15 text-[#00a884] font-medium border border-[#00a884]/30">
                      WhatsApp Verified
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#8696a0] font-mono truncate">
                  {activeChat.phone}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-1.5">
              
              {/* Agent Assignment */}
              <div className="hidden sm:flex items-center gap-1.5 bg-[#111b21] border border-[#2a3942] rounded-lg px-2.5 py-1 text-xs text-[#aebac1]">
                <UserCheck className="w-3.5 h-3.5 text-[#00a884]" />
                <select
                  value={activeChat.assignedTo || 'Unassigned'}
                  onChange={(e) => onAssignAgent(activeChat.id, e.target.value)}
                  className="bg-transparent text-xs text-[#e9edef] focus:outline-none cursor-pointer"
                >
                  <option value="Unassigned" className="bg-[#111b21]">Unassigned</option>
                  <option value="Aarav Mehta" className="bg-[#111b21]">Aarav Mehta</option>
                  <option value="Priya Sharma" className="bg-[#111b21]">Priya Sharma</option>
                  <option value="Support Agent" className="bg-[#111b21]">Support Agent</option>
                </select>
              </div>

              {/* Sync Chat */}
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
                title="Sync recent messages from WhatsApp engine"
                className="p-2 rounded-lg text-[#aebac1] hover:text-[#00a884] hover:bg-[#111b21] transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingChat ? 'animate-spin text-[#00a884]' : ''}`} />
              </button>

              {/* Resolve / Close Conversation */}
              <button
                onClick={() => onToggleResolve(activeChat.id)}
                title="Resolve Conversation"
                className="p-2 rounded-lg text-[#aebac1] hover:text-[#00a884] hover:bg-[#111b21] transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>

              {/* Toggle CRM Drawer */}
              <button
                onClick={() => setShowCrmPanel(!showCrmPanel)}
                title={showCrmPanel ? "Collapse CRM Panel" : "Expand CRM Panel"}
                className={`p-2 rounded-lg transition-all ${
                  showCrmPanel 
                    ? 'text-[#00a884] bg-[#111b21]' 
                    : 'text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21]'
                }`}
              >
                {showCrmPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>

            </div>
          </div>
        ) : (
          <div className="h-15 px-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between shrink-0" />
        )}

        {/* ── Message Feed with WhatsApp Web Pattern Background ── */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3"
          style={{
            backgroundColor: '#0b141a',
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(17, 27, 33, 0.6) 0%, rgba(11, 20, 26, 0.95) 100%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          {!activeChat && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-[#8696a0]">
              <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center text-[#00a884] ring-1 ring-[#2a3942]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-[#e9edef]">WhatsApp Web for Teams</h3>
              <p className="max-w-sm text-xs leading-relaxed">
                Select a conversation on the left to start messaging, manage customer relationships, and respond with WhatsApp Web speed.
              </p>
            </div>
          )}

          {activeChat && (
            <>
              {/* WhatsApp Web End-to-End Encryption Notice Pill */}
              <div className="flex justify-center my-3">
                <div className="bg-[#182229] border border-[#2a3942]/60 text-[#ffeecd]/80 text-[11px] px-3.5 py-1.5 rounded-lg max-w-md text-center shadow-sm flex items-center gap-2 font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#ffd279] shrink-0" />
                  <span>Messages are end-to-end encrypted via WPPConnect engine.</span>
                </div>
              </div>

              {/* Date Separator */}
              <div className="flex justify-center my-2">
                <div className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-md shadow-sm font-medium tracking-wide">
                  {getMessageDateGroup(activeChat.lastMessage?.timestamp)}
                </div>
              </div>

              {currentMessages.length === 0 && (
                <div className="h-48 flex items-center justify-center text-[#8696a0] text-xs">
                  No messages yet. Send a message to start the conversation!
                </div>
              )}

              {/* Render Message Bubbles */}
              {currentMessages.map((msg) => {
                const isOut = msg.sender === 'agent' || msg.sender === 'bot';

                // Internal Team Note Bubble
                if (msg.isNote || msg.type === 'internal_note') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="max-w-lg p-3 rounded-xl bg-[#2e1a06] border border-[#b45309]/50 text-[#fef3c7] text-xs shadow-md space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">
                          <Lock className="w-3 h-3" />
                          <span>Internal Team Note (Hidden from Customer)</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className="text-[10px] text-[#f59e0b]/80 text-right font-mono">
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative max-w-[80%] sm:max-w-[65%] rounded-lg p-2.5 px-3 text-xs text-[#e9edef] shadow-sm space-y-1.5 ${
                        isOut
                          ? 'bg-[#005c4b] rounded-tr-none'
                          : 'bg-[#202c33] rounded-tl-none'
                      }`}
                    >
                      {/* Sender label for group participants or outgoing agents */}
                      {isOut ? (
                        msg.agentName && (
                          <div className="text-[10px] font-bold text-[#25d366] leading-tight">
                            {msg.agentName}
                          </div>
                        )
                      ) : (
                        activeChat.isGroup && msg.agentName && (
                          <div className="text-[10px] font-bold text-[#e5a00d] leading-tight">
                            {msg.agentName}
                          </div>
                        )
                      )}

                      {/* Text Message */}
                      {(!msg.type || msg.type === 'text') && (
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      )}

                      {/* Call Log */}
                      {msg.type === 'call_log' && (
                        <div className="flex items-center gap-2.5 py-1">
                          <div className={`p-2 rounded-full ${
                            msg.text.includes('Missed')
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-[#00a884]/20 text-[#00a884]'
                          }`}>
                            {msg.text.includes('Video') ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                          </div>
                          <div className="text-xs">
                            <div className="font-semibold text-[#e9edef]">{msg.text.includes('Video') ? 'Video call' : 'Voice call'}</div>
                            <div className="text-[11px] text-[#8696a0]">{msg.text}</div>
                          </div>
                        </div>
                      )}

                      {/* Image Message */}
                      {msg.type === 'image' && (
                        <div className="space-y-1">
                          {msg.mediaUrl ? (
                            <div
                              className="relative group cursor-pointer overflow-hidden rounded-lg max-w-sm"
                              onClick={() => setSelectedImageModal(msg.mediaUrl!)}
                            >
                              <img
                                src={msg.mediaUrl}
                                alt={msg.fileName || 'Photo'}
                                className="w-full max-h-72 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-black/20 rounded-lg">
                              <ImageIcon className="w-5 h-5 text-[#00a884]" />
                              <span className="text-xs text-[#aebac1]">{msg.text || 'Photo'}</span>
                            </div>
                          )}
                          {msg.text && msg.text !== '📷 Photo' && (
                            <p className="leading-relaxed whitespace-pre-wrap pt-0.5">{msg.text}</p>
                          )}
                        </div>
                      )}

                      {/* Video Message */}
                      {msg.type === 'video' && (
                        <div className="space-y-1">
                          {msg.mediaUrl && <video src={msg.mediaUrl} controls className="max-w-full rounded-lg" />}
                          {msg.text && msg.text !== '🎥 Video' && (
                            <p className="leading-relaxed whitespace-pre-wrap pt-0.5">{msg.text}</p>
                          )}
                        </div>
                      )}

                      {/* Audio / Voice Note */}
                      {msg.type === 'audio' && (
                        <div className="flex items-center gap-2.5 p-2 bg-black/20 rounded-lg min-w-[200px]">
                          <button
                            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                            className="p-2 rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#00a884]/90 transition-all shrink-0"
                          >
                            {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-0.5 h-4">
                              {[35, 70, 30, 90, 55, 100, 45, 80, 50, 90, 35, 75, 85, 40].map((h, i) => (
                                <span
                                  key={i}
                                  className={`flex-1 rounded-full transition-all ${
                                    isPlayingAudio && i % 2 === 0 ? 'bg-[#00a884]' : 'bg-[#8696a0]'
                                  }`}
                                  style={{ height: `${h}%` }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-[#8696a0] font-mono">
                              <span>{isPlayingAudio ? '0:05' : '0:00'}</span>
                              <span>{msg.audioDuration || '0:18'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document Message */}
                      {msg.type === 'document' && (
                        <div className="flex items-center gap-2.5 p-2 bg-black/20 rounded-lg border border-white/5">
                          <FileText className="w-6 h-6 text-rose-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-[#e9edef] text-xs truncate">{msg.fileName || 'Document'}</div>
                            <div className="text-[10px] text-[#8696a0] font-mono">{msg.fileSize || 'PDF'}</div>
                          </div>
                        </div>
                      )}

                      {/* Timestamp & Status Tick (Bottom Right aligned) */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] font-mono pt-0.5 select-none">
                        <span>{msg.timestamp}</span>
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
          <div className="p-3 bg-[#202c33] border-t border-[#222e35] animate-fade-in z-20">
            <div className="flex items-center justify-between text-xs text-[#8696a0] font-medium mb-2">
              <span>Quick Canned Responses (select or type shortcut)</span>
              <button onClick={() => setShowCannedMenu(false)} className="text-[#8696a0] hover:text-[#e9edef]">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {cannedReplies.map(cr => (
                <button
                  key={cr.shortcut}
                  onClick={() => handleInsertCanned(cr.text)}
                  className="text-left p-2 rounded-lg bg-[#111b21] hover:bg-[#2a3942] border border-[#222e35] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#00a884] font-bold text-xs">{cr.shortcut}</span>
                    <span className="font-semibold text-[#e9edef] text-xs">{cr.title}</span>
                  </div>
                  <div className="text-[11px] text-[#8696a0] truncate mt-0.5">{cr.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── WhatsApp Web Message Composer ── */}
        {activeChat && (
          <div className="p-2.5 px-4 bg-[#202c33] border-t border-[#222e35] space-y-1.5 shrink-0 z-10">
            
            {/* Mode Switcher: WhatsApp Message vs Team Internal Note */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 bg-[#111b21] p-0.5 rounded-lg border border-[#222e35]">
                <button
                  onClick={() => setIsNoteMode(false)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    !isNoteMode ? 'bg-[#00a884] text-[#111b21] font-semibold' : 'text-[#8696a0] hover:text-[#e9edef]'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setIsNoteMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    isNoteMode ? 'bg-[#d97706] text-white font-semibold' : 'text-[#8696a0] hover:text-[#e9edef]'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Team Note</span>
                </button>
              </div>

              <button
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                className="text-xs font-medium text-[#00a884] hover:text-[#00a884]/80 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Templates (/)</span>
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file || !activeChat) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document';
                    onSendAttachment(activeChat.id, { data: String(reader.result), filename: file.name, kind, mimeType: file.type });
                    event.target.value = '';
                  };
                  reader.readAsDataURL(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach document or media"
                className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (e.target.value === '/') setShowCannedMenu(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isNoteMode
                      ? 'Write an internal team note (hidden from customer)...'
                      : 'Type a message'
                  }
                  className={`w-full rounded-lg px-4 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none transition-all ${
                    isNoteMode
                      ? 'bg-[#2a1b0c] border border-[#d97706]/40 focus:border-[#d97706]'
                      : 'bg-[#2a3942] border border-transparent focus:border-[#00a884]/40'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-full transition-all shrink-0 ${
                  isNoteMode
                    ? 'bg-[#d97706] hover:bg-[#b45309] text-white'
                    : 'bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21]'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 3: Collapsible Customer 360° CRM Drawer                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showCrmPanel && activeContact && (
        <div className="hidden lg:flex w-80 border-l border-[#222e35] bg-[#111b21] flex-col overflow-y-auto shrink-0 animate-fade-in">
          
          {/* Header */}
          <div className="h-15 px-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-sm text-[#e9edef]">Contact Info</h3>
            <button
              onClick={() => setShowCrmPanel(false)}
              className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Profile Overview */}
            <div className="text-center pb-3 border-b border-[#222e35]">
              <img
                src={activeContact.avatar || avatarFallback(activeContact.name)}
                alt={activeContact.name}
                className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-[#00a884]/40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = avatarFallback(activeContact.name);
                }}
              />
              <h4 className="font-semibold text-base text-[#e9edef] mt-2.5">{activeContact.name}</h4>
              <div className="text-xs text-[#8696a0] font-mono mt-0.5">{activeContact.phone}</div>
              {activeContact.email && (
                <div className="text-[11px] text-[#8696a0] mt-0.5">{activeContact.email}</div>
              )}

              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] text-xs font-semibold">
                <span>LTV: \${(activeContact.lifetimeValue || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8696a0]">
                Customer Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeContact.tags || ['Customer', 'VIP']).map((t: string) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-md bg-[#202c33] text-[#e9edef] border border-[#2a3942] text-[11px] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Purchase History */}
            <div className="space-y-2 pt-2 border-t border-[#222e35]">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#8696a0]">
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-[#00a884]" />
                  <span>Orders</span>
                </span>
                <span>{(activeContact.orders || []).length} Recorded</span>
              </div>

              {(activeContact.orders || []).length > 0 ? (
                <div className="space-y-2">
                  {(activeContact.orders || []).map((ord: any) => (
                    <div key={ord.id} className="p-2.5 bg-[#202c33] rounded-xl border border-[#2a3942] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#e9edef] font-mono">{ord.orderNumber}</span>
                        <span className="text-[10px] text-[#00a884] font-bold">
                          \${ord.total} {ord.currency}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#aebac1] line-clamp-1">{ord.itemsSummary}</div>
                      <div className="flex items-center justify-between text-[10px] text-[#8696a0] pt-1">
                        <span>{ord.date}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#111b21] text-[#00a884] font-medium">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#8696a0] text-xs italic">No orders recorded yet.</div>
              )}
            </div>

            {/* Custom Attributes */}
            <div className="space-y-2 pt-2 border-t border-[#222e35]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8696a0]">
                Custom Traits
              </span>
              <div className="space-y-1 text-xs">
                {Object.entries(activeContact.customTraits || { Channel: 'WhatsApp Direct', Source: 'Organic' }).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-[#222e35]/60 text-[11px]">
                    <span className="text-[#8696a0]">{key}:</span>
                    <span className="text-[#e9edef] font-medium text-right">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teammate Internal Notes */}
            <div className="space-y-2 pt-2 border-t border-[#222e35]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8696a0]">
                Internal Notes
              </span>
              <div className="space-y-2">
                {(activeContact.notes || []).length > 0 ? (
                  activeContact.notes.map((n: any) => (
                    <div key={n.id} className="p-2.5 bg-[#2e1a06]/60 border border-[#b45309]/30 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#f59e0b] font-medium">
                        <span>{n.author}</span>
                        <span>{n.createdAt}</span>
                      </div>
                      <p className="text-[#fef3c7] text-[11px] leading-snug">{n.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-[#8696a0] text-xs italic">No internal notes yet. Use the Team Note mode in the composer to log one.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImageModal}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

    </div>
  );
};
