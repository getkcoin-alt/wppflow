import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Megaphone,
  Users2,
  Bot,
  ShieldCheck,
  Server,
  Activity,
  Code2,
  Webhook,
  Key,
  Layers,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

export type UserSubTab = 'dashboard' | 'inbox' | 'sessions' | 'campaigns' | 'contacts' | 'automations';
export type AdminSubTab = 'users' | 'cluster' | 'audit';
export type DevSubTab = 'docs' | 'webhooks' | 'sdks' | 'keys';

interface SidebarProps {
  currentView: 'user' | 'admin' | 'developer';
  activeUserTab: UserSubTab;
  onSelectUserTab: (tab: UserSubTab) => void;
  activeAdminTab: AdminSubTab;
  onSelectAdminTab: (tab: AdminSubTab) => void;
  activeDevTab: DevSubTab;
  onSelectDevTab: (tab: DevSubTab) => void;
  unreadChatCount: number;
  totalSavedDollars: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeUserTab,
  onSelectUserTab,
  activeAdminTab,
  onSelectAdminTab,
  activeDevTab,
  onSelectDevTab,
  unreadChatCount,
  totalSavedDollars
}) => {
  return (
    <aside className="w-64 bg-[#111b21] border-r border-[#2a3942] flex flex-col justify-between shrink-0 h-[calc(100vh-57px)]">
      <div className="p-3 space-y-4 overflow-y-auto">
        
        {/* Context Header */}
        <div className="px-3 pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {currentView === 'user' && 'Workspace Suite'}
            {currentView === 'admin' && 'Platform Control'}
            {currentView === 'developer' && 'Developer Platform'}
          </div>
        </div>

        {/* User Workspace Navigation */}
        {currentView === 'user' && (
          <nav className="space-y-1">
            <button
              onClick={() => onSelectUserTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeUserTab === 'dashboard'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & KPIs</span>
            </button>

            <button
              onClick={() => onSelectUserTab('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeUserTab === 'inbox'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>Shared Team Inbox</span>
              </div>
              {unreadChatCount > 0 && (
                <span className="bg-emerald-500 text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {unreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectUserTab('sessions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeUserTab === 'sessions'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>WhatsApp Sessions</span>
            </button>

            <button
              onClick={() => onSelectUserTab('campaigns')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeUserTab === 'campaigns'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcasts & Campaigns</span>
            </button>

            <button
              onClick={() => onSelectUserTab('contacts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeUserTab === 'contacts'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Contacts & Segments</span>
            </button>

            <button
              onClick={() => onSelectUserTab('automations')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeUserTab === 'automations'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Bot Flows & Triggers</span>
            </button>
          </nav>
        )}

        {/* Super Admin Navigation */}
        {currentView === 'admin' && (
          <nav className="space-y-1">
            <button
              onClick={() => onSelectAdminTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeAdminTab === 'users'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>User & Tenant Control</span>
            </button>

            <button
              onClick={() => onSelectAdminTab('cluster')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeAdminTab === 'cluster'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Cluster & Chromium Health</span>
            </button>

            <button
              onClick={() => onSelectAdminTab('audit')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeAdminTab === 'audit'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Audit Logs & Security</span>
            </button>
          </nav>
        )}

        {/* Developer Hub Navigation */}
        {currentView === 'developer' && (
          <nav className="space-y-1">
            <button
              onClick={() => onSelectDevTab('docs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeDevTab === 'docs'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Interactive REST Tester</span>
            </button>

            <button
              onClick={() => onSelectDevTab('webhooks')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeDevTab === 'webhooks'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Webhook className="w-4 h-4 text-amber-400" />
              <span>Webhook Live Stream</span>
            </button>

            <button
              onClick={() => onSelectDevTab('sdks')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeDevTab === 'sdks'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Multi-Language SDKs</span>
            </button>

            <button
              onClick={() => onSelectDevTab('keys')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeDevTab === 'keys'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>API Credentials</span>
            </button>
          </nav>
        )}

      </div>

      {/* Meta Savings Banner Card */}
      <div className="p-3 border-t border-[#2a3942]">
        <div className="bg-gradient-to-br from-[#1b2a22] to-[#12231b] border border-emerald-500/30 rounded-xl p-3 text-left">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Meta Markup Bypass</span>
          </div>
          <div className="mt-1 text-lg font-extrabold text-white">
            ${totalSavedDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Saved this month by eliminating Meta official API per-conversation charges.
          </p>
        </div>
      </div>

    </aside>
  );
};
