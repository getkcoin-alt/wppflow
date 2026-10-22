import { useEffect, useRef, useState } from "react";
import { Check, Copy, Languages, Loader2, NotebookPen, RotateCcw, X } from "lucide-react";
import {
  LANGUAGES,
  STYLES,
  TONES,
  preferredLanguage,
  realAiClient,
  rememberLanguage,
  type AiClient,
} from "../../services/ai";
import type { Request, Riwo } from "../../hooks/useRiwo";

// Riwo is the assistant inside the inbox. It writes a first draft for a person to read, change and send;
// nothing it writes goes to a customer by itself.

export function RiwoAvatar({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/riwo-avatar.webp"
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover bg-surface-2 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

const chip =
  "h-8 px-3 rounded-full text-[13px] font-medium bg-surface-2 text-fg hover:bg-brand/10 hover:text-brand disabled:opacity-40 disabled:hover:bg-surface-2 disabled:hover:text-fg transition-colors";

// The "Ask Riwo" button in the composer, and the menu it opens.
export function RiwoButton({ riwo, locked = false }: { riwo: Riwo; locked?: boolean }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(preferredLanguage);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const start = (request: Request) => {
    setOpen(false);
    riwo.run(request);
  };
  if (locked)
    return (
      <span
        title="Riwo, the AI assistant, is part of the Growth plan and above."
        className="text-[12.5px] font-medium text-fg-3 flex items-center gap-1.5 px-2 h-7 rounded-full cursor-help whitespace-nowrap"
      >
        <RiwoAvatar size={18} className="opacity-60" />
        <span>Riwo · Growth plan</span>
      </span>
    );

  // The menu opens above the composer, anchored to the composer's own edge (the nearest positioned
  // ancestor) rather than to this button, so it stays on screen on a phone.
  return (
    <div ref={box}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Ask Riwo"
        onClick={() => setOpen(!open)}
        className="text-[12.5px] font-medium text-fg-2 hover:text-fg flex items-center gap-1.5 px-2 h-7 rounded-full hover:bg-surface-2 transition whitespace-nowrap"
      >
        <RiwoAvatar size={18} />
        <span className="sm:hidden">Riwo</span>
        <span className="hidden sm:inline">Ask Riwo</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Ask Riwo"
          className="absolute right-3 sm:right-6 bottom-full mb-1 z-30 w-[min(calc(100vw-1.5rem),21rem)] max-h-[70vh] overflow-y-auto rounded-3xl bg-surface border border-line shadow-card p-4 space-y-4 animate-rise"
        >
          <div className="flex items-center gap-3">
            <RiwoAvatar size={36} />
            <p className="text-[13px] leading-snug text-fg-2">
              Riwo writes the first draft. You read and edit it before anything is sent.
            </p>
          </div>

          <section>
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-fg-3 mb-2">Reply to the customer</h3>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button key={t.key} type="button" className={chip} onClick={() => start({ kind: "reply", tone: t.key })}>
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-fg-3 mb-2">Your draft</h3>
            {!riwo.hasDraft && <p className="text-[12.5px] text-fg-3 mb-2">Type a message first, then ask Riwo to improve or translate it.</p>}
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={!riwo.hasDraft}
                  className={chip}
                  onClick={() => start({ kind: "improve", style: s.key })}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <label className="sr-only" htmlFor="riwo-language">
                Translate your draft into
              </label>
              <select
                id="riwo-language"
                value={language}
                disabled={!riwo.hasDraft}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  rememberLanguage(e.target.value);
                }}
                className="h-8 rounded-full bg-surface-2 px-3 text-[13px] text-fg disabled:opacity-40 min-w-0 flex-1"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!riwo.hasDraft}
                className={`${chip} flex items-center gap-1.5`}
                onClick={() => start({ kind: "translate", target: language })}
              >
                <Languages className="w-3.5 h-3.5" /> Translate
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-fg-3 mb-2">This chat</h3>
            <button type="button" className={chip} onClick={() => start({ kind: "summary" })}>
              Summarize this chat
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

const TITLES: Record<Request["kind"], (r: Request) => string> = {
  reply: (r) => `Suggested reply · ${TONES.find((t) => r.kind === "reply" && t.key === r.tone)?.label ?? ""}`,
  improve: (r) => `Improved draft · ${STYLES.find((s) => r.kind === "improve" && s.key === r.style)?.label ?? ""}`,
  translate: (r) => `Translated into ${r.kind === "translate" ? r.target : ""}`,
  summary: () => "Summary of this chat",
};
const WORKING: Record<Request["kind"], string> = {
  reply: "Riwo is writing a reply…",
  improve: "Riwo is improving your draft…",
  translate: "Riwo is translating…",
  summary: "Riwo is reading the chat…",
};

// Riwo's answer, shown above the composer. Nothing in it is sent until a person uses it and sends it.
export function RiwoTray({
  riwo,
  onUse,
  onSaveNote,
  canManage = false,
}: {
  riwo: Riwo;
  onUse: (text: string) => void;
  onSaveNote?: (text: string) => void;
  /** Owners and administrators are shown where to find out why Riwo failed */
  canManage?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { busy, outcome, error } = riwo;
  if (!busy && !outcome && !error) return null;
  const shell = "mx-3 sm:mx-6 mb-2 rounded-3xl bg-surface border border-line shadow-card p-4 animate-rise z-20";

  if (busy)
    return (
      <div className={shell} role="status">
        <div className="flex items-center gap-3 text-[14px] text-fg-2">
          <RiwoAvatar size={28} />
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          <span>{WORKING[busy.kind]}</span>
        </div>
      </div>
    );
  if (error)
    return (
      <div className={shell} role="alert">
        <div className="flex items-start gap-3">
          <RiwoAvatar size={28} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-fg">{error}</p>
            {canManage && (
              <p className="mt-1 text-[12.5px] text-fg-3">
                To see exactly why, open Team, then System, and press “Run a test” under Riwo.
              </p>
            )}
          </div>
          <button type="button" aria-label="Dismiss" onClick={riwo.dismiss} className="h-7 w-7 grid place-items-center rounded-full text-fg-3 hover:text-fg hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2 pl-10">
          <button type="button" className={chip} onClick={riwo.retry}>
            Try again
          </button>
        </div>
      </div>
    );

  const { request, text, summary } = outcome!;
  const copy = () => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div className={shell}>
      <div className="flex items-center gap-3">
        <RiwoAvatar size={28} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-fg truncate">{TITLES[request.kind](request)}</p>
          <p className="text-[12px] text-fg-3">Written by AI. Check it before you send.</p>
        </div>
        <button type="button" aria-label="Dismiss" onClick={riwo.dismiss} className="h-7 w-7 grid place-items-center rounded-full text-fg-3 hover:text-fg hover:bg-surface-2">
          <X className="w-4 h-4" />
        </button>
      </div>
      {summary && summary.sections.length ? (
        <dl className="mt-3 space-y-2 rounded-2xl bg-surface-2 p-3.5 text-[14px] leading-relaxed">
          {summary.sections.map((s) => (
            <div key={s.label}>
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-fg-3">{s.label}</dt>
              <dd className="text-fg" dir="auto">
                {s.text}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p dir="auto" className="mt-3 rounded-2xl bg-surface-2 p-3.5 text-[14.5px] leading-relaxed text-fg whitespace-pre-wrap">
          {text}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {request.kind === "summary" ? (
          <>
            {onSaveNote && (
              <button type="button" className={`${chip} flex items-center gap-1.5`} onClick={() => onSaveNote(text)}>
                <NotebookPen className="w-3.5 h-3.5" /> Save as team note
              </button>
            )}
            <button type="button" className={`${chip} flex items-center gap-1.5`} onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </>
        ) : (
          <button type="button" className="h-8 px-4 rounded-full text-[13px] font-semibold bg-brand-solid text-white hover:bg-brand-hover transition-colors" onClick={() => onUse(text)}>
            {request.kind === "reply" && riwo.hasDraft ? "Replace my draft" : "Use this"}
          </button>
        )}
        <button type="button" className={`${chip} flex items-center gap-1.5`} onClick={riwo.retry}>
          <RotateCcw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    </div>
  );
}

// A small "Translate" under a customer's message, so staff can read a language they don't.
export function TranslateMessage({ text, client = realAiClient }: { text: string; client?: AiClient }) {
  const [language, setLanguage] = useState(preferredLanguage);
  const [state, setState] = useState<
    { status: "idle" } | { status: "working" } | { status: "done"; text: string; target: string } | { status: "error"; message: string }
  >({ status: "idle" });
  const go = (target = language) => {
    setState({ status: "working" });
    client
      .translate(text, target)
      .then((r) => setState({ status: "done", text: r.text, target }))
      .catch((e: Error) => setState({ status: "error", message: e?.message || "Couldn't translate this." }));
  };
  if (state.status === "done")
    return (
      <div className="mt-1.5 rounded-xl bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-[13px] leading-relaxed">
        <p dir="auto" className="whitespace-pre-wrap text-fg">
          {state.text}
        </p>
        <p className="mt-0.5 text-[11px] text-fg-3">
          Translated into {state.target} by Riwo ·{" "}
          <button type="button" className="hover:text-fg underline-offset-2 hover:underline" onClick={() => setState({ status: "idle" })}>
            Hide
          </button>
        </p>
      </div>
    );
  return (
    <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-fg-3 opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity">
      {state.status === "working" ? (
        <span className="flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> Translating…
        </span>
      ) : (
        <>
          <button type="button" className="hover:text-fg flex items-center gap-1" onClick={() => go()}>
            <Languages className="w-3 h-3" aria-hidden /> Translate to
          </button>
          <select
            aria-label="Translate into"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              rememberLanguage(e.target.value);
            }}
            className="bg-transparent text-fg-2 text-[11.5px] rounded focus:outline-none focus-visible:ring-1 ring-gold/60 max-w-[7rem]"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </>
      )}
      {state.status === "error" && (
        <span role="alert" className="text-danger">
          {state.message}
        </span>
      )}
    </div>
  );
}
