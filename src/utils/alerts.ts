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

let audio: AudioContext | undefined;
let lastPing = 0;
export function playPing() {
  const now = Date.now();
  if (now - lastPing < 1500) return; // never a burst of sounds
  lastPing = now;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audio ||= new Ctx();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.25);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.27);
  } catch {
    /* autoplay rules can block this until the person has interacted */
  }
}

const baseTitle = typeof document !== "undefined" ? document.title : "";
export function setTitleBadge(count: number) {
  if (typeof document === "undefined") return;
  document.title =
    count > 0 ? `(${count > 99 ? "99+" : count}) ${baseTitle}` : baseTitle;
}
