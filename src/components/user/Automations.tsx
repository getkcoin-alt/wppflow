import React, { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  Webhook, 
  MessageSquare, 
  UserCheck, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { AutomationRule } from '../../types';

interface AutomationsProps {
  automations: AutomationRule[];
  onToggleRule: (ruleId: string) => void;
}

export const Automations: React.FC<AutomationsProps> = ({ automations, onToggleRule }) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Bot className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Bot Flows & WhatsApp Automations</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build interactive chatbot journeys, auto-replies with clickable buttons, and external CRM webhooks.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30">
          <Plus className="w-4 h-4" />
          <span>New Flow Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {automations.map((rule) => (
          <div
            key={rule.id}
            className="bg-[#111b21] border border-[#2a3942] hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm text-white">{rule.name}</h2>
                </div>

                <button
                  onClick={() => onToggleRule(rule.id)}
                  className="text-slate-400 hover:text-white"
                >
                  {rule.isEnabled ? (
                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-600" />
                  )}
                </button>
              </div>

              <div className="mt-4 p-3 bg-[#202c33] rounded-xl space-y-2 border border-[#2a3942]/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Trigger Event:</span>
                  <div className="font-mono text-emerald-400 text-xs mt-0.5">{rule.triggerCondition}</div>
                </div>

                <div className="pt-2 border-t border-[#2a3942]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Automated Action:</span>
                  <div className="text-white text-xs mt-0.5">{rule.actionSummary}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#2a3942] text-xs">
              <span className="text-slate-400 text-[11px]">
                Executed: <span className="text-white font-mono font-semibold">{rule.executionsCount.toLocaleString()} times</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                rule.isEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {rule.isEnabled ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
