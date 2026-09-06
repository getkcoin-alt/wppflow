import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Layers, Copy, Check } from 'lucide-react';
export const SdkSnippets = ({ endpoints }) => {
    const [activeLang, setActiveLang] = useState('node');
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20", children: _jsx(Layers, { className: "w-5 h-5" }) }), _jsx("h1", { className: "text-xl font-bold text-white tracking-tight", children: "Official Client SDK Quickstarts" })] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Drop-in code snippets for Node.js, Python, PHP, Go, and standard cURL to integrate WhatsApp automation into your product in 60 seconds." })] }), _jsxs("div", { className: "bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden shadow-xl", children: [_jsxs("div", { className: "p-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => setActiveLang('node'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${activeLang === 'node' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`, children: "Node.js" }), _jsx("button", { onClick: () => setActiveLang('python'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${activeLang === 'python' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`, children: "Python" }), _jsx("button", { onClick: () => setActiveLang('curl'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${activeLang === 'curl' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`, children: "cURL" }), _jsx("button", { onClick: () => setActiveLang('go'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${activeLang === 'go' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`, children: "Go" }), _jsx("button", { onClick: () => setActiveLang('php'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${activeLang === 'php' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`, children: "PHP" })] }), _jsxs("button", { onClick: handleCopy, className: "flex items-center gap-1.5 px-3 py-1.5 bg-[#111b21] hover:bg-[#202c33] text-slate-300 rounded-xl text-xs font-medium transition-all", children: [copied ? _jsx(Check, { className: "w-3.5 h-3.5 text-emerald-400" }) : _jsx(Copy, { className: "w-3.5 h-3.5" }), _jsx("span", { children: copied ? 'Copied' : 'Copy Code' })] })] }), _jsx("div", { className: "p-5 bg-[#0b141a] overflow-x-auto", children: _jsx("pre", { className: "font-mono text-xs text-amber-300 leading-relaxed", children: getSnippet() }) })] })] }));
};
