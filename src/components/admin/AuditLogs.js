import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
export const AuditLogs = () => {
    const logs = [
        {
            id: 'log_1',
            action: 'Session Paired (QR Code)',
            actor: 'Aarav Mehta (Urban Threads)',
            target: 'Session: sales-primary (+1 555-349-8201)',
            ip: '198.51.100.42',
            timestamp: '2026-09-06 08:14:22',
            status: 'success'
        },
        {
            id: 'log_2',
            action: 'API Key Generated',
            actor: 'Elena Rostova (Nova Auto)',
            target: 'Token: wpp_live_sec_****821d',
            ip: '185.220.101.5',
            timestamp: '2026-09-05 19:43:10',
            status: 'success'
        },
        {
            id: 'log_3',
            action: 'Quota Adjusted by Superadmin',
            actor: 'Superadmin (Platform)',
            target: 'Marcus Vance: Quota updated to 5 sessions',
            ip: '127.0.0.1 (Internal)',
            timestamp: '2026-09-04 14:12:00',
            status: 'warning'
        },
        {
            id: 'log_4',
            action: 'Anti-Ban Warmup Advanced',
            actor: 'Warmup Engine (Auto)',
            target: 'Session: support-desk reached Day 12 limit',
            ip: '10.0.4.12',
            timestamp: '2026-09-04 00:01:15',
            status: 'success'
        }
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", children: _jsx(Activity, { className: "w-5 h-5" }) }), _jsx("h1", { className: "text-xl font-bold text-white tracking-tight", children: "System & Security Audit Logs" })] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Cryptographically recorded actions across all workspaces, session lifecycles, and API key regenerations." })] }), _jsx("div", { className: "bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-[#202c33]/50 border-b border-[#2a3942] text-slate-400 font-semibold uppercase text-[10px] tracking-wider", children: [_jsx("th", { className: "py-3 px-4", children: "Event Action" }), _jsx("th", { className: "py-3 px-4", children: "Actor" }), _jsx("th", { className: "py-3 px-4", children: "Target Resource" }), _jsx("th", { className: "py-3 px-4", children: "Source IP" }), _jsx("th", { className: "py-3 px-4", children: "Timestamp" }), _jsx("th", { className: "py-3 px-4", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-[#2a3942]/60", children: logs.map((log) => (_jsxs("tr", { className: "hover:bg-[#202c33]/30 transition-colors", children: [_jsx("td", { className: "py-3 px-4 font-semibold text-white", children: log.action }), _jsx("td", { className: "py-3 px-4 text-slate-300", children: log.actor }), _jsx("td", { className: "py-3 px-4 font-mono text-[11px] text-slate-400", children: log.target }), _jsx("td", { className: "py-3 px-4 font-mono text-[11px] text-indigo-400", children: log.ip }), _jsx("td", { className: "py-3 px-4 text-slate-400", children: log.timestamp }), _jsx("td", { className: "py-3 px-4", children: _jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'success'
                                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                                    : 'bg-amber-950 text-amber-400 border border-amber-800'}`, children: [log.status === 'success' ? _jsx(CheckCircle2, { className: "w-3 h-3" }) : _jsx(ShieldAlert, { className: "w-3 h-3" }), _jsx("span", { className: "uppercase", children: log.status })] }) })] }, log.id))) })] }) }) })] }));
};
