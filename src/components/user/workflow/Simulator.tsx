import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";
import { simulateWorkflow, type RuleDraft, type SimulatedEvent, type SimulatedState } from "../../../services/api";
import { Notice } from "../../ui/Page";
import { btn } from "../../ui/styles";

type Line = { id: number; from: "customer" | "riwo" | "system"; text: string; kind?: SimulatedEvent["kind"]; read?: string };

const SCENARIOS = [
  { label: "A new customer", text: "Hello" },
  { label: "Answers 1", text: "1" },
  { label: "Answers 2", text: "2" },
  { label: "Unclear answer", text: "hmm, not sure" },
  { label: "Asks for prices", text: "How much does it cost?" },
];

/**
 * "Try it": the owner plays the customer. It runs the same steps a customer would meet, with nothing sent to WhatsApp and nothing
 * saved, and shows what Riwo understood and which steps would run (labels, notes to you, follow-ups).
 */
export function Simulator({ rule, known, onStep }: { rule: RuleDraft; known: string[]; onStep: (id: string | null) => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [state, setState] = useState<SimulatedState | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [pretend, setPretend] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [lines]);

  const reset = () => {
    setLines([]);
    setState(null);
    setDone(null);
    setError("");
    onStep(null);
  };

  const send = async (said: string) => {
    const t = said.trim();
    if (!t || busy || done) return;
    setBusy(true);
    setError("");
    const mine: Line = { id: nextId.current++, from: "customer", text: t };
    setLines((l) => [...l, mine]);
    setText("");
    try {
      const transcript = [...lines, mine].filter((l) => l.from !== "system").map((l) => ({ from: l.from as "customer" | "riwo", text: l.text }));
      const out = await simulateWorkflow({ rule, state, text: t, labels: pretend ? known : [], transcript, name: "Asha Rao" });
      setState(out.state);
      onStep(out.node);
      setLines((l) => [
        ...l.map((x) => (x.id === mine.id && out.read ? { ...x, read: out.read.label ? `Riwo understood: ${out.read.label}${out.read.via === "ai" ? "" : out.read.via === "number" ? " (by the number)" : " (by the words)"}` : "Riwo could not tell which answer that was" } : x)),
        ...out.events.map((e) => ({ id: nextId.current++, from: e.kind === "say" ? ("riwo" as const) : ("system" as const), text: e.text, kind: e.kind })),
      ]);
      if (out.done) setDone(out.outcome === "handed_off" ? "A person takes over from here." : "The workflow finished.");
    } catch (e: any) {
      setError(e.message || "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Try the workflow" className="rounded-3xl ring-1 ring-line bg-surface overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-gradient-to-r from-brand/10 to-gold/10 flex items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold">Try it as a customer</p>
          <p className="text-[12px] text-fg-2">Nothing is sent to WhatsApp or saved.</p>
        </div>
        <button type="button" onClick={reset} className="h-8 px-3 rounded-full bg-surface text-[12.5px] inline-flex items-center gap-1.5 ring-1 ring-line hover:bg-surface-2">
          <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Start over
        </button>
      </div>
      <div className="flex-1 min-h-[260px] max-h-[420px] overflow-y-auto px-3.5 py-3 space-y-2 bg-wallpaper" aria-live="polite" role="log" aria-label="The conversation">
        {lines.length === 0 && <p className="text-[13px] text-fg-3 text-center mt-8 px-6">Say something as the customer, or tap one of the examples below.</p>}
        {lines.map((l) =>
          l.from === "system" ? (
            <p key={l.id} className="mx-auto max-w-[92%] rounded-xl bg-surface ring-1 ring-line px-3 py-1.5 text-[12px] text-fg-2 text-center">
              {l.text}
            </p>
          ) : (
            <div key={l.id} className={`flex flex-col ${l.from === "customer" ? "items-end" : "items-start"}`}>
              <p className={`max-w-[86%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug whitespace-pre-line break-words ${l.from === "customer" ? "bg-bubble-out" : "bg-bubble-in shadow-sm"}`}>{l.text}</p>
              {l.read && <p className="mt-0.5 mr-1 text-[11.5px] text-gold">{l.read}</p>}
            </div>
          ),
        )}
        {busy && (
          <p className="text-[12px] text-fg-3 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> Riwo is thinking…
          </p>
        )}
        {done && <p className="text-center text-[12.5px] font-medium text-ok py-1">{done}</p>}
        <div ref={end} />
      </div>
      {error && (
        <div className="px-3 pt-2">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {known.length > 0 && (
        <label className="mx-3.5 mt-2 flex items-center gap-2 text-[12.5px] text-fg-2">
          <input type="checkbox" checked={pretend} onChange={(e) => {
              reset();
              setPretend(e.target.checked);
            }} /> Pretend this person is already labelled “{known[0]}”
        </label>
      )}
      <div className="px-3 pt-2 flex flex-wrap gap-1.5" aria-label="Examples">
        {SCENARIOS.map((s) => (
          <button key={s.label} type="button" disabled={busy || Boolean(done)} onClick={() => void send(s.text)} className="h-7 px-2.5 rounded-full bg-surface-2 text-[12px] hover:bg-surface-3 disabled:opacity-40">
            {s.label}
          </button>
        ))}
      </div>
      <form
        className="p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input aria-label="Type as the customer" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={done ? "Start over to try again" : "Type as the customer…"} disabled={Boolean(done)} className="flex-1 min-w-0 h-10 rounded-full bg-surface-2 px-4 text-[14px] outline-none ring-1 ring-transparent focus:ring-gold/60" dir="auto" />
        <button type="submit" disabled={busy || !text.trim() || Boolean(done)} aria-label="Send as the customer" className={`${btn("primary", "sm")} !h-10 !w-10 !px-0`}>
          <Send className="w-4 h-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
