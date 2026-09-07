import React, { useState } from 'react';
import {
  Smartphone, ShieldCheck, LogIn, UserPlus, Mail, Lock, User,
  Building2, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff,
  Zap, MessageSquare, BarChart3, Bot
} from 'lucide-react';
import { loginUser, signupUser, setStoredToken } from '../../services/api';
import { AuthUser } from '../../types';

interface LoginPageProps {
  onAuthSuccess: (user: AuthUser, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(email, password);
        if (res.status === 'success' && res.token && res.user) {
          setStoredToken(res.token);
          setSuccessMsg('Authenticated! Loading your workspace...');
          setTimeout(() => onAuthSuccess(res.user, res.token!), 700);
        } else {
          setError(res.message || 'Invalid email or password.');
        }
      } else {
        const res = await signupUser(name, email, password, companyName, role);
        if (res.status === 'success' && res.token && res.user) {
          setStoredToken(res.token);
          setSuccessMsg('Account created! Welcome to WppFlow.');
          setTimeout(() => onAuthSuccess(res.user, res.token!), 700);
        } else {
          setError(res.message || 'Signup failed. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: MessageSquare, label: 'Multi-Session WhatsApp Inbox', color: 'text-emerald-400' },
    { icon: BarChart3, label: 'Broadcast Campaigns at $0 Meta Fees', color: 'text-teal-400' },
    { icon: Bot, label: 'Keyword & Flow Automations', color: 'text-cyan-400' },
    { icon: Zap, label: 'Real-Time WebSocket Delivery', color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0c1317] flex">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-gradient-to-br from-[#0d1f17] via-[#0c1317] to-[#0a1a22] p-12 border-r border-[#1a2a32] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-900/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
              WppFlow
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Next-Gen WhatsApp CRM</div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              10× Faster Than<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Interakt & WATI
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-sm">
              Run unlimited WhatsApp sessions, broadcast to thousands, and automate customer journeys — all without paying Meta conversation fees.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#111b21] border border-[#2a3942] flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm text-slate-300 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3 bg-[#111b21]/80 border border-[#2a3942] rounded-2xl px-4 py-3">
            <div className="flex -space-x-2">
              {['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-indigo-500'].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#111b21] flex items-center justify-center text-[10px] font-bold text-white`}>
                  {['A', 'E', 'C', 'M'][i]}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">2,400+</span> businesses trust WppFlow
            </div>
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>End-to-end encrypted · PostgreSQL-backed · Railway Cloud</span>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white">WppFlow</span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your WhatsApp CRM dashboard'
                : 'Register a new organization and start for free'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#111b21] p-1 rounded-xl border border-[#2a3942]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#111b21] border border-[#2a3942] focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">Organization Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Acme Logistics"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#111b21] border border-[#2a3942] focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">Account Type</label>
                  <div className="rounded-xl border border-[#2a3942] bg-[#111b21] px-3 py-2.5 text-xs text-slate-400">
                    New accounts start as employees. Company administrators are invited by the platform administrator.
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] focus:border-emerald-500 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to Dashboard
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Workspace
                </>
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          {mode === 'login' && (
            <div className="bg-[#111b21] border border-[#2a3942] rounded-xl p-3 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 mb-1">Demo credentials:</div>
              <div>Admin: <span className="font-mono text-emerald-400">admin@wppflow.io</span> / <span className="font-mono text-emerald-400">admin123</span></div>
              <div>User: <span className="font-mono text-teal-400">demo@wppflow.io</span> / <span className="font-mono text-teal-400">demo123</span></div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
