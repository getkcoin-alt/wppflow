import React, { useState } from 'react';
import { 
  Webhook, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Terminal,
  RefreshCw
} from 'lucide-react';
import { WebhookLog } from '../../types';

interface WebhookSimulatorProps {
  logs: WebhookLog[];
  onTriggerTestWebhook: () => void;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({
  logs,
  onTriggerTestWebhook
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string>(logs[0]?.id || '');
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourbrand.com/webhooks/whatsapp');
  const [isSaved, setIsSaved] = useState(false);

  const selectedLog = logs.find(l => l.id === selectedLogId) || logs[0];

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Webhook Endpoint Configuration */}
      <div className="bg-[#111b21] p-5 rounded-2xl border border-[#2a3942] space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Webhook className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-base font-bold text-white">Webhook Dispatch URL</h1>
            <p className="text-xs text-slate-400">
              Receive real-time incoming messages, status acks (sent/delivered/read), and device battery events.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-4 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-amber-900/30 shrink-0"
          >
            {isSaved ? 'Endpoint Saved!' : 'Save Webhook URL'}
          </button>
        </form>
      </div>

      {/* Simulator Controls & Live Event Log */}
      <div className="bg-[#111b21] p-5 rounded-2xl border border-[#2a3942] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Webhook Event Stream</span>
            </h2>
            <p className="text-xs text-slate-400">Inspecting outbound webhook payloads delivered to your backend</p>
          </div>

          <button
            onClick={onTriggerTestWebhook}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-900/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trigger Mock Incoming Message</span>
          </button>
        </div>

        {/* Split view: Log list vs JSON detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          
          {/* Logs List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((l) => (
              <div
                key={l.id}
                onClick={() => setSelectedLogId(l.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  l.id === selectedLogId
                    ? 'bg-[#202c33] border-amber-500/50'
                    : 'bg-[#111b21] border-[#2a3942] hover:bg-[#202c33]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      event: {l.event}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                      200 OK
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{l.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  session: <span className="text-white">{l.session}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Payload Inspector */}
          {selectedLog && (
            <div className="bg-[#0b141a] border border-[#2a3942] rounded-xl p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2a3942]">
                  <span className="font-semibold text-slate-300">HTTP POST Payload</span>
                  <span className="font-mono text-[10px] text-emerald-400">X-WPP-Signature: sha256=...</span>
                </div>
                <pre className="font-mono text-xs text-amber-300 overflow-x-auto mt-3 max-h-[300px]">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-[#2a3942]">
                Delivery status: delivered in 42ms to {webhookUrl}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
