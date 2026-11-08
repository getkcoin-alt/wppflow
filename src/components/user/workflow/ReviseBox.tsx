import { useState } from "react";
import { Check, Loader2, Plus, Wand2, X } from "lucide-react";
import { addWorkflowQuestion, reviseWorkflow, type RuleDraft, type WorkflowDraft, type WorkflowOutlineItem, type WorkflowQuestion } from "../../../services/api";
import { Notice } from "../../ui/Page";
import { btn, inputCls, selectCls } from "../../ui/styles";

const short = (t: string, n = 48) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

/**
 * "Change something": the owner says what to change, in words ("also ask their city"), and Riwo makes the change; or adds a
 * question themselves in a small form that needs no Riwo, so there is always a way. What comes back is the whole flow and the
 * lines that changed; nothing is replaced until the owner agrees.
 */
export function ReviseBox({ rule, outline = [], onApply }: { rule: RuleDraft; outline?: WorkflowOutlineItem[]; onApply: (draft: WorkflowDraft) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<{ draft: WorkflowDraft; diff: string[] } | null>(null);
  const [asks, setAsks] = useState<WorkflowQuestion[]>([]);
  // the form that adds a question without Riwo; it opens by itself when Riwo could not make the change
  const [form, setForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [where, setWhere] = useState("");
  const [tell, setTell] = useState(true);

  // where a question can go: in front of any step that carries on (not in front of the ones that finish or hand over)
  const places = outline.filter((o) => o.type !== "end" && o.type !== "handoff");
  const tells = outline.some((o) => o.type === "notify");

  const run = async (call: () => Promise<{ clarify?: WorkflowQuestion[]; draft?: WorkflowDraft; diff?: string[] }>, onFail: () => void) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setAsks([]);
    try {
      const out = await call();
      if (out.clarify?.length) setAsks(out.clarify);
      else if (out.draft) setProposal({ draft: out.draft, diff: out.diff || [] });
    } catch (e: any) {
      setError(e.message || "Riwo couldn't make that change.");
      onFail();
    } finally {
      setBusy(false);
    }
  };
  const ask = () => {
    if (text.trim().length < 3) return;
    void run(() => reviseWorkflow(rule, text.trim()), () => setForm(true));
  };
  const add = () => {
    if (question.trim().length < 3) return;
    void run(() => addWorkflowQuestion(rule, { question: question.trim(), ...(where ? { before: where } : {}), tell: tells ? tell : false }), () => {});
  };

  return (
    <section aria-label="Change something" className="rounded-2xl ring-1 ring-line p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold">
        <Wand2 className="w-4 h-4 text-gold" aria-hidden /> Change something
      </p>
      <p className="text-[12.5px] text-fg-3 mt-0.5">Say it in your own words, for example “also ask which city they are in”.</p>
      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <input aria-label="What to change" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} className="flex-1 min-w-0 h-10 rounded-full bg-surface-2 px-4 text-[14px] outline-none ring-1 ring-transparent focus:ring-gold/60" dir="auto" />
        <button type="submit" className={btn("secondary", "sm")} disabled={busy || text.trim().length < 3}>
          {busy && !form ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} Change it
        </button>
      </form>
      {error && (
        <div className="mt-2">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {asks.length > 0 && (
        <div className="mt-2">
          <Notice tone="info">
            Riwo needs to know: {asks.map((a) => a.question).join(" ")} Add the answer to what you wrote and try again.
          </Notice>
        </div>
      )}

      {!form ? (
        <button type="button" onClick={() => setForm(true)} className="mt-2.5 text-[13px] text-fg-2 hover:text-fg underline underline-offset-2">
          Or add a question yourself
        </button>
      ) : (
        <form
          aria-label="Add a question"
          className="mt-3 rounded-xl bg-surface-2 p-3 space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <p className="flex items-center gap-1.5 text-[13px] font-medium">
            <Plus className="w-3.5 h-3.5" aria-hidden /> Add a question
          </p>
          <input aria-label="Question to ask" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder="Where did you hear about us?" className={`${inputCls} !h-11 !bg-surface`} dir="auto" />
          {places.length > 0 && (
            <select aria-label="Where to ask it" value={where} onChange={(e) => setWhere(e.target.value)} className={`${selectCls} !h-11 !bg-surface`}>
              <option value="">After my last question</option>
              {places.map((o, i) => (
                <option key={o.id} value={o.id}>
                  {i === 0 ? "At the very start" : `Before: ${short(o.summary)}`}
                </option>
              ))}
            </select>
          )}
          {tells && (
            <label className="flex items-start gap-2 text-[13px] text-fg-2 min-h-11 sm:min-h-0">
              <input type="checkbox" checked={tell} onChange={(e) => setTell(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-solid" />
              Put the answer in the note the owners get
            </label>
          )}
          <div className="flex gap-2">
            <button type="submit" className={btn("secondary", "sm")} disabled={busy || question.trim().length < 3}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />} Add question
            </button>
            <button type="button" className={btn("ghost", "sm")} onClick={() => setForm(false)}>
              Close
            </button>
          </div>
        </form>
      )}

      {proposal && (
        <div className="mt-3 rounded-xl bg-surface-2 p-3" role="status">
          <p className="text-[13px] font-medium">Here is what would change:</p>
          <ul className="mt-1.5 space-y-1 text-[13px] text-fg-2 list-disc list-inside">
            {proposal.diff.length ? proposal.diff.map((d) => <li key={d}>{d}</li>) : <li>Nothing in the steps changes.</li>}
          </ul>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              className={btn("primary", "sm")}
              onClick={() => {
                onApply(proposal.draft);
                setProposal(null);
                setText("");
                setQuestion("");
                setForm(false);
              }}
            >
              <Check className="w-4 h-4" aria-hidden /> Use this
            </button>
            <button type="button" className={btn("ghost", "sm")} onClick={() => setProposal(null)}>
              <X className="w-4 h-4" aria-hidden /> Keep mine
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
