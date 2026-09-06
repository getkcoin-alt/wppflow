import React from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Code2, 
  Users, 
  CheckCircle2, 
  Bell, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { WhatsAppSession } from '../../types';

interface NavbarProps {
  currentView: 'user' | 'admin' | 'developer';
  onSelectView: (view: 'user' | 'admin' | 'developer') => void;
  sessions: WhatsAppSession[];
  onOpenNewSession: () => void;
  onOpenNewBroadcast: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  sessions,
  onOpenNewSession,
  onOpenNewBroadcast
}) => {
  const connectedCount = sessions.filter(s => s.status === 'CONNECTED').length;

  return (
    <header className="bg-[#111b21] border-b border-[#2a3942] sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-900/30 text-white">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                WppFlow
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                10x Interakt
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Powered by <span className="text-emerald-400 font-semibold">WPPConnect</span> • $0 Meta Conversation Fees
            </p>
          </div>
        </div>

        {/* Global Role / Mode Switcher */}
        <div className="hidden md:flex items-center bg-[#202c33] p-1 rounded-xl border border-[#2a3942]">
          <button
            onClick={() => onSelectView('user')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'user'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111b21]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>User Workspace</span>
          </button>

          <button
            onClick={() => onSelectView('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111b21]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
            <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
              Admin
            </span>
          </button>

          <button
            onClick={() => onSelectView('developer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'developer'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111b21]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Guide</span>
            <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
              REST / SDK
            </span>
          </button>
        </div>

        {/* Action Controls & Session Pill */}
        <div className="flex items-center gap-3">
          
          {/* Active Sessions Indicator */}
          <div 
            onClick={onOpenNewSession}
            title="Manage connected WhatsApp instances"
            className="flex items-center gap-2 bg-[#202c33] border border-[#2a3942] hover:border-emerald-500/50 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">
              <span className="text-emerald-400 font-bold">{connectedCount}</span> Sessions Live
            </span>
          </div>

          {/* Quick Broadcast Button */}
          <button
            onClick={onOpenNewBroadcast}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-900/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Broadcast</span>
          </button>

          {/* Current Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#2a3942]">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"
              alt="User profile"
              className="w-8 h-8 rounded-full ring-2 ring-emerald-500/30 object-cover"
            />
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-200">Aarav Mehta</div>
              <div className="text-[10px] text-emerald-400 font-medium">Urban Threads (Enterprise)</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
