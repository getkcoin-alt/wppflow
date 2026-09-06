import React, { useState } from 'react';
import { Layers, Copy, Check, Terminal, Code2 } from 'lucide-react';
import { ApiEndpoint } from '../../types';

interface SdkSnippetsProps {
  endpoints: ApiEndpoint[];
}

export const SdkSnippets: React.FC<SdkSnippetsProps> = ({ endpoints }) => {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go'>('node');
  const [copied, setCopied] = useState(false);

  const ep = endpoints[0]; // send-message endpoint

  const getSnippet = () => {
    switch (activeLang) {
      case 'curl': return ep.curlSnippet;
      case 'node': return ep.nodeSnippet;
      case 'python': return ep.pythonSnippet;
      case 'php': return ep.phpSnippet;
      case 'go': return ep.goSnippet;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Official Client SDK Quickstarts</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Drop-in code snippets for Node.js, Python, PHP, Go, and standard cURL to integrate WhatsApp automation into your product in 60 seconds.
        </p>
      </div>

      {/* Code Container */}
      <div className="bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden shadow-xl">
        
        {/* Language Tabs */}
        <div className="p-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveLang('node')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeLang === 'node' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node.js
            </button>
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeLang === 'python' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeLang === 'curl' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveLang('go')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeLang === 'go' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Go
            </button>
            <button
              onClick={() => setActiveLang('php')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeLang === 'php' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PHP
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111b21] hover:bg-[#202c33] text-slate-300 rounded-xl text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-5 bg-[#0b141a] overflow-x-auto">
          <pre className="font-mono text-xs text-amber-300 leading-relaxed">
            {getSnippet()}
          </pre>
        </div>

      </div>

    </div>
  );
};
