import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Briefcase, Loader2, Plus, X } from "lucide-react";
import { fetchAutomationContext, type AutomationContext, type RuleDraft } from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, textareaCls } from "../ui/styles";

const WELCOME = "Hi {{first_name}}, welcome to {{company}}! 👋 Thanks for getting in touch. I'll ask a few quick questions so the right person can help you.";
const FIELDS: [string, string][] = [
  ["{{first_name}}", "First name"],
  ["{{executive}}", "Executive's name"],
  ["{{company}}", "Company"],
];

/**
 * The sales assistant: Riwo asks your questions one at a time, keeps the answers, and when the customer asks for pricing or a
 * proposal it sends your formal message, hands the chat to an executive and puts the customer in your pipeline. Four things
 * to write: what Riwo may say about your business, the questions, the formal message, and where the lead should go.
 */
export function SalesRecipe({
  open,
  initial,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: RuleDraft;
  editing: boolean;
  onClose: () => void;
  /** `turnOn` is true when the person chose "Save and turn on" for a new rule */
  onSave: (rule: RuleDraft, turnOn: boolean) => Promise<void>;
}) {
  const context = useQuery({ queryKey: ["automation-context"], queryFn: fetchAutomationContext, staleTime: 60_000, enabled: open });
  if (!open) return null;
  if (!context.data)
    return (
      <Sheet open onClose={onClose} title="Sales assistant" subtitle="Loading…">
        {context.error ? <Notice tone="error">{(context.error as Error).message}</Notice> : <p className="text-[14px] text-fg-3">One moment…</p>}
      </Sheet>
    );
  return <Body key={`${initial.templateId || "own"}:${initial.name}`} ctx={context.data} initial={initial} editing={editing} onClose={onClose} onSave={onSave} />;
}

function Body({
  ctx,
  initial,
  editing,
  onClose,
  onSave,
}: {
  ctx: AutomationContext;
  initial: RuleDraft;
  editing: boolean;
  onClose: () => void;
  onSave: (rule: RuleDraft, turnOn: boolean) => Promise<void>;
}) {
  const c = initial.config;
  const sales = c.sales;
  const [name, setName] = useState(initial.name || "Sales assistant");
  const [welcome, setWelcome] = useState(c.reply || WELCOME);
  const [knowledge, setKnowledge] = useState(c.knowledge || "");
  const [questions, setQuestions] = useState<string[]>(sales?.questions?.length ? sales.questions : ctx.chat.sales.questions);
  const [newQuestion, setNewQuestion] = useState("");
  const [formal, setFormal] = useState(sales?.formal || ctx.chat.sales.formal);
  const [stageName, setStageName] = useState(sales?.stageName || "");
  const [followUp, setFollowUp] = useState(sales?.followUpHours ?? ctx.chat.sales.followUpHours);
  const [handoff, setHandoff] = useState(c.handoff || ctx.chat.handoff);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "paused" | "live">("");
  const max = ctx.chat.sales.maxQuestions;

  const move = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[i], next[j]] = [next[j], next[i]];
    setQuestions(next);
  };
  const addQuestion = () => {
    const value = newQuestion.trim();
    if (!value || questions.length >= max) return;
    if (!questions.some((q) => q.toLowerCase() === value.toLowerCase())) setQuestions([...questions, value]);
    setNewQuestion("");
  };

  const save = async (turnOn: boolean) => {
    if (!name.trim()) return setError("Give the rule a name.");
    if (!welcome.trim()) return setError("Write the welcome message.");
    if (knowledge.trim().length < 20) return setError("Write a few sentences about your business, so Riwo can answer short questions from them.");
    if (!questions.length) return setError("Add at least one question for Riwo to ask.");
    if (!formal.trim()) return setError("Write the message that is sent when someone asks for pricing or a proposal.");
    const hours = Number(followUp);
    if (!Number.isInteger(hours) || hours < 0 || hours > 72) return setError("The follow-up for your team must be 0 to 72 hours.");
    setBusy(turnOn ? "live" : "paused");
    setError("");
    const rule: RuleDraft = {
      name: name.trim(),
      triggerType: "first_message",
      triggerCondition: "",
      actionType: "ai_chat",
      actionSummary: "",
      templateId: initial.templateId || "sales-assistant",
      config: {
        reply: welcome.trim(),
        knowledge: knowledge.trim(),
        handoff: handoff.trim() || undefined,
        sourceOptions: [],
        sales: { enabled: true, questions, formal: formal.trim(), followUpHours: hours, stageName: stageName.trim() },
      },
    };
    try {
      await onSave(rule, turnOn);
    } catch (e: any) {
      setError(e.message || "Couldn't save the rule.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Sales assistant"
      subtitle={editing ? "Changes apply to new messages straight away." : "It starts paused, unless you choose to turn it on."}
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          {editing ? (
            <button type="button" disabled={!!busy} className={btn("primary")} onClick={() => void save(false)}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Save changes
            </button>
          ) : (
            <>
              <button type="button" disabled={!!busy} className={btn("secondary")} onClick={() => void save(false)}>
                {busy === "paused" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Save paused
              </button>
              <button type="button" disabled={!!busy} className={btn("primary")} onClick={() => void save(true)}>
                {busy === "live" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Save and turn on
              </button>
            </>
          )}
        </>
      }
    >
      <ol className="rounded-2xl bg-surface-2 ring-1 ring-line px-4 py-3 mb-5 text-[14px] leading-relaxed space-y-1 list-decimal list-inside" aria-label="What this does">
        <li>Someone writes to you for the first time. Riwo welcomes them and asks your first question.</li>
        <li>Riwo asks the rest one at a time, keeps what they say, and answers short questions from what you wrote about your business.</li>
        <li>When they ask for pricing or a proposal, Riwo sends your formal message, the chat goes to an executive with a summary, and the customer is added to your pipeline.</li>
      </ol>
      {!ctx.riwo.available && (
        <p role="status" className="mb-4 rounded-2xl bg-surface-2 ring-1 ring-line px-4 py-3 text-[13.5px] text-fg-2">
          Riwo can't read or answer messages right now, so each reply is taken as the answer to the question just asked. The questions and the pricing hand-off still work.
        </p>
      )}
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="space-y-5">
        <Field label="Rule name">
          <input aria-label="Rule name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>

        <Field label="Your welcome message" hint="Sent word for word, followed by your first question.">
          <textarea aria-label="Your welcome message" rows={4} value={welcome} onChange={(e) => setWelcome(e.target.value)} className={textareaCls} />
        </Field>

        <fieldset className="rounded-2xl ring-1 ring-line p-4 space-y-3">
          <legend className="px-1 text-[13px] font-medium text-fg-2 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" aria-hidden /> Questions Riwo asks
          </legend>
          <p className="text-[13px] text-fg-2">
            Asked one at a time, in this order, exactly as you write them. A question the customer has already answered is skipped. Up to {max}.
          </p>
          <ol className="space-y-2" aria-label="Questions">
            {questions.map((q, i) => (
              <li key={`${i}:${q}`} className="flex items-center gap-2">
                <span className="w-6 text-center text-[13px] text-fg-3">{i + 1}</span>
                <input
                  aria-label={`Question ${i + 1}`}
                  value={q}
                  maxLength={200}
                  onChange={(e) => setQuestions(questions.map((x, k) => (k === i ? e.target.value : x)))}
                  className={inputCls}
                />
                <button type="button" aria-label={`Move question ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" aria-hidden />
                </button>
                <button type="button" aria-label={`Move question ${i + 1} down`} disabled={i === questions.length - 1} onClick={() => move(i, 1)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" aria-hidden />
                </button>
                <button type="button" aria-label={`Remove question ${i + 1}`} onClick={() => setQuestions(questions.filter((_, k) => k !== i))} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-2">
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <input
              aria-label="Add a question"
              value={newQuestion}
              maxLength={200}
              placeholder="For example: Which city is this for?"
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addQuestion();
                }
              }}
              className={inputCls}
            />
            <button type="button" className={btn("secondary")} onClick={addQuestion} disabled={questions.length >= max}>
              <Plus className="w-4 h-4" aria-hidden /> Add
            </button>
          </div>
        </fieldset>

        <Field label="What can Riwo tell them about your business?" hint="Riwo answers short questions from this only. It never makes up prices, offers or links, and never talks about pricing or proposals at all.">
          <textarea
            aria-label="About your business"
            rows={5}
            value={knowledge}
            maxLength={3000}
            placeholder="We are … in … We help people … Our services are … We are open … Our website is …"
            onChange={(e) => setKnowledge(e.target.value)}
            className={textareaCls}
          />
        </Field>

        <div className="rounded-2xl ring-1 ring-line p-4 space-y-4">
          <p className="text-[15px] font-semibold">When they ask for pricing or a proposal</p>
          <div>
            <Field label="This formal message is sent" hint="Word for word. Riwo never writes it. {{executive}} becomes the name of the teammate the chat is with.">
              <textarea aria-label="Message for pricing and proposals" rows={4} value={formal} onChange={(e) => setFormal(e.target.value)} className={textareaCls} />
            </Field>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[12.5px] text-fg-3">Add:</span>
              {FIELDS.map(([token, label]) => (
                <button key={token} type="button" onClick={() => setFormal(formal + token)} className="rounded-full px-3 h-8 text-[12.5px] bg-surface-2 ring-1 ring-line hover:ring-gold/60">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Pipeline step for the lead" hint="Leave empty to use the step named Proposal or Quote (or the second step). Leads are never moved backwards.">
            <input aria-label="Pipeline step" value={stageName} maxLength={40} placeholder="Proposal" onChange={(e) => setStageName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Remind your team after (hours)" hint="A follow-up task is made for the teammate, so the customer is not left waiting. 0 for none.">
            <input aria-label="Remind your team after" type="number" min={0} max={72} value={followUp} onChange={(e) => setFollowUp(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>

        <Field label="When Riwo can't help, it says" hint="Sent word for word, once, and your team is told.">
          <textarea aria-label="When Riwo can't help" rows={2} value={handoff} onChange={(e) => setHandoff(e.target.value)} className={textareaCls} />
        </Field>
      </div>
    </Sheet>
  );
}
