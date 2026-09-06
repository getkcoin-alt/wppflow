import React from 'react';
import { Activity, ShieldAlert, Key, CheckCircle2, UserCheck, Smartphone } from 'lucide-react';

export const AuditLogs: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">System & Security Audit Logs</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically recorded actions across all workspaces, session lifecycles, and API key regenerations.
        </p>
      </div>

      <div className="bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#202c33]/50 border-b border-[#2a3942] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3942]/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#202c33]/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.actor}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {log.target}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-indigo-400">
                    {log.ip}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'success'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      <span className="uppercase">{log.status}</span>
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
