import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarCheck, Check, Link2, MessageCircle, Send, Sparkles, Users2, X } from "lucide-react";
import { APP_GUIDE, HOMES_GUIDE, type GuideStep } from "./guideSteps";

// Riwo's welcome guide: shown once to each person, over the product, so they get a taste of it rather than a manual. One idea per
// step, Riwo floats and speaks, and a small picture shows the thing. Two versions: Scriwo, and Scriwo Homes (homes.scriwo.com).
// Skipping is always one tap; the keyboard works (arrows, Escape); people who prefer less motion get a still Riwo.

const ICONS: Record<GuideStep["scene"], typeof Sparkles> = {
  hello: Sparkles,
  connect: Link2,
  chat: MessageCircle,
  ai: Sparkles,
  team: Users2,
  leads: MessageCircle,
  homes: Building2,
  viewings: CalendarCheck,
  go: Send,
};

// A small drawn picture for each step: a few chat bubbles or tiles in the brand colours.
function Scene({ kind }: { kind: GuideStep["scene"] }) {
  const Icon = ICONS[kind];
  const bubble = "rounded-2xl px-3 py-2 text-[12.5px] leading-snug shadow-sm";
  return (
    <div className="relative h-28 rounded-3xl bg-gradient-to-br from-brand/10 via-surface-2 to-gold/10 ring-1 ring-line overflow-hidden grid place-items-center" aria-hidden>
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gold/20 blur-2xl" style={{ animation: "riwo-glow 4s ease-in-out infinite" }} />
      {kind === "chat" || kind === "leads" ? (
        <div className="w-4/5 space-y-1.5">
          <div className={`${bubble} bg-bubble-in w-[70%]`} style={{ animation: "riwo-pop .5s var(--ease-out) both" }}>
            {kind === "leads" ? "2 bed, Marina, around 1.8M" : "Do you have this in blue?"}
          </div>
          <div className={`${bubble} bg-bubble-out ml-auto w-[78%]`} style={{ animation: "riwo-pop .5s .35s var(--ease-out) both" }}>
            {kind === "leads" ? "Buy or rent, and when do you move?" : "Yes! Sending the details now."}
          </div>
        </div>
      ) : kind === "connect" ? (
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-surface ring-1 ring-line grid grid-cols-3 gap-1 p-2">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={`rounded-[2px] ${[0, 2, 4, 6, 8, 3].includes(i) ? "bg-fg" : "bg-surface-3"}`} />
            ))}
          </div>
          <Link2 className="w-5 h-5 text-gold" />
          <div className="h-16 w-10 rounded-xl bg-surface ring-1 ring-line grid place-items-center">
            <Check className="w-5 h-5 text-ok" style={{ animation: "riwo-pop .6s .5s var(--ease-out) both" }} />
          </div>
        </div>
      ) : kind === "homes" ? (
        <div className="flex gap-2">
          {["Marina 2BR", "Downtown 1BR", "Palm Villa"].map((n, i) => (
            <div key={n} className="rounded-2xl bg-surface ring-1 ring-line px-3 py-2 text-[12px] font-medium" style={{ animation: `riwo-pop .5s ${i * 0.2}s var(--ease-out) both` }}>
              <Building2 className="w-4 h-4 text-brand mb-1" />
              {n}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-16 w-16 rounded-3xl bg-surface ring-1 ring-line grid place-items-center text-brand" style={{ animation: "riwo-pop .6s var(--ease-out) both" }}>
          <Icon className="w-7 h-7" />
        </div>
      )}
    </div>
  );
}

export function WelcomeGuide({
  variant = "app",
  name,
  manager = true,
  onDone,
}: {
  variant?: "app" | "homes";
  /** the person's first name, used once in the greeting */
  name?: string;
  /** owners and administrators see every step; teammates are not shown what only managers can do */
  manager?: boolean;
  /** called when the guide ends, finished or skipped; the app records that it has been seen */
  onDone: () => void;
}) {
  const steps = (variant === "homes" ? HOMES_GUIDE : APP_GUIDE).filter((s) => manager || !s.managerOnly);
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;
  const primary = useRef<HTMLButtonElement>(null);
  const first = (name || "").trim().split(/\s+/)[0];

  useEffect(() => {
    primary.current?.focus();
  }, [i]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      else if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onDone, steps.length]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center bg-black/55 backdrop-blur-sm p-0 sm:p-6" style={{ animation: "fade .25s ease-out both" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="guide-title" className="relative w-full sm:max-w-[460px] max-h-dvh overflow-y-auto rounded-t-[32px] sm:rounded-[32px] bg-surface shadow-pop ring-1 ring-line p-6 pt-14 pb-7" style={{ animation: "rise .4s var(--ease-out) both" }}>
        <button type="button" onClick={onDone} aria-label="Skip the guide" className="absolute z-10 top-3 right-3 h-10 px-3.5 rounded-full text-[13px] text-fg-3 hover:text-fg hover:bg-surface-2 inline-flex items-center gap-1">
          Skip <X className="w-3.5 h-3.5" aria-hidden />
        </button>

        <div className="flex items-end gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-2 rounded-full bg-gold/25 blur-xl" style={{ animation: "riwo-glow 4s ease-in-out infinite" }} aria-hidden />
            <img
              key={i === 0 || last ? "wave" : "still"}
              src={i === 0 || last ? "/brand/riwo-wave.webp" : "/brand/riwo.webp"}
              alt="Riwo, your assistant"
              width={112}
              height={112}
              className="relative h-28 w-28 rounded-[28px] object-cover select-none shadow-card"
              style={{ animation: "riwo-float 5s ease-in-out infinite" }}
              draggable={false}
            />
          </div>
          <div key={i} className="relative mb-3 flex-1 rounded-2xl rounded-bl-md bg-bubble-out px-4 py-3 text-[14px] leading-relaxed" style={{ animation: "riwo-pop .45s var(--ease-out) both" }}>
            {i === 0 && first ? <b>Hi {first}. </b> : null}
            {step.say}
          </div>
        </div>

        <h2 id="guide-title" className="mt-5 text-[19px] font-semibold tracking-tight">
          {step.title}
        </h2>
        <p className="text-[12.5px] text-gold font-medium mt-0.5">{step.where}</p>
        <div className="mt-4" key={`scene-${i}`}>
          <Scene kind={step.scene} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <ol className="flex items-center gap-1.5" aria-label={`Step ${i + 1} of ${steps.length}`}>
            {steps.map((s, n) => (
              <li key={s.title}>
                <button type="button" onClick={() => setI(n)} aria-label={`Go to step ${n + 1}`} aria-current={n === i ? "step" : undefined} className={`block h-2 rounded-full transition-all ${n === i ? "w-6 bg-brand-solid" : "w-2 bg-surface-3 hover:bg-fg-3"}`} />
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} aria-label="Back" className="h-11 w-11 rounded-full bg-surface-2 text-fg-2 hover:text-fg grid place-items-center">
                <ArrowLeft className="w-4 h-4" aria-hidden />
              </button>
            )}
            <button ref={primary} type="button" onClick={() => (last ? onDone() : setI(i + 1))} className="h-11 px-5 rounded-full bg-brand-solid text-white text-[14.5px] font-semibold inline-flex items-center gap-2 hover:bg-brand-hover transition-colors">
              {last ? "Start using Scriwo" : "Next"}
              {last ? <Check className="w-4 h-4" aria-hidden /> : <ArrowRight className="w-4 h-4" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
