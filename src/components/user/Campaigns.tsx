import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  TrendingDown, 
  Send, 
  Eye, 
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BroadcastCampaign } from '../../types';

interface CampaignsProps {
  campaigns: BroadcastCampaign[];
  onAddCampaign: (campaign: Omit<BroadcastCampaign, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'repliedCount' | 'failedCount'>) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const Campaigns: React.FC<CampaignsProps> = ({
  campaigns,
  onAddCampaign,
  isCreateModalOpen,
  setIsCreateModalOpen
}) => {
  const [name, setName] = useState('');
  const [targetSegment, setTargetSegment] = useState('VIP & High LTV Customers');
  const [templateText, setTemplateText] = useState('✨ {Bonjour|Hello|Greetings} {{name}}! Our new collection has arrived. As our valued patron, enjoy priority access before public launch.');
  const [antiBanDelay, setAntiBanDelay] = useState(4);
  const [totalRecipients, setTotalRecipients] = useState(1250);

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !templateText) return;

    // Calculate Meta bypass savings ($0.05 per conversation)
    const costSavedMeta = (totalRecipients * 0.05);

    onAddCampaign({
      name,
      targetSegment,
      totalRecipients,
      costSavedMeta,
      status: 'running',
      templateText,
      antiBanDelaySeconds: antiBanDelay
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    setName('');
    setIsCreateModalOpen(false);
  };

  // Preview spin-tax interpolation
  const previewMessage = templateText
    .replace('{Bonjour|Hello|Greetings}', 'Hello')
    .replace('{{name}}', 'Sophia Laurent');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Broadcast Campaigns Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Send bulk personalized WhatsApp campaigns without waiting for Meta template reviews, protected by anti-ban rate limiting.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#202c33]/50 border-b border-[#2a3942] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Campaign Details</th>
                <th className="py-3.5 px-4">Audience</th>
                <th className="py-3.5 px-4">Delivered / Sent</th>
                <th className="py-3.5 px-4">Engagement (Read & Replied)</th>
                <th className="py-3.5 px-4">Meta Fee Saved</th>
                <th className="py-3.5 px-4">Anti-Ban Pacing</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3942]/60">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#202c33]/30 transition-colors">
                  
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white text-xs">{camp.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{camp.templateText}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-300 font-medium">{camp.targetSegment}</div>
                    <div className="text-[10px] text-slate-400">{camp.totalRecipients.toLocaleString()} recipients</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-white font-mono font-medium">
                      {camp.deliveredCount.toLocaleString()} / {camp.sentCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      {camp.sentCount > 0 ? `${((camp.deliveredCount / camp.sentCount) * 100).toFixed(1)}% Delivery` : 'Queued'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-300">
                      👁️ {camp.readCount.toLocaleString()} read
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">
                      💬 {camp.repliedCount.toLocaleString()} customer replies
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg text-xs">
                      +${camp.costSavedMeta.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{camp.antiBanDelaySeconds}s delay / msg</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      camp.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : camp.status === 'running'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      <span>{camp.status}</span>
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Broadcast Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in">
            
            <div className="p-4 border-b border-[#2a3942] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Create WhatsApp Broadcast Campaign</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-300 font-medium mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Sale 24h Exclusive"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Segment</label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VIP & High LTV Customers">VIP & High LTV Customers (1,250)</option>
                    <option value="Abandoned Cart 24h">Shopify Cart Abandoners (420)</option>
                    <option value="All Subscribers">All Opt-in Subscribers (12,400)</option>
                    <option value="EU Region Buyers">EU Region Buyers (3,100)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Recipients</label>
                  <input
                    type="number"
                    value={totalRecipients}
                    onChange={(e) => setTotalRecipients(parseInt(e.target.value))}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Message Template (Supports spin-tax &#123;A|B&#125; and merge tags &#123;&#123;name&#125;&#125;)
                </label>
                <textarea
                  rows={3}
                  required
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-[#0b141a] rounded-xl border border-[#2a3942] space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Live Recipient Preview</span>
                </div>
                <div className="chat-bubble-out text-white p-3 rounded-xl rounded-tr-xs text-xs max-w-sm">
                  <p>{previewMessage}</p>
                  <div className="text-[10px] text-slate-300/80 text-right mt-1 font-mono">10:42 AM • ✓✓</div>
                </div>
              </div>

              {/* Anti-Ban Jitter Slider */}
              <div className="p-3 bg-[#202c33] rounded-xl space-y-2 border border-[#2a3942]">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Humanized Anti-Ban Jitter Delay</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{antiBanDelay}s per message</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={antiBanDelay}
                  onChange={(e) => setAntiBanDelay(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Fast (2s)</span>
                  <span>Safe Standard (4-6s)</span>
                  <span>Ultra Safe (12s)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-emerald-400 font-mono font-semibold">
                  Meta markup avoided: +${(totalRecipients * 0.05).toFixed(2)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3.5 py-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-900/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Launch Broadcast Now</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
