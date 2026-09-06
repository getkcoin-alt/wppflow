import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Check, 
  CheckCheck, 
  Phone, 
  MoreVertical, 
  User, 
  Tag, 
  ShoppingBag, 
  Clock, 
  FileText, 
  Lock, 
  Sparkles, 
  Bot, 
  Users, 
  Play, 
  Pause, 
  Volume2, 
  ExternalLink,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ChatThread, ChatMessage, Contact, CustomerOrder } from '../../types';

interface InboxProps {
  chats: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  contacts: Record<string, Contact>;
  cannedReplies: { shortcut: string; title: string; text: string }[];
  onSendMessage: (chatId: string, text: string, isNote?: boolean) => void;
  onAssignAgent: (chatId: string, agentName: string) => void;
  onToggleResolve: (chatId: string) => void;
}

export const Inbox: React.FC<InboxProps> = ({
  chats,
  messages,
  contacts,
  cannedReplies,
  onSendMessage,
  onAssignAgent,
  onToggleResolve
}) => {
  const [activeChatId, setActiveChatId] = useState<string>(chats[0]?.id || 'chat_1');
  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Composer state
  const [inputText, setInputText] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [showCannedMenu, setShowCannedMenu] = useState(false);

  // Audio playback simulator
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeContact = activeChat ? contacts[activeChat.contactId] : null;
  const currentMessages = activeChat ? (messages[activeChat.id] || []) : [];

  const filteredChats = chats.filter(c => {
    const matchesSearch = c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTab === 'unread') return c.unreadCount > 0;
    if (filterTab === 'groups') return c.isGroup;
    if (filterTab === 'mine') return c.assignedTo.includes('Aarav');
    return true;
  });

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

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden shadow-2xl">
      
      {/* COLUMN 1: Conversation List (WhatsApp Web Style) */}
      <div className="w-80 sm:w-96 border-r border-[#2a3942] flex flex-col bg-[#111b21] shrink-0">
        
        {/* Search & Header */}
        <div className="p-3 border-b border-[#2a3942] space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Shared Team Inbox</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                10x Interakt
              </span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              {filteredChats.length} active
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats, contacts, numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#202c33] p-1 rounded-xl border border-[#2a3942] text-[11px]">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('mine')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'mine' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mine
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'unread' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterTab('groups')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'groups' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Chat Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2a3942]/40">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`p-3 cursor-pointer transition-all flex items-start gap-3 hover:bg-[#202c33]/60 ${
                chat.id === activeChatId ? 'bg-[#202c33] border-l-4 border-emerald-500' : ''
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={chat.avatar}
                  alt={chat.contactName}
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-700"
                />
                {chat.isGroup && (
                  <span className="absolute -bottom-1 -right-1 bg-indigo-600 p-0.5 rounded-full text-white">
                    <Users className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white truncate max-w-[140px]">
                    {chat.contactName}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {chat.lastMessage.timestamp}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  {chat.lastMessage.fromMe && (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">{chat.lastMessage.text}</span>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#111b21] text-slate-400 border border-[#2a3942]">
                      {chat.channel}
                    </span>
                    {chat.assignedTo && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                        • {chat.assignedTo}
                      </span>
                    )}
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="bg-emerald-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* COLUMN 2: Active Conversation Feed */}
      <div className="flex-1 flex flex-col bg-[#0b141a] min-w-0">
        
        {/* Chat Header */}
        {activeChat && (
          <div className="p-3 px-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={activeChat.avatar}
                alt={activeChat.contactName}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-emerald-500/40"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white truncate">
                    {activeChat.contactName}
                  </span>
                  {activeChat.isGroup ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {activeChat.groupMembersCount} Members
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      WhatsApp Connected
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {activeChat.phone}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              
              {/* Assign Agent Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#111b21] border border-[#2a3942] rounded-xl px-2.5 py-1 text-xs text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={activeChat.assignedTo}
                  onChange={(e) => onAssignAgent(activeChat.id, e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Aarav Mehta" className="bg-[#111b21]">Aarav Mehta</option>
                  <option value="Priya Sharma" className="bg-[#111b21]">Priya Sharma</option>
                  <option value="Auto Bot (Nudge)" className="bg-[#111b21]">Auto Bot</option>
                </select>
              </div>

              {/* Resolve Conversation */}
              <button
                onClick={() => onToggleResolve(activeChat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111b21] hover:bg-emerald-950 border border-[#2a3942] text-xs font-medium text-slate-300 hover:text-emerald-400 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resolve</span>
              </button>

            </div>
          </div>
        )}

        {/* Message Feed Area (WhatsApp Web Wallpaper look) */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        >
          {currentMessages.map((msg) => {
            const isOut = msg.sender === 'agent' || msg.sender === 'bot';

            if (msg.isNote) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="note-bubble max-w-lg p-3 rounded-xl text-amber-200 text-xs shadow-md space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Lock className="w-3 h-3" />
                      <span>Internal Team Note (Hidden from Customer)</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className="text-[10px] text-amber-400/70 text-right font-mono">
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
                  className={`max-w-[78%] sm:max-w-[65%] rounded-2xl p-3 shadow-md space-y-2 text-xs text-white ${
                    isOut
                      ? 'bg-[#005c4b] rounded-tr-xs'
                      : 'bg-[#202c33] rounded-tl-xs'
                  }`}
                >
                  {/* Sender label for group or agents */}
                  {msg.agentName && (
                    <div className="text-[10px] font-bold text-emerald-300">
                      {msg.agentName} (Agent)
                    </div>
                  )}

                  {/* Standard Text */}
                  {msg.type === 'text' && (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Voice Note Simulation */}
                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl">
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="p-2 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-all shrink-0"
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-0.5 h-6">
                          {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70, 85, 40].map((h, i) => (
                            <span
                              key={i}
                              className={`flex-1 rounded-full transition-all ${
                                isPlayingAudio && i % 2 === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                          <span>{isPlayingAudio ? '0:07' : '0:00'}</span>
                          <span>{msg.audioDuration}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PDF Document Preview */}
                  {msg.type === 'document' && (
                    <div className="flex items-center gap-3 p-2.5 bg-black/20 rounded-xl border border-white/10">
                      <FileText className="w-8 h-8 text-rose-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white text-xs truncate">{msg.fileName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{msg.fileSize} • PDF</div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Button Messages (WPPConnect Advantage!) */}
                  {msg.type === 'buttons' && (
                    <div className="space-y-2">
                      <p className="leading-relaxed">{msg.text}</p>
                      <div className="space-y-1.5 pt-1">
                        {msg.buttons?.map(btn => (
                          <button
                            key={btn.id}
                            className="w-full py-2 px-3 bg-[#111b21]/80 hover:bg-[#111b21] border border-white/15 rounded-xl text-center text-xs font-semibold text-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <span>{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Status Ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-300/80 font-mono pt-0.5">
                    <span>{msg.timestamp}</span>
                    {isOut && (
                      <span>
                        {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-slate-400" />}
                        {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-slate-400" />}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Canned Quick Replies Menu */}
        {showCannedMenu && (
          <div className="p-3 bg-[#202c33] border-t border-[#2a3942] animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
              <span>Quick Canned Responses (type / to trigger)</span>
              <button onClick={() => setShowCannedMenu(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cannedReplies.map(cr => (
                <button
                  key={cr.shortcut}
                  onClick={() => handleInsertCanned(cr.text)}
                  className="text-left p-2 rounded-xl bg-[#111b21] hover:bg-[#111b21]/80 border border-[#2a3942] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold text-xs">{cr.shortcut}</span>
                    <span className="font-semibold text-white text-xs">{cr.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{cr.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Composer */}
        <div className="p-3 bg-[#202c33] border-t border-[#2a3942] space-y-2 shrink-0">
          
          {/* Mode Switcher: Customer WhatsApp vs Internal Note */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNoteMode(false)}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                  !isNoteMode ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                WhatsApp Message
              </button>
              <button
                onClick={() => setIsNoteMode(true)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                  isNoteMode ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Internal Team Note</span>
              </button>
            </div>

            <button
              onClick={() => setShowCannedMenu(!showCannedMenu)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Canned Replies (/)</span>
            </button>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value === '/') setShowCannedMenu(true);
                }}
                placeholder={
                  isNoteMode
                    ? 'Write an internal note for teammates (@mention)...'
                    : 'Type a WhatsApp message or type / for quick replies...'
                }
                className={`w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none border transition-all ${
                  isNoteMode
                    ? 'bg-amber-950/20 border-amber-500/40 focus:border-amber-400'
                    : 'bg-[#111b21] border-[#2a3942] focus:border-emerald-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl transition-all shadow-md shrink-0 ${
                isNoteMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

      {/* COLUMN 3: Customer 360° CRM Drawer (Interakt Superiority) */}
      {activeContact && (
        <div className="hidden lg:flex w-80 border-l border-[#2a3942] bg-[#111b21] flex-col p-4 overflow-y-auto space-y-4 shrink-0">
          
          {/* Profile Header */}
          <div className="text-center pb-3 border-b border-[#2a3942]">
            <img
              src={activeContact.avatar}
              alt={activeContact.name}
              className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-emerald-500/30"
            />
            <h3 className="font-bold text-sm text-white mt-2">{activeContact.name}</h3>
            <div className="text-xs text-slate-400 font-mono">{activeContact.phone}</div>
            <div className="text-[11px] text-slate-400">{activeContact.email}</div>

            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-bold">
              <span>LTV: ${activeContact.lifetimeValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeContact.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-[#202c33] text-slate-300 border border-[#2a3942] text-[10px] font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Shopify Orders History */}
          <div className="space-y-2 pt-2 border-t border-[#2a3942]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-emerald-400" />
                <span>Shopify Purchase History</span>
              </span>
              <span>{activeContact.orders.length} Orders</span>
            </div>

            {activeContact.orders.length > 0 ? (
              <div className="space-y-2">
                {activeContact.orders.map(ord => (
                  <div key={ord.id} className="p-2.5 bg-[#202c33] rounded-xl border border-[#2a3942] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">{ord.orderNumber}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        ${ord.total} {ord.currency}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-1">{ord.itemsSummary}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{ord.date}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#111b21] text-emerald-300 font-medium">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic">No orders recorded yet.</div>
            )}
          </div>

          {/* Custom CRM Attributes */}
          <div className="space-y-2 pt-2 border-t border-[#2a3942]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Custom Attributes
            </span>
            <div className="space-y-1 text-xs">
              {Object.entries(activeContact.customTraits).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 border-b border-[#2a3942]/40 text-[11px]">
                  <span className="text-slate-400">{key}:</span>
                  <span className="text-white font-medium text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Past Internal Notes */}
          <div className="space-y-2 pt-2 border-t border-[#2a3942]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Teammate Notes
            </span>
            <div className="space-y-2">
              {activeContact.notes.map(n => (
                <div key={n.id} className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-medium">
                    <span>{n.author}</span>
                    <span>{n.createdAt}</span>
                  </div>
                  <p className="text-amber-100 text-[11px] leading-snug">{n.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
