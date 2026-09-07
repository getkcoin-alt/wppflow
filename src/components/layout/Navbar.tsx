import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Code2, 
  Users, 
  CheckCircle2, 
  Bell, 
  Sparkles,
  ExternalLink,
  LogIn,
  LogOut,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { WhatsAppSession, AuthUser } from '../../types';
import { checkBackendHealth, BackendHealth } from '../../services/api';

interface NavbarProps {
  currentView: 'user' | 'admin' | 'developer';
  onSelectView: (view: 'user' | 'admin' | 'developer') => void;
  sessions: WhatsAppSession[];
  onOpenNewSession: () => void;
  onOpenNewBroadcast: () => void;
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  sessions,
  onOpenNewSession,
  onOpenNewBroadcast,
  currentUser,
  onOpenAuthModal,
  onLogout
}) => {
  const connectedCount = sessions.filter(s => s.status === 'CONNECTED').length;
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email?.toLowerCase() === 'admin@wppflow.io';
  const [engineHealth, setEngineHealth] = React.useState<BackendHealth | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      const data = await checkBackendHealth();
      if (mounted && data) {
        setEngineHealth(data);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

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
              Next-Gen WhatsApp CRM & Automation Hub • $0 Meta Conversation Fees
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

          {canManage && <button
            onClick={() => onSelectView('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111b21]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isSuperAdmin ? 'Super Admin' : 'Company Admin'}</span>
            <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
              Admin
            </span>
          </button>}

          {canManage && <button
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
          </button>}
        </div>

        {/* Action Controls & Session Pill */}
        <div className="flex items-center gap-3">
          
          {/* Cloud OmniEngine Live Status */}
          <div
            title="WppFlow Cloud OmniEngine Status"
            className="hidden sm:flex items-center gap-1.5 bg-[#202c33] border border-[#2a3942] hover:border-emerald-500/50 px-2.5 py-1.5 rounded-lg text-xs transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${engineHealth?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-slate-300 font-medium">
              Cloud OmniEngine: <span className="text-emerald-400 font-bold">{engineHealth?.status === 'ok' ? 'Online (v2.4)' : 'Connecting...'}</span>
            </span>
          </div>

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

          {/* Dynamic Profile or Sign In */}
          {currentUser ? (
            <div className="relative pl-2 border-l border-[#2a3942]">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#202c33] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 ring-2 ring-emerald-500/30 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {currentUser.company_name} ({currentUser.role === 'admin' ? 'Admin' : currentUser.plan || 'Growth'})
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#182229] border border-[#2a3942] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#2a3942]">
                    <div className="font-bold text-white text-xs">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{currentUser.plan || 'Growth'} Plan ({currentUser.sessions_limit || 5} Lines)</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSelectView(canManage ? 'admin' : 'user');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#202c33] text-slate-300 hover:text-white flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Switch to {canManage ? 'Admin Panel' : 'Workspace'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 flex items-center gap-2 border-t border-[#2a3942]"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
