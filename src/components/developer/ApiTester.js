import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Play, Copy, Check, Clock } from 'lucide-react';
export const ApiTester = ({ endpoints }) => {
    const [selectedEndpointId, setSelectedEndpointId] = useState(endpoints[0]?.id || '');
    const [sessionParam, setSessionParam] = useState('sales-primary');
    const [requestBody, setRequestBody] = useState(JSON.stringify(endpoints[0]?.sampleBody || {}, null, 2));
    const [isLoading, setIsLoading] = useState(false);
    const [responseOutput, setResponseOutput] = useState(endpoints[0]?.sampleResponse || null);
    const [responseStatus, setResponseStatus] = useState(200);
    const [latencyMs, setLatencyMs] = useState(114);
    const [copiedCurl, setCopiedCurl] = useState(false);
    const currentEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];
    const handleSelectEndpoint = (id) => {
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-[#111b21] p-4 rounded-2xl border border-[#2a3942] flex flex-col md:flex-row items-start md:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 w-full md:w-auto", children: [_jsx("span", { className: `px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase ${currentEndpoint.method === 'POST' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                    currentEndpoint.method === 'GET' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                        'bg-amber-950 text-amber-400'}`, children: currentEndpoint.method }), _jsx("select", { value: selectedEndpointId, onChange: (e) => handleSelectEndpoint(e.target.value), className: "bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 cursor-pointer", children: endpoints.map(ep => (_jsxs("option", { value: ep.id, className: "bg-[#202c33]", children: [ep.method, " ", ep.path, " \u2014 ", ep.title] }, ep.id))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: handleCopyCurl, className: "flex items-center gap-1.5 px-3 py-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-xl text-xs font-medium transition-all", children: [copiedCurl ? _jsx(Check, { className: "w-3.5 h-3.5 text-emerald-400" }) : _jsx(Copy, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Copy cURL" })] }), _jsxs("button", { onClick: handleExecuteRequest, disabled: isLoading, className: "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30", children: [_jsx(Play, { className: `w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}` }), _jsx("span", { children: isLoading ? 'Executing...' : 'Send Live Request' })] })] })] }), _jsxs("div", { className: "p-4 bg-[#111b21] rounded-2xl border border-[#2a3942] space-y-2", children: [_jsx("h2", { className: "text-sm font-bold text-white", children: currentEndpoint.title }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: currentEndpoint.description })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsxs("div", { className: "bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 flex flex-col space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs font-semibold text-slate-300", children: [_jsx("span", { children: "Request Body (JSON)" }), _jsx("span", { className: "text-[10px] text-slate-500 font-mono", children: "application/json" })] }), _jsx("div", { className: "flex-1 min-h-[260px]", children: _jsx("textarea", { value: requestBody, onChange: (e) => setRequestBody(e.target.value), className: "w-full h-full min-h-[260px] bg-[#0b141a] border border-[#2a3942] rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none", spellCheck: false }) }), _jsxs("div", { className: "p-2.5 bg-[#202c33] rounded-xl border border-[#2a3942] text-[11px] text-slate-300", children: [_jsx("span", { className: "font-semibold text-slate-400", children: "Headers: " }), _jsx("span", { className: "font-mono text-emerald-400", children: "Authorization: Bearer wpp_live_sec_****821d" })] })] }), _jsxs("div", { className: "bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 flex flex-col space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "font-semibold text-slate-300", children: "Response Payload" }), _jsxs("div", { className: "flex items-center gap-2 font-mono text-[11px]", children: [_jsxs("span", { className: "px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold", children: [responseStatus, " OK"] }), _jsxs("span", { className: "text-slate-400 flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3 text-slate-400" }), _jsxs("span", { children: [latencyMs, "ms"] })] })] })] }), _jsx("div", { className: "flex-1 min-h-[260px] bg-[#0b141a] border border-[#2a3942] rounded-xl p-3 font-mono text-xs text-slate-200 overflow-x-auto overflow-y-auto max-h-[350px]", children: _jsx("pre", { className: "text-emerald-300 text-xs", children: JSON.stringify(responseOutput, null, 2) }) }), _jsxs("div", { className: "flex items-center justify-between text-[11px] text-slate-400", children: [_jsx("span", { children: "Encoding: gzip" }), _jsx("span", { className: "text-emerald-400 font-semibold", children: "WPPConnect Server v2.3000.101" })] })] })] })] }));
};
