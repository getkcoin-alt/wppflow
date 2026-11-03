import { useState } from "react";
import { Check, Loader2, Wand2, X } from "lucide-react";
import { reviseWorkflow, type RuleDraft, type WorkflowDraft, type WorkflowQuestion } from "../../../services/api";
import { Notice } from "../../ui/Page";
import { btn } from "../../ui/styles";

/**
 * "Change something": the owner says what to change, in words ("also ask their city"). Riwo returns the whole flow again and the
 * lines that changed; nothing is replaced until the owner agrees.
 */
export function ReviseBox({ rule, onApply }: { rule: RuleDraft; onApply: (draft: WorkflowDraft) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<{ draft: WorkflowDraft; diff: string[] } | null>(null);
  const [asks, setAsks] = useState<WorkflowQuestion[]>([]);

  const ask = async () => {
    if (text.trim().length < 3 || busy) return;
    setBusy(true);
    setError("");
    setAsks([]);
    try {
      const out = await reviseWorkflow(rule, text.trim());
      if (out.clarify?.length) setAsks(out.clarify);
      else if (out.draft) setProposal({ draft: out.draft, diff: out.diff || [] });
    } catch (e: any) {
      setError(e.message || "Riwo couldn't make that change.");
    } finally {
      setBusy(false);
    }
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
          void ask();
        }}
      >
        <input aria-label="What to change" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} className="flex-1 min-w-0 h-10 rounded-full bg-surface-2 px-4 text-[14px] outline-none ring-1 ring-transparent focus:ring-gold/60" dir="auto" />
        <button type="submit" className={btn("secondary", "sm")} disabled={busy || text.trim().length < 3}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} Change it
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
