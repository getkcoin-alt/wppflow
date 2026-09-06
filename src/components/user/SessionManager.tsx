import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, Battery, BatteryCharging, ShieldCheck, RefreshCw,
  QrCode, Plus, CheckCircle2, AlertCircle, Globe2, Trash2, Sparkles, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WhatsAppSession } from '../../types';
import { startLiveSession, deleteSession, getLiveSessionQr, getLiveSessionStatus } from '../../services/api';
import { getSocket } from '../../services/socket';

interface SessionManagerProps {
  sessions: WhatsAppSession[];
  onAddSession: (name: string, phone: string, channel: 'sales' | 'support' | 'vip' | 'general') => void;
  onRestartSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isPairModalOpen: boolean;
  setIsPairModalOpen: (open: boolean) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions, onAddSession, onRestartSession, onDeleteSession, isPairModalOpen, setIsPairModalOpen
}) => {
  const [sessionName, setSessionName] = useState('Primary WhatsApp');
  const [channel, setChannel] = useState<'sales' | 'support' | 'vip' | 'general'>('sales');

  type PairingPhase = 'idle' | 'starting' | 'qr' | 'connected' | 'error';
  const [pairingPhase, setPairingPhase] = useState<PairingPhase>('idle');
  const [liveQrImage, setLiveQrImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

  const activeSessionKey = useRef<string | null>(null);
  const pollTimerRef = useRef<any>(null);
  const startingAttemptsRef = useRef(0);
  // Track whether QR is currently visible — used to suppress stale FAILED events
  const qrVisibleRef = useRef(false);
  const MAX_STARTING_ATTEMPTS = 120; // 180s

  const stopPolling = () => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
  };

  // ── Socket: real-time QR and status ──────────────────────────────────────
  useEffect(() => {
    if (!isPairModalOpen) return;
    const sock = getSocket();

    const onQr = ({ session, qrcode }: any) => {
      if (session !== activeSessionKey.current || !qrcode) return;
      console.log('⚡ QR via socket:', session);
      setLiveQrImage(qrcode);
      qrVisibleRef.current = true;
      setPairingPhase('qr');
      setStatusMessage('Scan QR Code with WhatsApp on your phone');
    };

    const onStatus = ({ session, status, phone }: any) => {
      if (session !== activeSessionKey.current) return;
      console.log('⚡ Status via socket:', status, 'for', session);

      // Connected
      if (['CONNECTED', 'isLogged', 'inChat', 'qrReadSuccess', 'chatsAvailable'].includes(status)) {
        stopPolling();
        qrVisibleRef.current = false;
        setPairingPhase('connected');
        setConnectedPhone(phone || 'WhatsApp Connected');
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
        setTimeout(() => {
          onAddSession(sessionName || session, phone || '+WhatsApp Connected', channel);
          setIsPairModalOpen(false);
          setPairingPhase('idle');
        }, 1800);
        return;
      }

      // QR coming — switch to QR phase
      if (status === 'QRCODE' || status === 'notLogged' || status === 'disconnectedMobile') {
        setPairingPhase(prev => prev === 'starting' || prev === 'qr' ? 'qr' : prev);
        setStatusMessage('Scan QR Code with WhatsApp on your phone');
        return;
      }

      // EXPIRED = QR timed out without scan — retryable
      if (status === 'EXPIRED' || status === 'autocloseCalled') {
        stopPolling();
        qrVisibleRef.current = false;
        setPairingPhase('error');
        setErrorMessage('QR code expired — not scanned in time. Click Try Again for a new QR.');
        return;
      }

      // FAILED = true crash — but ONLY show error if QR is NOT currently visible
      // (a stale FAILED from a previous attempt can arrive after a new session starts)
      if (status === 'FAILED' || status === 'browserClose') {
        if (qrVisibleRef.current) {
          // QR is on screen — this is a stale event, ignore it
          console.log('⚡ Ignoring stale FAILED — QR is currently visible');
          return;
        }
        stopPolling();
        setPairingPhase('error');
        setErrorMessage('Session failed to start. Please try again.');
        return;
      }

      // All other intermediate statuses — ignore, let polling handle it
    };

    sock.on('session:qr', onQr);
    sock.on('session:status', onStatus);
    return () => { sock.off('session:qr', onQr); sock.off('session:status', onStatus); };
  }, [isPairModalOpen, sessionName, channel]);

  useEffect(() => {
    if (isPairModalOpen) {
      setPairingPhase('idle');
      setLiveQrImage(null);
      setErrorMessage(null);
      setStatusMessage('');
      setConnectedPhone(null);
      activeSessionKey.current = null;
      startingAttemptsRef.current = 0;
      qrVisibleRef.current = false;
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isPairModalOpen]);

  const handleStartPairing = async () => {
    const rawKey = sessionName.trim() || 'whatsapp-line';
    const cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '-');

    activeSessionKey.current = cleanKey;
    startingAttemptsRef.current = 0;
    qrVisibleRef.current = false;
    stopPolling();
    setPairingPhase('starting');
    setLiveQrImage(null);
    setErrorMessage(null);
    setStatusMessage('Booting isolated browser kernel...');

    try {
      await deleteSession(cleanKey);  // clear any stale FAILED session
      await startLiveSession(cleanKey);
      setStatusMessage('Browser launched. Initializing WhatsApp Web...');

      pollTimerRef.current = setInterval(async () => {
        try {
          const qrRes = await getLiveSessionQr(cleanKey);
          if (qrRes?.qrcode) {
            setLiveQrImage(qrRes.qrcode);
            qrVisibleRef.current = true;
            setPairingPhase(prev => (prev === 'starting' || prev === 'qr') ? 'qr' : prev);
            setStatusMessage('Scan QR Code with WhatsApp on your phone');
          }

          const statusRes = await getLiveSessionStatus(cleanKey);
          const s = statusRes?.sessionStatus;

          if (['CONNECTED', 'isLogged', 'inChat', 'chatsAvailable'].includes(s)) {
            stopPolling();
            qrVisibleRef.current = false;
            setPairingPhase('connected');
            setConnectedPhone(statusRes.phone || 'WhatsApp Connected');
            confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
            setTimeout(() => {
              onAddSession(sessionName || cleanKey, statusRes.phone || '+WhatsApp Connected', channel);
              setIsPairModalOpen(false);
              setPairingPhase('idle');
            }, 1800);
            return;
          }

          // EXPIRED = QR timed out — retryable
          if (s === 'EXPIRED') {
            stopPolling();
            qrVisibleRef.current = false;
            setPairingPhase('error');
            setErrorMessage('QR code expired — click Try Again for a new one.');
            return;
          }

          // Only bump timeout counter while still in starting phase (before QR appears)
          setPairingPhase(current => {
            if (current === 'starting') {
              startingAttemptsRef.current += 1;
              if (startingAttemptsRef.current >= MAX_STARTING_ATTEMPTS) {
                stopPolling();
                setErrorMessage('Browser startup timed out. Please try again.');
                return 'error';
              }
              if (startingAttemptsRef.current === 10) setStatusMessage('Chromium initializing...');
              if (startingAttemptsRef.current === 25) setStatusMessage('Loading WhatsApp Web... (up to 60s on cold start)');
              if (startingAttemptsRef.current === 60) setStatusMessage('Still starting — Railway cold boot in progress...');
            }
            return current;
          });

        } catch (e: any) { console.warn('Poll error:', e.message); }
      }, 1500);

    } catch (err: any) {
      stopPolling();
      setPairingPhase('error');
      setErrorMessage(err.message || 'Failed to initialize session.');
    }
  };

  const handleCloseModal = () => { stopPolling(); activeSessionKey.current = null; setIsPairModalOpen(false); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Smartphone className="w-5 h-5" /></span>
            <h1 className="text-xl font-bold text-white tracking-tight">WhatsApp Multi-Session Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Pair and orchestrate multiple WhatsApp accounts with automated anti-ban warming and persistent session storage.</p>
        </div>
        <button onClick={() => setIsPairModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all">
          <Plus className="w-4 h-4" /><span>Pair WhatsApp Account</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-[#111b21] border border-[#2a3942] rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4"><QrCode className="w-8 h-8" /></div>
          <h3 className="text-lg font-bold text-white mb-2">No WhatsApp Accounts Paired Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">Link your phone to activate real-time inbox, automated responses, and broadcast campaigns.</p>
          <button onClick={() => setIsPairModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all">
            <Plus className="w-4 h-4" /><span>Pair First WhatsApp Number</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((sess) => (
            <div key={sess.id} className="bg-[#111b21] border border-[#2a3942] hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-white">{sess.displayName}</h2>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#202c33] text-slate-300 border border-[#2a3942]">{sess.channel}</span>
                    </div>
                    <div className="font-mono text-xs text-slate-400 mt-0.5">{sess.phone}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${sess.status === 'CONNECTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : sess.status === 'QRCODE' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sess.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{sess.status}</span>
                  </span>
                </div>
                <div className="mt-4 p-3 bg-[#202c33] rounded-xl space-y-2 border border-[#2a3942]/60 text-xs">
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-300 font-medium flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>Anti-Ban Health</span></span>
                      <span className="text-emerald-400 font-mono font-bold">{sess.antiBanHealth}/100</span>
                    </div>
                    <div className="w-full bg-[#111b21] h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sess.antiBanHealth}%` }} /></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-[#2a3942]"><span>Warmup:</span><span className="text-white font-medium">Day {sess.warmupDay} of 14</span></div>
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">{sess.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-slate-400" />}<span>Battery:</span></span>
                    <span className="font-mono text-white">{sess.battery}%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-300"><span className="flex items-center gap-1"><Globe2 className="w-3.5 h-3.5 text-indigo-400" /><span>Proxy:</span></span><span className="font-mono text-slate-400 text-[10px]">{sess.proxyIp}</span></div>
                  <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-[#2a3942]"><span>Daily Quota:</span><span className="font-mono text-emerald-400 font-semibold">{sess.messagesSentToday} / {sess.messagesLimitToday}</span></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#2a3942] text-xs">
                <span className="text-[10px] text-slate-400">Active Engine</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onRestartSession(sess.id)} className="p-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 hover:text-white rounded-lg transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDeleteSession(sess.id)} className="p-1.5 bg-[#202c33] hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPairModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111b21] border border-[#2a3942] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2a3942] flex items-center justify-between bg-gradient-to-b from-[#182229] to-[#111b21]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><QrCode className="w-5 h-5" /></div>
                <div><h2 className="text-base font-bold text-white tracking-tight">Pair WhatsApp Account</h2><p className="text-[11px] text-slate-400">Scan QR code using WhatsApp on your phone</p></div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#202c33] transition-all">✕</button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {pairingPhase === 'idle' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-medium">Session Label</label>
                    <input type="text" placeholder="e.g. Sales Dispatch, Support Desk" value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-medium">Channel</label>
                    <select value={channel} onChange={(e) => setChannel(e.target.value as any)} className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs">
                      <option value="sales">Sales Line</option>
                      <option value="support">Customer Support</option>
                      <option value="vip">VIP Concierge</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="bg-[#202c33]/70 border border-[#2a3942] p-3.5 rounded-2xl space-y-2">
                    <div className="font-semibold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /><span>How Cloud Pairing Works:</span></div>
                    <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                      <li>Launches a secure browser instance in the cloud</li>
                      <li>Generates an official WhatsApp Web QR code</li>
                      <li>Session tokens are persisted to your Railway volume</li>
                    </ul>
                  </div>
                  <button type="button" onClick={handleStartPairing} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all">
                    <span>Generate WhatsApp QR Code</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {pairingPhase === 'starting' && (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-emerald-400" /></div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Launching Browser Instance</h3>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{statusMessage}</p>
                    <p className="text-[10px] text-slate-500 mt-2">First launch takes ~15–30s on Railway</p>
                  </div>
                </div>
              )}

              {pairingPhase === 'qr' && (
                <div className="flex flex-col items-center space-y-4 py-1">
                  <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/30">
                    {liveQrImage
                      ? <img src={liveQrImage} alt="Scan WhatsApp QR" className="w-56 h-56 object-contain" />
                      : <div className="w-56 h-56 flex flex-col items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" /><span className="text-xs text-slate-500">Rendering QR...</span></div>
                    }
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-800/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Awaiting scan… Session: {sessionName}</span>
                  </div>
                  <div className="bg-[#202c33] p-3.5 rounded-2xl w-full space-y-1.5 text-[11px] border border-[#2a3942]">
                    <div className="font-semibold text-white text-xs mb-1">To Link WhatsApp:</div>
                    {[['1','Open WhatsApp on your phone'],['2','Settings → Linked Devices'],['3','Link a Device → scan this QR']].map(([n,t]) => (
                      <div key={n} className="flex items-center gap-2 text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] flex items-center justify-center font-bold shrink-0">{n}</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pairingPhase === 'connected' && (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce"><CheckCircle2 className="w-9 h-9" /></div>
                  <div>
                    <h3 className="font-bold text-white text-base">WhatsApp Paired!</h3>
                    <p className="text-xs text-emerald-400 font-mono mt-1 font-semibold">{connectedPhone}</p>
                  </div>
                </div>
              )}

              {pairingPhase === 'error' && (
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400"><AlertCircle className="w-7 h-7" /></div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Pairing Interrupted</h3>
                    <p className="text-[11px] text-rose-300 mt-1 max-w-xs">{errorMessage}</p>
                  </div>
                  <button type="button" onClick={handleStartPairing} className="flex items-center gap-2 px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-white rounded-xl text-xs font-semibold border border-[#2a3942] mt-2">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /><span>Try Again</span>
                  </button>
                </div>
              )}

              {pairingPhase !== 'connected' && (
                <div className="flex justify-end pt-2 border-t border-[#2a3942]">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
