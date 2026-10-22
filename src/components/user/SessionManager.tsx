import React, { useState, useEffect, useRef } from "react";
import {
  Battery,
  BatteryCharging,
  RefreshCw,
  QrCode,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Smartphone,
} from "lucide-react";
import confetti from "canvas-confetti";
import { WhatsAppSession } from "../../types";
import {
  startLiveSession,
  getLiveSessionQr,
  getLiveSessionStatus,
} from "../../services/api";
import { getSocket } from "../../services/socket";
import { friendlyPairingError } from "../../utils/pairingError";
import { EmptyState, Field, Page, PageHeader, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { Sheet } from "../ui/Sheet";

interface SessionManagerProps {
  sessions: WhatsAppSession[];
  onAddSession: (
    name: string,
    phone: string,
    channel: "sales" | "support" | "vip" | "general",
  ) => void;
  onRestartSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isPairModalOpen: boolean;
  setIsPairModalOpen: (open: boolean) => void;
  canManage?: boolean;
}

const STATUS_UI = (
  status: string,
): { tone: "ok" | "warn" | "danger" | "neutral"; label: string } =>
  status === "CONNECTED"
    ? { tone: "ok", label: "Connected" }
    : status === "QRCODE"
      ? { tone: "warn", label: "Waiting for scan" }
      : status === "STARTING"
        ? { tone: "warn", label: "Starting" }
        : { tone: "danger", label: "Disconnected" };

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  onAddSession,
  onRestartSession,
  onDeleteSession,
  isPairModalOpen,
  setIsPairModalOpen,
  canManage = false,
}) => {
  const ownsSession = !canManage && sessions.length > 0;
  const [sessionName, setSessionName] = useState("Primary WhatsApp");
  const [channel, setChannel] = useState<
    "sales" | "support" | "vip" | "general"
  >("sales");

  type PairingPhase = "idle" | "starting" | "qr" | "connected" | "error";
  const [pairingPhase, setPairingPhase] = useState<PairingPhase>("idle");
  const [liveQrImage, setLiveQrImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

  const activeSessionKey = useRef<string | null>(null);
  const pollTimerRef = useRef<any>(null);
  const startingAttemptsRef = useRef(0);
  // Track whether QR is currently visible — used to suppress stale FAILED events
  const qrVisibleRef = useRef(false);
  const MAX_STARTING_ATTEMPTS = 120; // 180s

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // ── Socket: real-time QR and status ──────────────────────────────────────
  useEffect(() => {
    if (!isPairModalOpen) return;
    const sock = getSocket();

    const onQr = ({ session, qrcode }: any) => {
      if (session !== activeSessionKey.current || !qrcode) return;
      console.log("⚡ QR via socket:", session);
      setLiveQrImage(qrcode);
      qrVisibleRef.current = true;
      setPairingPhase("qr");
      setStatusMessage("Scan this code with WhatsApp on your phone");
    };

    const onStatus = ({ session, status, phone }: any) => {
      if (session !== activeSessionKey.current) return;
      console.log("⚡ Status via socket:", status, "for", session);

      // Connected
      if (status === "CONNECTED") {
        stopPolling();
        qrVisibleRef.current = false;
        setPairingPhase("connected");
        setConnectedPhone(phone || "WhatsApp Connected");
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
        setTimeout(() => {
          onAddSession(
            sessionName || session,
            phone || "+WhatsApp Connected",
            channel,
          );
          setIsPairModalOpen(false);
          setPairingPhase("idle");
        }, 1800);
        return;
      }

      // QR coming — switch to QR phase
      if (
        status === "QRCODE" ||
        status === "notLogged" ||
        status === "disconnectedMobile"
      ) {
        setPairingPhase((prev) =>
          prev === "starting" || prev === "qr" ? "qr" : prev,
        );
        setStatusMessage("Scan this code with WhatsApp on your phone");
        return;
      }

      // EXPIRED = QR timed out without scan — retryable
      if (status === "EXPIRED" || status === "autocloseCalled") {
        stopPolling();
        qrVisibleRef.current = false;
        setPairingPhase("error");
        setErrorMessage(
          "QR code expired — not scanned in time. Click Try Again for a new QR.",
        );
        return;
      }

      // FAILED = true crash — but ONLY show error if QR is NOT currently visible
      // (a stale FAILED from a previous attempt can arrive after a new session starts)
      if (status === "FAILED" || status === "browserClose") {
        if (qrVisibleRef.current) {
          // QR is on screen — this is a stale event, ignore it
          console.log("⚡ Ignoring stale FAILED — QR is currently visible");
          return;
        }
        stopPolling();
        setPairingPhase("error");
        // Keep a more specific message (e.g. "QR not scanned in time") if one
        // is already showing; otherwise ask the server for the real cause.
        setErrorMessage(
          (prev) => prev || "Session failed to start. Please try again.",
        );
        getLiveSessionStatus(session)
          .then((res) => res?.error && setErrorMessage(res.error))
          .catch(() => {});
        return;
      }

      // All other intermediate statuses — ignore, let polling handle it
    };

    sock.on("session:qr", onQr);
    sock.on("session:status", onStatus);
    return () => {
      sock.off("session:qr", onQr);
      sock.off("session:status", onStatus);
    };
  }, [isPairModalOpen, sessionName, channel, onAddSession, setIsPairModalOpen]);

  useEffect(() => {
    if (isPairModalOpen) {
      setPairingPhase("idle");
      setLiveQrImage(null);
      setErrorMessage(null);
      setStatusMessage("");
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
    const rawKey = sessionName.trim() || "whatsapp-line";
    let cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, "-");

    activeSessionKey.current = cleanKey;
    startingAttemptsRef.current = 0;
    qrVisibleRef.current = false;
    stopPolling();
    setPairingPhase("starting");
    setLiveQrImage(null);
    setErrorMessage(null);
    setStatusMessage("Preparing a secure connection…");

    try {
      // Staff always pair their own session; the server decides its name.
      const started = await startLiveSession(cleanKey);
      cleanKey = started?.sessionName || cleanKey;
      activeSessionKey.current = cleanKey;
      setStatusMessage("Connecting to WhatsApp…");

      pollTimerRef.current = setInterval(async () => {
        try {
          const qrRes = await getLiveSessionQr(cleanKey);
          if (qrRes?.qrcode) {
            setLiveQrImage(qrRes.qrcode);
            qrVisibleRef.current = true;
            setPairingPhase((prev) =>
              prev === "starting" || prev === "qr" ? "qr" : prev,
            );
            setStatusMessage("Scan this code with WhatsApp on your phone");
          }

          const statusRes = await getLiveSessionStatus(cleanKey);
          const s = statusRes?.sessionStatus;

          if (s === "CONNECTED") {
            stopPolling();
            qrVisibleRef.current = false;
            setPairingPhase("connected");
            setConnectedPhone(statusRes.phone || "WhatsApp Connected");
            confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
            setTimeout(() => {
              onAddSession(
                sessionName || cleanKey,
                statusRes.phone || "+WhatsApp Connected",
                channel,
              );
              setIsPairModalOpen(false);
              setPairingPhase("idle");
            }, 1800);
            return;
          }

          // EXPIRED = QR timed out — retryable
          if (s === "EXPIRED") {
            stopPolling();
            qrVisibleRef.current = false;
            setPairingPhase("error");
            setErrorMessage(
              statusRes.error ||
                "QR code expired — click Try Again for a new one.",
            );
            return;
          }

          if (s === "FAILED") {
            stopPolling();
            qrVisibleRef.current = false;
            setPairingPhase("error");
            setErrorMessage(
              statusRes.error || "Session failed to start. Please try again.",
            );
            return;
          }

          // Only bump timeout counter while still in starting phase (before QR appears)
          setPairingPhase((current) => {
            if (current === "starting") {
              startingAttemptsRef.current += 1;
              if (startingAttemptsRef.current >= MAX_STARTING_ATTEMPTS) {
                stopPolling();
                setErrorMessage("Starting took too long. Please try again.");
                return "error";
              }
              if (startingAttemptsRef.current === 10)
                setStatusMessage("Still preparing…");
              if (startingAttemptsRef.current === 25)
                setStatusMessage(
                  "Almost there. The first connection can take up to a minute.",
                );
              if (startingAttemptsRef.current === 60)
                setStatusMessage("Still working. Thanks for your patience.");
            }
            return current;
          });
        } catch (e: any) {
          console.warn("Poll error:", e.message);
        }
      }, 1500);
    } catch (err: any) {
      stopPolling();
      setPairingPhase("error");
      setErrorMessage(err.message || "Failed to initialize session.");
    }
  };

  const handleCloseModal = () => {
    stopPolling();
    activeSessionKey.current = null;
    setIsPairModalOpen(false);
  };

  const pairing = pairingPhase;
  return (
    <Page>
      <PageHeader
        eyebrow="Numbers"
        title="WhatsApp numbers"
        subtitle={
          canManage
            ? "Every teammate’s WhatsApp number in your company is listed here."
            : "Your WhatsApp number is linked to your login. Only you and your company’s administrators can see it."
        }
        actions={
          <button
            onClick={() => setIsPairModalOpen(true)}
            className={btn("primary")}
          >
            <Plus className="w-4 h-4" />
            {canManage
              ? "Connect a number"
              : ownsSession
                ? "Reconnect my WhatsApp"
                : "Connect my WhatsApp"}
          </button>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<QrCode className="w-6 h-6" />}
          title="No numbers connected yet"
          body="Link a phone to see its conversations here, reply as a team, and send broadcasts."
          action={
            <button
              onClick={() => setIsPairModalOpen(true)}
              className={btn("primary")}
            >
              <Plus className="w-4 h-4" />
              {canManage ? "Connect your first number" : "Connect now"}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((sess) => {
            const ui = STATUS_UI(sess.status);
            return (
              <article key={sess.id} className="card p-6 flex flex-col">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="h-12 w-12 shrink-0 rounded-2xl bg-surface-2 grid place-items-center text-gold">
                    <Smartphone className="w-6 h-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[17px] font-semibold text-fg truncate">
                      {sess.displayName}
                    </h2>
                    <div className="text-[14px] text-fg-2 num truncate">
                      {sess.phone}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Pill tone={ui.tone} dot>
                    {ui.label}
                  </Pill>
                </div>

                <dl className="mt-5 space-y-2.5 text-[14px]">
                  {canManage && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-fg-3">Staff owner</dt>
                      <dd className="text-fg">
                        {sess.ownerName || "Unassigned"}
                      </dd>
                    </div>
                  )}
                  {sess.channel && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-fg-3">Channel</dt>
                      <dd className="text-fg capitalize">{sess.channel}</dd>
                    </div>
                  )}
                  {sess.battery != null && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-fg-3">Phone battery</dt>
                      <dd className="text-fg num inline-flex items-center gap-1.5">
                        {sess.isCharging ? (
                          <BatteryCharging className="w-4 h-4 text-ok" />
                        ) : (
                          <Battery className="w-4 h-4 text-fg-2" />
                        )}
                        {sess.battery}%
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                  <button
                    onClick={() => onRestartSession(sess.id)}
                    className={btn("secondary", "sm")}
                  >
                    <RefreshCw className="w-4 h-4" /> Reconnect
                  </button>
                  <button
                    aria-label="Remove session"
                    onClick={() => onDeleteSession(sess.id)}
                    className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-danger hover:bg-danger/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Sheet
        open={isPairModalOpen}
        onClose={handleCloseModal}
        title="Connect a WhatsApp number"
        subtitle="Link WhatsApp on your phone to Scriwo with a QR code."
        footer={
          pairing !== "connected" && (
            <button
              type="button"
              onClick={handleCloseModal}
              className={btn("ghost")}
            >
              Cancel
            </button>
          )
        }
      >
        <div className="text-[14.5px]">
          {pairing === "idle" && (
            <div className="space-y-5">
              {canManage && (
                <>
                  <Field label="Label">
                    <input
                      type="text"
                      placeholder="e.g. Sales desk, Support"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Channel">
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as any)}
                      className={inputCls}
                    >
                      <option value="sales">Sales</option>
                      <option value="support">Customer support</option>
                      <option value="vip">VIP concierge</option>
                      <option value="general">General</option>
                    </select>
                  </Field>
                </>
              )}
              <ol className="rounded-3xl bg-surface-2 p-5 space-y-3">
                {[
                  "Press the button below to show a QR code.",
                  "On your phone, open WhatsApp, then Settings, then Linked devices.",
                  "Tap Link a device and scan the code.",
                ].map((t, i) => (
                  <li key={t} className="flex gap-3 text-fg">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-surface text-gold text-[12px] font-semibold grid place-items-center">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{t}</span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={handleStartPairing}
                className={`${btn("primary")} w-full !h-12 text-[15px]`}
              >
                Show QR code
              </button>
            </div>
          )}

          {pairing === "starting" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-surface-2 grid place-items-center">
                <RefreshCw className="w-7 h-7 animate-spin text-gold" />
              </div>
              <h3 className="mt-5 text-[18px] font-semibold">
                Getting things ready
              </h3>
              <p className="mt-1.5 text-fg-2 max-w-xs">{statusMessage}</p>
              <p className="mt-3 text-[13px] text-fg-3">
                The first time can take 10 to 20 seconds.
              </p>
            </div>
          )}

          {pairing === "qr" && (
            <div className="flex flex-col items-center gap-5">
              <div className="p-4 bg-white rounded-3xl ring-4 ring-gold/40 shadow-pop">
                {liveQrImage ? (
                  <img
                    src={liveQrImage}
                    alt="Scan WhatsApp QR"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-neutral-500">
                    <RefreshCw className="w-7 h-7 animate-spin mb-2" />
                    <span className="text-[13px]">Preparing your code…</span>
                  </div>
                )}
              </div>
              <Pill tone="gold" dot>
                Waiting for you to scan
              </Pill>
              <ol className="w-full rounded-3xl bg-surface-2 p-5 space-y-3">
                {[
                  "Open WhatsApp on your phone",
                  "Go to Settings, then Linked devices",
                  "Tap Link a device and scan this code",
                ].map((t, i) => (
                  <li key={t} className="flex gap-3 items-center text-fg">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-surface text-gold text-[12px] font-semibold grid place-items-center">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {pairing === "connected" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-ok/10 grid place-items-center text-ok animate-rise">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="mt-5 text-[22px] font-semibold">
                You’re connected
              </h3>
              <p className="mt-1.5 text-fg-2 num">{connectedPhone}</p>
            </div>
          )}

          {pairing === "error" && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-danger/10 grid place-items-center text-danger">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="mt-5 text-[18px] font-semibold">
                That didn’t work
              </h3>
              <p className="mt-1.5 text-danger max-w-xs break-words">
                {friendlyPairingError(errorMessage)}
              </p>
              <button
                type="button"
                onClick={handleStartPairing}
                className={`${btn("secondary")} mt-6`}
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          )}
        </div>
      </Sheet>
    </Page>
  );
};
