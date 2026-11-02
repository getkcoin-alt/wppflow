import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { draftAgent, fetchKnowledge, type AgentClose, type RuleDraft } from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";

const CLOSES: Record<AgentClose, string> = {
  handoff: "Hand over to a person when the customer is ready, or asks for prices",
  collect_details: "Get their name and contact details, then hand over",
  book_demo: "Suggest a call or demo and hand over with their preferred time",
  send_link: "Share the right link from my website, then hand over when they say yes",
};

/**
 * The Riwo sales agent: a whole conversation with a new customer, from the company's knowledge base, toward a goal. The owner
 * describes it in their own words; Riwo asks what it still needs to know and drafts the agent; the owner reads and edits it
 * before it is saved paused or switched on.
 */
export function AgentRecipe({
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
  onSave: (rule: RuleDraft, turnOn: boolean) => Promise<void>;
}) {
  if (!open) return null;
  return <Body key={`${initial.name}:${editing}`} initial={initial} editing={editing} onClose={onClose} onSave={onSave} />;
}

function Body({ initial, editing, onClose, onSave }: { initial: RuleDraft; editing: boolean; onClose: () => void; onSave: (rule: RuleDraft, turnOn: boolean) => Promise<void> }) {
  const knowledge = useQuery({ queryKey: ["knowledge"], queryFn: fetchKnowledge, staleTime: 15_000 });
  const c = initial.config;
  const a = c.agent;
  const [instruction, setInstruction] = useState("");
  const [questions, setQuestions] = useState<{ question: string; answer: string }[]>([]);
  const [understood, setUnderstood] = useState("");
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState(initial.name || "Riwo sales agent");
  const [goal, setGoal] = useState(a?.goal || "");
  const [playbook, setPlaybook] = useState(a?.playbook || "");
  const [closeWith, setCloseWith] = useState<AgentClose>(a?.closeWith || "handoff");
  const [pricing, setPricing] = useState<"handoff" | "knowledge">(a?.pricing || "handoff");
  const [formal, setFormal] = useState(c.sales?.formal || "");
  const [followUp, setFollowUp] = useState(c.sales?.followUpHours ?? 2);
  const [stageName, setStageName] = useState(c.sales?.stageName || "");
  const [handoff, setHandoff] = useState(c.handoff || "");
  const [facts, setFacts] = useState(c.knowledge || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "paused" | "live">("");
  const hasBase = Boolean(knowledge.data?.ready);
  const drafted = Boolean(goal || playbook);

  const ask = async (withAnswers: boolean) => {
    if (instruction.trim().length < 10) return setError("Describe in a sentence or two what Riwo should do.");
    setAsking(true);
    setError("");
    try {
      const answers = withAnswers ? questions.filter((q) => q.answer.trim()) : [];
      const out = await draftAgent(instruction.trim(), answers);
      if (out.clarify?.length) {
        setQuestions(out.clarify.map((question) => ({ question, answer: questions.find((q) => q.question === question)?.answer || "" })));
        setUnderstood("");
        return;
      }
      if (out.draft) {
        const d = out.draft.config;
        setQuestions([]);
        setName(out.draft.name);
        setGoal(d.agent?.goal || "");
        setPlaybook(d.agent?.playbook || "");
        setCloseWith(d.agent?.closeWith || "handoff");
        setPricing(d.agent?.pricing || "handoff");
        setFormal(d.sales?.formal || "");
        setFollowUp(d.sales?.followUpHours ?? 2);
        setStageName(d.sales?.stageName || "");
        setHandoff(d.handoff || "");
        setUnderstood(out.understood || "");
      }
    } catch (e: any) {
      setError(e.message || "Riwo couldn't draft that. Try saying it a little differently.");
    } finally {
      setAsking(false);
    }
  };

  const save = async (turnOn: boolean) => {
    if (!name.trim()) return setError("Give the agent a name.");
    if (!goal.trim() && !playbook.trim()) return setError("Tell Riwo what it should achieve, in your own words.");
    if (!hasBase && facts.trim().length < 20) return setError("Riwo needs something to talk from: add your website to the knowledge base, or write a few facts about your business below.");
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
      templateId: initial.templateId || null,
      config: {
        reply: "",
        useKnowledge: hasBase,
        knowledge: facts.trim(),
        handoff: handoff.trim() || undefined,
        agent: { enabled: true, goal: goal.trim(), playbook: playbook.trim(), closeWith, pricing },
        sales: { enabled: true, questions: [], formal: formal.trim() || undefined, followUpHours: hours, stageName: stageName.trim() },
      },
    };
    try {
      await onSave(rule, turnOn);
    } catch (e: any) {
      setError(e.message || "Couldn't save the agent.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Riwo sales agent"
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
        <li>A new customer writes. Riwo answers straight away, in your words and from your knowledge base.</li>
        <li>It finds out what they need, recommends the product that fits and moves toward the goal you set.</li>
        <li>It never invents a price or a promise. When the customer is ready, or Riwo is unsure, a person takes over with a summary, and the customer is added to your pipeline.</li>
      </ol>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="space-y-5">
        <div className="rounded-2xl ring-1 ring-line p-4 space-y-3">
          <p className="text-[15px] font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" aria-hidden /> Tell Riwo in your own words
          </p>
          <p className="text-[13px] text-fg-2">Say it like you would to a new salesperson. Riwo asks what it still needs to know, then fills in the settings below for you to check.</p>
          <textarea
            aria-label="Describe what Riwo should do"
            rows={4}
            value={instruction}
            maxLength={2000}
            placeholder="For example: Talk to anyone who messages us about our software. Find out their company size and which product fits, be friendly and brief, never talk about prices, and book a demo with our sales team."
            onChange={(e) => setInstruction(e.target.value)}
            className={textareaCls}
          />
          {questions.length > 0 && (
            <div className="space-y-3" aria-label="Riwo's questions">
              {questions.map((q, i) => (
                <label key={q.question} className="block">
                  <span className="text-[13.5px] font-medium">{q.question}</span>
                  <input
                    aria-label={q.question}
                    value={q.answer}
                    maxLength={500}
                    onChange={(e) => setQuestions(questions.map((x, k) => (k === i ? { ...x, answer: e.target.value } : x)))}
                    className={`${inputCls} mt-1`}
                  />
                </label>
              ))}
            </div>
          )}
          <button type="button" className={btn("secondary")} disabled={asking} onClick={() => void ask(questions.length > 0)}>
            {asking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Bot className="w-4 h-4" aria-hidden />}
            {questions.length > 0 ? "Send my answers" : drafted ? "Set it up again" : "Let Riwo set it up"}
          </button>
          {understood && (
            <p role="status" className="text-[13.5px] text-fg-2">
              <strong className="font-medium text-fg">What I understood:</strong> {understood} Check the settings below and change anything.
            </p>
          )}
        </div>

        <Field label="Name">
          <input aria-label="Agent name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="The goal" hint="What Riwo should achieve in the chat, in one sentence.">
          <input aria-label="The goal" value={goal} maxLength={300} onChange={(e) => setGoal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="How Riwo should talk" hint="Tone, what to ask, what to avoid. Written the way you would brief a person.">
          <textarea aria-label="How Riwo should talk" rows={4} value={playbook} maxLength={2000} onChange={(e) => setPlaybook(e.target.value)} className={textareaCls} />
        </Field>
        <Field label="How it ends" hint="The next step Riwo moves the customer toward.">
          <select aria-label="How it ends" value={closeWith} onChange={(e) => setCloseWith(e.target.value as AgentClose)} className={selectCls}>
            {(Object.keys(CLOSES) as AgentClose[]).map((k) => (
              <option key={k} value={k}>
                {CLOSES[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prices" hint="Riwo never invents a price or a discount and never negotiates.">
          <select aria-label="Prices" value={pricing} onChange={(e) => setPricing(e.target.value as "handoff" | "knowledge")} className={selectCls}>
            <option value="handoff">Hand price and proposal questions to a person (recommended)</option>
            <option value="knowledge">Let Riwo repeat the prices that are on my website</option>
          </select>
        </Field>

        <div className="rounded-2xl ring-1 ring-line p-4 space-y-4">
          <p className="text-[15px] font-semibold">What Riwo talks from</p>
          {hasBase ? (
            <p className="text-[13.5px] text-fg-2" role="status">
              Riwo uses your knowledge base: {knowledge.data?.sources.length} {knowledge.data?.sources.length === 1 ? "website" : "websites"}
              {knowledge.data?.notes ? " and your notes" : ""}. Manage it at the top of this page.
            </p>
          ) : (
            <p className="text-[13.5px] text-fg-2" role="status">
              Your knowledge base is empty. Add your website at the top of Automations so Riwo learns your products, or write a few facts here.
            </p>
          )}
          <Field label={hasBase ? "Extra facts for this agent (optional)" : "Facts about your business"} hint="Riwo says only what is in your knowledge base or here.">
            <textarea aria-label="Facts about your business" rows={3} value={facts} maxLength={3000} onChange={(e) => setFacts(e.target.value)} className={textareaCls} />
          </Field>
        </div>

        <div className="rounded-2xl ring-1 ring-line p-4 space-y-4">
          <p className="text-[15px] font-semibold">When a person takes over</p>
          <Field label="This formal message is sent" hint="Word for word. {{executive}} becomes the name of the teammate the chat is with.">
            <textarea aria-label="Message when a person takes over" rows={3} value={formal} onChange={(e) => setFormal(e.target.value)} className={textareaCls} placeholder="Thank you for your interest, {{first_name}}. Our executive {{executive}} has been assigned…" />
          </Field>
          <Field label="Pipeline step for the lead" hint="Leave empty to use the step named Proposal or Quote.">
            <input aria-label="Pipeline step" value={stageName} maxLength={40} onChange={(e) => setStageName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Remind your team after (hours)" hint="A follow-up task is made so the customer is not left waiting. 0 for none.">
            <input aria-label="Remind your team after" type="number" min={0} max={72} value={followUp} onChange={(e) => setFollowUp(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="When Riwo can't help, it says" hint="Sent word for word, once, and your team is told.">
            <textarea aria-label="When Riwo can't help" rows={2} value={handoff} onChange={(e) => setHandoff(e.target.value)} className={textareaCls} />
          </Field>
        </div>
      </div>
    </Sheet>
  );
}
