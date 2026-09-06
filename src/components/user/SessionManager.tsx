import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  ShieldCheck, 
  RefreshCw, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Zap, 
  Globe2, 
  Trash2, 
  Power,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WhatsAppSession, SessionState } from '../../types';

interface SessionManagerProps {
  sessions: WhatsAppSession[];
  onAddSession: (name: string, phone: string, channel: 'sales' | 'support' | 'vip' | 'general') => void;
  onRestartSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isPairModalOpen: boolean;
  setIsPairModalOpen: (open: boolean) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  onAddSession,
  onRestartSession,
  onDeleteSession,
  isPairModalOpen,
  setIsPairModalOpen
}) => {
  const [sessionName, setSessionName] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'sales' | 'support' | 'vip' | 'general'>('sales');

  // QR Modal States
  const [pairingMode, setPairingMode] = useState<'qr' | 'code'>('qr');
  const [countdown, setCountdown] = useState(30);
  const [isSimulatingPairing, setIsSimulatingPairing] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Countdown timer for QR code freshness
  useEffect(() => {
    let timer: any;
    if (isPairModalOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 30));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPairModalOpen, countdown]);

  const handleSimulateScan = () => {
    setIsSimulatingPairing(true);
    setTimeout(() => {
      setIsSimulatingPairing(false);
      setPairingSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        onAddSession(
          sessionName || 'New WhatsApp Line',
          phone || '+1 (555) 019-8833',
          channel
        );
        setIsPairModalOpen(false);
        setPairingSuccess(false);
        setSessionName('');
        setPhone('');
      }, 1400);
    }, 1500);
  };

  const pairingCode = 'WPP8-9K4M';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">WhatsApp Multi-Session Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Connect and orchestrate multiple physical or business WhatsApp accounts with automated anti-ban warming and proxy routing.
          </p>
        </div>

        <button
          onClick={() => {
            setCountdown(30);
            setIsPairModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New WhatsApp Account</span>
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.map((sess) => (
          <div 
            key={sess.id}
            className="bg-[#111b21] border border-[#2a3942] hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-white">{sess.displayName}</h2>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#202c33] text-slate-300 border border-[#2a3942]">
                      {sess.channel}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-400 mt-0.5">{sess.phone}</div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  sess.status === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : sess.status === 'QRCODE'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sess.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{sess.status}</span>
                </span>
              </div>

              {/* Anti-Ban & Health Telemetry */}
              <div className="mt-4 p-3 bg-[#202c33] rounded-xl space-y-2 border border-[#2a3942]/60 text-xs">
                
                {/* Health Score */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Anti-Ban Health Score</span>
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">{sess.antiBanHealth}/100</span>
                  </div>
                  <div className="w-full bg-[#111b21] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${sess.antiBanHealth}%` }}
                    />
                  </div>
                </div>

                {/* Warmup Status */}
                <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-[#2a3942]">
                  <span>Warmup Protocol:</span>
                  <span className="text-white font-medium">Day {sess.warmupDay} of 14</span>
                </div>

                {/* Battery & Charging */}
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    {sess.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Device Battery:</span>
                  </span>
                  <span className="font-mono text-white">{sess.battery}% {sess.isCharging ? '(Charging)' : ''}</span>
                </div>

                {/* Proxy IP */}
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Isolated Proxy:</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{sess.proxyIp}</span>
                </div>

                {/* Messages sent today */}
                <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-[#2a3942]">
                  <span>Daily Quota Used:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{sess.messagesSentToday} / {sess.messagesLimitToday}</span>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2a3942] text-xs">
              <span className="text-[10px] text-slate-400">Engine: WPP {sess.wppVersion}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRestartSession(sess.id)}
                  title="Restart Chromium Session"
                  className="p-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 hover:text-white rounded-lg transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteSession(sess.id)}
                  title="Disconnect & Remove"
                  className="p-1.5 bg-[#202c33] hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* QR Code / Phone Pairing Modal */}
      {isPairModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2a3942] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Pair WhatsApp Account</h2>
              </div>
              <button
                onClick={() => setIsPairModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Mode Tabs */}
              <div className="flex bg-[#202c33] p-1 rounded-xl border border-[#2a3942]">
                <button
                  onClick={() => setPairingMode('qr')}
                  className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition-all ${
                    pairingMode === 'qr' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scan QR Code
                </button>
                <button
                  onClick={() => setPairingMode('code')}
                  className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition-all ${
                    pairingMode === 'code' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Link with Phone Code
                </button>
              </div>

              {pairingMode === 'qr' ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  
                  {/* Dynamic QR Code Box */}
                  <div className="relative p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/20">
                    <svg viewBox="0 0 100 100" className="w-48 h-48">
                      {/* Stylized simulated QR pattern */}
                      <rect width="100" height="100" fill="white" />
                      {/* Top-left position marker */}
                      <rect x="10" y="10" width="25" height="25" fill="#111b21" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#111b21" />
                      {/* Top-right position marker */}
                      <rect x="65" y="10" width="25" height="25" fill="#111b21" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#111b21" />
                      {/* Bottom-left position marker */}
                      <rect x="10" y="65" width="25" height="25" fill="#111b21" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#111b21" />
                      {/* QR Data Dots */}
                      <rect x="42" y="12" width="6" height="6" fill="#111b21" />
                      <rect x="52" y="18" width="6" height="6" fill="#111b21" />
                      <rect x="42" y="30" width="12" height="6" fill="#111b21" />
                      <rect x="12" y="44" width="8" height="6" fill="#111b21" />
                      <rect x="25" y="48" width="12" height="8" fill="#111b21" />
                      <rect x="44" y="44" width="12" height="12" fill="#25D366" />
                      <rect x="62" y="44" width="8" height="8" fill="#111b21" />
                      <rect x="78" y="44" width="12" height="6" fill="#111b21" />
                      <rect x="42" y="62" width="8" height="14" fill="#111b21" />
                      <rect x="56" y="66" width="14" height="6" fill="#111b21" />
                      <rect x="56" y="78" width="8" height="8" fill="#111b21" />
                      <rect x="70" y="72" width="18" height="14" fill="#111b21" />
                    </svg>

                    {isSimulatingPairing && (
                      <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-emerald-300">
                        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                        <span className="font-bold text-xs">Exchanging Session Keys...</span>
                      </div>
                    )}

                    {pairingSuccess && (
                      <div className="absolute inset-0 bg-emerald-900/90 rounded-2xl flex flex-col items-center justify-center text-white">
                        <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-1 animate-bounce" />
                        <span className="font-bold text-sm">Session Paired!</span>
                      </div>
                    )}
                  </div>

                  {/* Auto-Refresh Countdown */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                    <span>QR Code refreshes in <span className="text-white font-mono font-bold">{countdown}s</span></span>
                  </div>

                  {/* 3 Step Instructions */}
                  <div className="bg-[#202c33] p-3 rounded-xl w-full space-y-1 text-slate-300 text-[11px]">
                    <div className="font-semibold text-white text-xs mb-1">To Link WhatsApp Web:</div>
                    <div>1. Open <strong>WhatsApp</strong> on your phone</div>
                    <div>2. Tap <strong>Settings</strong> &gt; <strong>Linked Devices</strong></div>
                    <div>3. Tap <strong>Link a Device</strong> and point camera at screen</div>
                  </div>

                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <p className="text-slate-300 text-[11px]">
                    Enter your phone number to receive an 8-character verification code directly in WhatsApp:
                  </p>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">WhatsApp Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-8833"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="p-3 bg-[#202c33] rounded-xl border border-[#2a3942] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">One-Time Pairing Code</div>
                      <div className="text-lg font-mono font-black text-emerald-400 tracking-wider mt-0.5">
                        {pairingCode}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 bg-[#111b21] hover:bg-[#2a3942] text-slate-300 rounded-lg transition-all"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Session Details Form */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#2a3942]">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium text-[11px]">Session Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Dispatch"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium text-[11px]">Channel Route</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="sales">Sales Line</option>
                    <option value="support">Customer Support</option>
                    <option value="vip">VIP Concierge</option>
                    <option value="general">Warehouse Ops</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsPairModalOpen(false)}
                  className="px-3.5 py-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-xl"
                >
                  Cancel
                </button>

                {/* Instant Simulator Button */}
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isSimulatingPairing || pairingSuccess}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all shadow-md shadow-emerald-900/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSimulatingPairing ? 'Pairing...' : 'Simulate Instant Pairing'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
