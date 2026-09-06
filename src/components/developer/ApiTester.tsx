import React, { useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  Code2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { ApiEndpoint } from '../../types';

interface ApiTesterProps {
  endpoints: ApiEndpoint[];
}

export const ApiTester: React.FC<ApiTesterProps> = ({ endpoints }) => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(endpoints[0]?.id || '');
  const [sessionParam, setSessionParam] = useState('sales-primary');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(endpoints[0]?.sampleBody || {}, null, 2)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<any>(endpoints[0]?.sampleResponse || null);
  const [responseStatus, setResponseStatus] = useState<number>(200);
  const [latencyMs, setLatencyMs] = useState<number>(114);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];

  const handleSelectEndpoint = (id: string) => {
    setSelectedEndpointId(id);
    const ep = endpoints.find(e => e.id === id);
    if (ep) {
      setRequestBody(JSON.stringify(ep.sampleBody || {}, null, 2));
      setResponseOutput(ep.sampleResponse);
    }
  };

  const handleExecuteRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResponseStatus(200);
      setLatencyMs(Math.floor(Math.random() * 60) + 95);
      setResponseOutput(currentEndpoint.sampleResponse);
    }, 450);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(currentEndpoint.curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Endpoint Selector Bar */}
      <div className="bg-[#111b21] p-4 rounded-2xl border border-[#2a3942] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase ${
            currentEndpoint.method === 'POST' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
            currentEndpoint.method === 'GET' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
            'bg-amber-950 text-amber-400'
          }`}>
            {currentEndpoint.method}
          </span>
          <select
            value={selectedEndpointId}
            onChange={(e) => handleSelectEndpoint(e.target.value)}
            className="bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {endpoints.map(ep => (
              <option key={ep.id} value={ep.id} className="bg-[#202c33]">
                {ep.method} {ep.path} — {ep.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-xl text-xs font-medium transition-all"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy cURL</span>
          </button>
          
          <button
            onClick={handleExecuteRequest}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Executing...' : 'Send Live Request'}</span>
          </button>
        </div>
      </div>

      {/* Description & Docs */}
      <div className="p-4 bg-[#111b21] rounded-2xl border border-[#2a3942] space-y-2">
        <h2 className="text-sm font-bold text-white">{currentEndpoint.title}</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{currentEndpoint.description}</p>
      </div>

      {/* Two Column Playground: Request vs Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Column: Request Body & Headers */}
        <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Request Body (JSON)</span>
            <span className="text-[10px] text-slate-500 font-mono">application/json</span>
          </div>

          <div className="flex-1 min-h-[260px]">
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full h-full min-h-[260px] bg-[#0b141a] border border-[#2a3942] rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>

          <div className="p-2.5 bg-[#202c33] rounded-xl border border-[#2a3942] text-[11px] text-slate-300">
            <span className="font-semibold text-slate-400">Headers: </span>
            <span className="font-mono text-emerald-400">Authorization: Bearer wpp_live_sec_****821d</span>
          </div>
        </div>

        {/* Right Column: Live Response */}
        <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Response Payload</span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                {responseStatus} OK
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{latencyMs}ms</span>
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] bg-[#0b141a] border border-[#2a3942] rounded-xl p-3 font-mono text-xs text-slate-200 overflow-x-auto overflow-y-auto max-h-[350px]">
            <pre className="text-emerald-300 text-xs">
              {JSON.stringify(responseOutput, null, 2)}
            </pre>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Encoding: gzip</span>
            <span className="text-emerald-400 font-semibold">WPPConnect Server v2.3000.101</span>
          </div>
        </div>

      </div>

    </div>
  );
};
