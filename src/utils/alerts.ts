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
  if (now - lastPing < 600) return; // avoid noisy bursts
  lastPing = now;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    // Master bus with gentle lowpass filter (removes digital harshness above 3600Hz)
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.setValueAtTime(3600, t);
    masterFilter.Q.setValueAtTime(0.7, t);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, t);

    masterFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Helper: plays a bell chime note with natural attack and harmonic resonance
    const playChime = (
      startTime: number,
      freq: number,
      duration: number,
      peakGain: number,
      withHarmonic = true,
    ) => {
      // Fundamental oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Snappy physical attack (3ms), exponential decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterFilter);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);

      // Warm acoustic overtone (subtle 5th harmonic for air & sparkle)
      if (withHarmonic) {
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harm.type = "sine";
        harm.frequency.setValueAtTime(freq * 1.5, startTime);

        harmGain.gain.setValueAtTime(0.0001, startTime);
        harmGain.gain.exponentialRampToValueAtTime(
          peakGain * 0.22,
          startTime + 0.003,
        );
        harmGain.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + duration * 0.75,
        );

        harm.connect(harmGain);
        harmGain.connect(masterFilter);

        harm.start(startTime);
        harm.stop(startTime + duration + 0.02);
      }
    };

    // 1. Tactile acoustic droplet click (transient micro-pop)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "sine";
    clickOsc.frequency.setValueAtTime(1150, t);
    clickOsc.frequency.exponentialRampToValueAtTime(520, t + 0.018);

    clickGain.gain.setValueAtTime(0.0001, t);
    clickGain.gain.exponentialRampToValueAtTime(0.12, t + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

    clickOsc.connect(clickGain);
    clickGain.connect(masterFilter);

    clickOsc.start(t);
    clickOsc.stop(t + 0.025);

    // 2. Note 1: F#5 (739.99 Hz)
    playChime(t, 739.99, 0.16, 0.22, false);

    // 3. Note 2: B5 (987.77 Hz)
    playChime(t + 0.065, 987.77, 0.20, 0.26, true);

    // 4. Note 3: D#6 (1244.51 Hz) + shimmer
    playChime(t + 0.13, 1244.51, 0.32, 0.3, true);
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
