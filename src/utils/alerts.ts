// Small, dependency-free helpers for attention: desktop notifications, a soft ping, and the
// unread count in the browser tab title. Everything fails quietly where unsupported.

const supported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const desktopPermission = ():
  | "granted"
  | "denied"
  | "default"
  | "unsupported" => (supported() ? Notification.permission : "unsupported");

export async function requestDesktopPermission() {
  if (!supported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showDesktopNotification(
  title: string,
  body: string,
  onClick?: () => void,
) {
  if (!supported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, tag: title + body });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
  } catch {
    /* some mobile browsers only allow service-worker notifications */
  }
}

let audioCtx: AudioContext | undefined;
let lastPing = 0;

function getAudioContext(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return undefined;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

export function playPing() {
  const now = Date.now();
  if (now - lastPing < 800) return; // avoid noisy bursts
  lastPing = now;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    // First chime: 587.33 Hz (D5)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(587.33, t);
    g1.gain.setValueAtTime(0.0001, t);
    g1.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o1.connect(g1).connect(ctx.destination);
    o1.start(t);
    o1.stop(t + 0.18);

    // Second chime: 880.00 Hz (A5)
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(880, t + 0.09);
    g2.gain.setValueAtTime(0.0001, t + 0.09);
    g2.gain.exponentialRampToValueAtTime(0.22, t + 0.11);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o2.connect(g2).connect(ctx.destination);
    o2.start(t + 0.09);
    o2.stop(t + 0.40);
  } catch {
    /* autoplay rules or device audio unavailable */
  }
}

const baseTitle = typeof document !== "undefined" ? document.title : "";
export function setTitleBadge(count: number) {
  if (typeof document === "undefined") return;
  document.title =
    count > 0 ? `(${count > 99 ? "99+" : count}) ${baseTitle}` : baseTitle;
}
