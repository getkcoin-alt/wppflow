import React, { useState } from 'react';
import { 
  Code2, 
  Webhook, 
  Layers, 
  Key, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Terminal,
  RefreshCw
} from 'lucide-react';
import { ApiEndpoint, WebhookLog } from '../../types';
import { ApiTester } from './ApiTester';
import { WebhookSimulator } from './WebhookSimulator';
import { SdkSnippets } from './SdkSnippets';

interface DeveloperGuideProps {
  endpoints: ApiEndpoint[];
  webhookLogs: WebhookLog[];
  onTriggerTestWebhook: () => void;
  activeDevTab: 'docs' | 'webhooks' | 'sdks' | 'keys';
  onSelectDevTab: (tab: 'docs' | 'webhooks' | 'sdks' | 'keys') => void;
}

export const DeveloperGuide: React.FC<DeveloperGuideProps> = ({
  endpoints,
  webhookLogs,
  onTriggerTestWebhook,
  activeDevTab,
  onSelectDevTab
}) => {
  const [apiKey, setApiKey] = useState('wpp_live_sec_9938201a4bc8821d');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const newKey = `wpp_live_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 8)}`;
      setApiKey(newKey);
      setIsRegenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex bg-[#111b21] p-1.5 rounded-2xl border border-[#2a3942] gap-1 text-xs">
        <button
          onClick={() => onSelectDevTab('docs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            activeDevTab === 'docs' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Interactive REST Playground</span>
        </button>

        <button
          onClick={() => onSelectDevTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            activeDevTab === 'webhooks' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhook Stream</span>
        </button>

        <button
          onClick={() => onSelectDevTab('sdks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            activeDevTab === 'sdks' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>SDK Quickstarts</span>
        </button>

        <button
          onClick={() => onSelectDevTab('keys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            activeDevTab === 'keys' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Credentials</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeDevTab === 'docs' && (
        <ApiTester endpoints={endpoints} />
      )}

      {activeDevTab === 'webhooks' && (
        <WebhookSimulator logs={webhookLogs} onTriggerTestWebhook={onTriggerTestWebhook} />
      )}

      {activeDevTab === 'sdks' && (
        <SdkSnippets endpoints={endpoints} />
      )}

      {activeDevTab === 'keys' && (
        <div className="space-y-6">
          <div className="bg-[#111b21] p-5 rounded-2xl border border-[#2a3942] space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Key className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base font-bold text-white">Live Production API Secret Key</h1>
                <p className="text-xs text-slate-400">
                  Authenticate your backend requests via Bearer token in the Authorization header.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="font-mono text-xs text-emerald-400 font-bold break-all">
                {apiKey}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111b21] hover:bg-[#111b21]/80 text-slate-300 rounded-lg text-xs font-semibold transition-all"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
                <button
                  onClick={handleRegenerateKey}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate Key</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3 bg-[#202c33]/50 rounded-xl border border-[#2a3942] space-y-1">
                <div className="font-semibold text-white">Rate Limits</div>
                <div className="text-[11px] text-slate-400">Standard: 120 requests/minute per active session instance.</div>
              </div>
              <div className="p-3 bg-[#202c33]/50 rounded-xl border border-[#2a3942] space-y-1">
                <div className="font-semibold text-white">Security & Scopes</div>
                <div className="text-[11px] text-slate-400">All endpoints encrypted with TLS 1.3. Sessions isolated by tenant ID.</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
