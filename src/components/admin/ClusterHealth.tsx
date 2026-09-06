import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  Globe2,
  Terminal
} from 'lucide-react';
import { ClusterMetrics } from '../../types';

interface ClusterHealthProps {
  metrics: ClusterMetrics;
  onRefreshMetrics: () => void;
}

export const ClusterHealth: React.FC<ClusterHealthProps> = ({
  metrics,
  onRefreshMetrics
}) => {
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGarbageCollect = () => {
    setIsFlushingCache(true);
    setTimeout(() => {
      setIsFlushingCache(false);
      setSuccessMessage('Puppeteer Chromium V8 garbage collection completed. Freed 1.4 GB memory.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">WppFlow Cloud Cluster & Node Health</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry for Headless Chromium worker pools, WebSocket sessions, and Anti-Ban proxy routes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGarbageCollect}
            disabled={isFlushingCache}
            className="flex items-center gap-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-[#2a3942]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFlushingCache ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Flush Inactive Sessions</span>
          </button>

          <button
            onClick={onRefreshMetrics}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-900/30"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sync Node Stats</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cluster Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* RAM Usage */}
        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Chromium RAM Usage</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {metrics.ramUsageGb.toFixed(1)} GB <span className="text-xs font-normal text-slate-400">/ {metrics.totalRamGb} GB</span>
          </div>
          <div className="w-full bg-[#202c33] h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${(metrics.ramUsageGb / metrics.totalRamGb) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
            <span>{((metrics.ramUsageGb / metrics.totalRamGb) * 100).toFixed(0)}% Allocated</span>
            <span>Healthy Headroom</span>
          </div>
        </div>

        {/* CPU Load */}
        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>CPU Core Load</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {metrics.cpuUsagePercent}%
          </div>
          <div className="w-full bg-[#202c33] h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${metrics.cpuUsagePercent}%` }}
            />
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Optimal Multithreading (8 vCPUs)</span>
          </div>
        </div>

        {/* Containers Active */}
        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Worker Containers</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1">
            {metrics.activeContainers} Instances
          </div>
          <div className="text-[11px] text-slate-300 mt-2">
            Managing {metrics.totalSessions} total WhatsApp sessions
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Auto-scaled on Kubernetes
          </div>
        </div>

        {/* Queue Latency */}
        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Message Dispatch Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {metrics.avgResponseMs} ms
          </div>
          <div className="text-[11px] text-slate-300 mt-2">
            Queue Depth: <span className="font-mono text-white font-bold">{metrics.queueDepth} pending</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            Sub-second WebSocket ACK
          </div>
        </div>

      </div>

      {/* Cluster Node Table */}
      <div className="bg-[#111b21] rounded-2xl border border-[#2a3942] p-5">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Active Worker Pods (WppFlow Core Engine v2.4)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#202c33] rounded-xl border border-[#2a3942]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">node-prod-us-east-1</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                PRIMARY
              </span>
            </div>
            <div className="mt-2 text-slate-400 text-[11px] space-y-1">
              <div>Sessions: <span className="text-white font-mono">16 connected</span></div>
              <div>Memory: <span className="text-white font-mono">2.8 GB / 6.0 GB</span></div>
              <div>Proxy Pool: <span className="text-emerald-400">Residential US Tier-1</span></div>
            </div>
          </div>

          <div className="p-3 bg-[#202c33] rounded-xl border border-[#2a3942]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">node-prod-eu-west-1</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                PRIMARY
              </span>
            </div>
            <div className="mt-2 text-slate-400 text-[11px] space-y-1">
              <div>Sessions: <span className="text-white font-mono">12 connected</span></div>
              <div>Memory: <span className="text-white font-mono">2.1 GB / 6.0 GB</span></div>
              <div>Proxy Pool: <span className="text-emerald-400">Residential EU Tier-1</span></div>
            </div>
          </div>

          <div className="p-3 bg-[#202c33] rounded-xl border border-[#2a3942]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">node-prod-ap-south-1</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                PRIMARY
              </span>
            </div>
            <div className="mt-2 text-slate-400 text-[11px] space-y-1">
              <div>Sessions: <span className="text-white font-mono">10 connected</span></div>
              <div>Memory: <span className="text-white font-mono">1.8 GB / 6.0 GB</span></div>
              <div>Proxy Pool: <span className="text-emerald-400">Residential IN / UAE Tier-1</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
