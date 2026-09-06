import React, { useState } from 'react';
import { 
  Smartphone, 
  MessageSquare, 
  Megaphone, 
  CheckCircle2, 
  TrendingDown, 
  Sparkles, 
  Clock, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { WhatsAppSession, BroadcastCampaign } from '../../types';

interface DashboardProps {
  sessions: WhatsAppSession[];
  campaigns: BroadcastCampaign[];
  onOpenSessionModal: () => void;
  onOpenNewBroadcast: () => void;
  onNavigateToInbox: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  campaigns,
  onOpenSessionModal,
  onOpenNewBroadcast,
  onNavigateToInbox
}) => {
  const [calcVolume, setCalcVolume] = useState(35000);

  const connectedSessions = sessions.filter(s => s.status === 'CONNECTED');
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '98.4';

  // Savings calculation vs Interakt / Meta API ($0.05 per conversation on average)
  const officialMetaCost = (calcVolume * 0.05);
  const interaktBaseCost = 149; // Interakt growth tier
  const interaktTotal = officialMetaCost + interaktBaseCost;
  const wppflowCost = 0; // zero meta conversation fees
  const annualSavings = (interaktTotal * 12);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#12231b] via-[#111b21] to-[#121c24] p-6 rounded-2xl border border-emerald-500/30 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero Meta Conversation Tax Active</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome back, Urban Threads!
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Your WppFlow cluster is actively managing <span className="text-emerald-400 font-bold">{connectedSessions.length} WhatsApp numbers</span> with zero per-message charges and automated anti-ban pacing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSessionModal}
              className="flex items-center gap-2 bg-[#202c33] hover:bg-[#2a3942] text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#2a3942] transition-all"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Pair New Phone</span>
            </button>
            <button
              onClick={onOpenNewBroadcast}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
            >
              <Megaphone className="w-4 h-4" />
              <span>Launch Broadcast</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Online WhatsApp Lines</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {connectedSessions.length} <span className="text-xs font-normal text-slate-400">/ {sessions.length} paired</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Anti-ban warmup in full health</span>
          </div>
        </div>

        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Broadcast Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {deliveryRate}%
          </div>
          <div className="text-[11px] text-slate-300 mt-2">
            {totalDelivered.toLocaleString()} delivered out of {totalSent.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Agent Response Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            1m 24s
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 font-medium">
            42s faster than industry benchmark
          </div>
        </div>

        <div className="bg-[#111b21] border border-emerald-500/30 p-4 rounded-2xl bg-gradient-to-br from-[#111b21] to-[#12231b]">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Meta WABA Markup Avoided</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            ${(totalSent * 0.05).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-300 mt-2">
            100% saved vs Interakt official API fees
          </div>
        </div>

      </div>

      {/* 10x ROI Calculator: Interakt vs WppFlow */}
      <div className="bg-[#111b21] border border-[#2a3942] p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2a3942] pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Cost Comparison: Interakt (Meta BSP) vs. WppFlow (Direct Session)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              See how much your business saves annually by removing Meta's $0.05 per-conversation tax.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-medium">Projected Annual Savings:</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              +${annualSavings.toLocaleString()} / year
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Monthly Message Volume:</span>
            <span className="font-bold text-white font-mono">{calcVolume.toLocaleString()} conversations / mo</span>
          </div>
          <input
            type="range"
            min="5000"
            max="150000"
            step="5000"
            value={calcVolume}
            onChange={(e) => setCalcVolume(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>5,000 / mo</span>
            <span>50,000 / mo</span>
            <span>150,000 / mo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Interakt Cost */}
          <div className="p-4 bg-[#202c33]/50 rounded-xl border border-rose-900/40">
            <div className="flex justify-between items-center text-xs font-semibold text-rose-400">
              <span>Interakt (Official Meta BSP)</span>
              <span className="text-xs font-mono">${interaktTotal.toLocaleString()} / mo</span>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>Base Platform SaaS Plan:</span>
                <span className="font-mono text-white">${interaktBaseCost}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Meta Conversation Markups (~$0.05/msg):</span>
                <span className="font-mono text-rose-400">+${officialMetaCost.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-[#2a3942]">
                <span>Template Approval Delays:</span>
                <span className="text-amber-400">24 - 48 Hours</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>WhatsApp Group Support:</span>
                <span className="text-rose-400">Not Supported</span>
              </div>
            </div>
          </div>

          {/* WppFlow Cost */}
          <div className="p-4 bg-gradient-to-br from-[#14261c] to-[#111b21] rounded-xl border border-emerald-500/40 shadow-md">
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-400">
              <span>WppFlow (OmniEngine)</span>
              <span className="text-xs font-mono font-bold">$0.00 Meta Fees</span>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>Meta Conversation Markups:</span>
                <span className="font-mono text-emerald-400 font-bold">$0.00 (Direct Web Session)</span>
              </div>
              <div className="flex justify-between">
                <span>Template Approvals:</span>
                <span className="font-mono text-emerald-400">Instant (No Review Required)</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 pt-1 border-t border-emerald-900/40">
                <span>WhatsApp Group Automation:</span>
                <span className="text-emerald-400 font-semibold">Full Native Support</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Anti-Ban Safety Shield:</span>
                <span className="text-emerald-400 font-semibold">Built-in Jitter & Warmup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active WhatsApp Sessions Quick View */}
      <div className="bg-[#111b21] border border-[#2a3942] p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Connected WhatsApp Phone Numbers</span>
            </h2>
            <p className="text-xs text-slate-400">All sessions running on isolated Chromium Puppeteer instances</p>
          </div>
          <button
            onClick={onOpenSessionModal}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sessions.slice(0, 3).map((s) => (
            <div key={s.id} className="p-3.5 bg-[#202c33] rounded-xl border border-[#2a3942] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">{s.displayName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  s.status === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {s.status}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300">{s.phone}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#2a3942]/60">
                <span>Anti-Ban Score: <span className="text-emerald-400 font-bold">{s.antiBanHealth}%</span></span>
                <span>Sent Today: <span className="text-white font-mono">{s.messagesSentToday}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Broadcast Campaigns */}
      <div className="bg-[#111b21] border border-[#2a3942] p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              <span>Recent Broadcast Campaigns</span>
            </h2>
            <p className="text-xs text-slate-400">Live delivery metrics and Meta markup bypass calculations</p>
          </div>
          <button
            onClick={onOpenNewBroadcast}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Create Campaign</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2a3942] text-[10px] text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Campaign Name</th>
                <th className="py-2.5 px-3">Audience Segment</th>
                <th className="py-2.5 px-3">Delivery Rate</th>
                <th className="py-2.5 px-3">Replies</th>
                <th className="py-2.5 px-3">Cost Saved vs Meta</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3942]/50">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#202c33]/30">
                  <td className="py-2.5 px-3 font-medium text-white">{camp.name}</td>
                  <td className="py-2.5 px-3 text-slate-300">{camp.targetSegment}</td>
                  <td className="py-2.5 px-3 text-slate-200">
                    {camp.sentCount > 0 ? `${((camp.deliveredCount / camp.sentCount) * 100).toFixed(0)}% (${camp.deliveredCount}/${camp.sentCount})` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{camp.repliedCount} replies</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">+${camp.costSavedMeta.toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      camp.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : camp.status === 'running'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
