import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, Clock, Loader2, Sparkles } from "lucide-react";
import {
  addAutomation,
  checkWorkflow,
  draftWorkflow,
  fetchAutomationVersions,
  fetchWorkflowRecipes,
  restoreAutomationVersion,
  toggleAutomationApi,
  updateAutomation,
  type RuleDraft,
  type WorkflowDraft,
  type WorkflowQuestion,
  type WorkflowRecipe,
} from "../../../services/api";
import { Notice } from "../../ui/Page";
import { Sheet } from "../../ui/Sheet";
import { btn, inputCls, textareaCls } from "../../ui/styles";
import { FlowView } from "./FlowView";
import { NeedsPanel } from "./NeedsPanel";
import { ReviseBox } from "./ReviseBox";
import { SafetyChips } from "./SafetyChips";
import { Simulator } from "./Simulator";
import { labelsLookedAt, phonesFrom, validPhone, withStepField } from "./steps";

// Riwo's face (its own small copy: the inbox's avatar pulls in the whole assistant, which this screen does not need)
const Face = ({ size = 44 }: { size?: number }) => <img src="/brand/riwo-avatar.webp" alt="" width={size} height={size} className="rounded-full object-cover bg-surface-2 shrink-0" style={{ width: size, height: size }} />;

const EXAMPLES = [
  {
    label: "Work or family?",
    text: "If someone new messages me, or someone writes after a month, ask whether it is about work or they are family or a friend. For work, be professional, find out what they need and set up a meeting, but never talk about prices. For friends, send a warm note and tell me.",
  },
  { label: "After hours", text: "When we are closed, tell people we will reply in the morning, ask what they need, and give my team a follow-up for the morning." },
  { label: "Welcome back", text: "When a customer writes after a quiet month, welcome them back, ask if it is something new or something from before, and send new needs to a sales conversation that ends in a call." },
];

type Stage = "describe" | "asking" | "confirm";
export interface BuilderInitial {
  id: string;
  rule: RuleDraft;
}

/**
 * Describe what should happen in your own words and any language. Riwo asks only what it cannot decide, builds the workflow,
 * shows it as steps with the safety it added, lets you change it in words, and lets you try it as a customer. Only then is it
 * saved, paused or in test mode (running only for numbers you list).
 */
export function WorkflowBuilder({ open, onClose, onSaved, initial = null }: { open: boolean; onClose: () => void; onSaved: (message: string) => void; initial?: BuilderInitial | null }) {
  if (!open) return null;
  return <Body key={initial?.id || "new"} onClose={onClose} onSaved={onSaved} initial={initial} />;
}

function Body({ onClose, onSaved, initial }: { onClose: () => void; onSaved: (message: string) => void; initial: BuilderInitial | null }) {
  const [stage, setStage] = useState<Stage>(initial ? "confirm" : "describe");
  const [instruction, setInstruction] = useState("");
  const [questions, setQuestions] = useState<(WorkflowQuestion & { answer: string })[]>([]);
  const [draft, setDraft] = useState<WorkflowDraft | null>(null);
  const [name, setName] = useState(initial?.rule.name || "");
  const [phonesText, setPhonesText] = useState((initial?.rule.config.pilot?.phones || []).map((p) => `+${p}`).join(", "));
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "draft" | "save">("");
  const [error, setError] = useState("");
  const [checkError, setCheckError] = useState("");
  const [checking, setChecking] = useState(false);
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [shown, setShown] = useState<WorkflowRecipe[]>([]);
  const recipes = useQuery({ queryKey: ["workflow-recipes"], queryFn: fetchWorkflowRecipes, staleTime: 60 * 60 * 1000 });
  // a saved workflow keeps what it was before each change: the last change can be undone
  const versions = useQuery({ queryKey: ["automation-versions", initial?.id], queryFn: () => fetchAutomationVersions(initial!.id), enabled: Boolean(initial), staleTime: 0 });
  const lastVersion = versions.data?.versions[0];
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);

  // a saved workflow opens already built: it is checked once to show its steps and safety
  useEffect(() => {
    if (!initial) return;
    let live = true;
    checkWorkflow(initial.rule)
      .then((r) => live && setDraft(r.draft))
      .catch((e: any) => live && setError(e.message || "This workflow can't be opened."));
    return () => {
      live = false;
    };
  }, [initial]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const accept = (d: WorkflowDraft) => {
    setDraft(d);
    setName((n) => n || d.rule.name);
    setStage("confirm");
    setVersion((v) => v + 1);
    setActive(null);
    setCheckError("");
  };

  // the screen's own copy is the one being edited; the server checks it again a moment after the last change
  const changed = (next: RuleDraft) => {
    setDraft((d) => (d ? { ...d, rule: next } : d));
    window.clearTimeout(timer.current);
    const mine = ++seq.current;
    setChecking(true);
    timer.current = window.setTimeout(() => {
      checkWorkflow(next)
        .then((r) => {
          if (mine !== seq.current) return;
          setCheckError("");
          setDraft((d) => (d ? { ...r.draft, understood: d.understood, note: d.note, source: d.source } : r.draft));
          setVersion((v) => v + 1);
        })
        .catch((e: any) => mine === seq.current && setCheckError(e.message || "That change can't be saved."))
        .finally(() => mine === seq.current && setChecking(false));
    }, 500);
  };
  const editStep = (id: string, field: string, value: string) => {
    if (!draft?.rule.config.workflow) return;
    changed({ ...draft.rule, config: { ...draft.rule.config, workflow: withStepField(draft.rule.config.workflow, id, field, value) } });
  };
  const patchConfig = (patch: Partial<RuleDraft["config"]>) => draft && changed({ ...draft.rule, config: { ...draft.rule.config, ...patch } });

  const build = async (answers: { question: string; answer: string }[] = []) => {
    if (instruction.trim().length < 10) return setError("Describe in a sentence or two what should happen.");
    setBusy("draft");
    setError("");
    setMessage("");
    try {
      const out = await draftWorkflow({ instruction: instruction.trim(), answers });
      if (out.clarify?.length) {
        setQuestions(out.clarify.map((q) => ({ ...q, answer: questions.find((x) => x.question === q.question)?.answer || "" })));
        setStage("asking");
      } else if (out.draft) accept(out.draft);
      else {
        setMessage(out.message || "Riwo couldn't build that this time.");
        setShown(out.recipes || []);
        setStage("describe");
      }
    } catch (e: any) {
      setError(e.message || "Riwo couldn't build that. Try saying it a little differently.");
    } finally {
      setBusy("");
    }
  };
  const startFromRecipe = async (id: string) => {
    setBusy("draft");
    setError("");
    try {
      const out = await draftWorkflow({ recipe: id });
      if (out.draft) accept(out.draft);
    } catch (e: any) {
      setError(e.message || "That ready-made workflow couldn't be opened.");
    } finally {
      setBusy("");
    }
  };

  const phones = phonesFrom(phonesText);
  const phonesOk = phones.length > 0 && phones.every(validPhone);
  const needsOpen = (draft?.needs.length ?? 0) > 0;
  const finalRule = (): RuleDraft => {
    const { pilot: _pilot, ...config } = draft!.rule.config;
    void _pilot;
    return { ...draft!.rule, name: name.trim() || draft!.rule.name, config: { ...config, ...(phones.length ? { pilot: { enabled: true, phones } } : {}) } };
  };
  const save = async (turnOn: boolean) => {
    if (!draft) return;
    if (phones.length && !phonesOk) return setError("A test number needs its country code, for example +91 99716 94047.");
    setBusy("save");
    setError("");
    try {
      const rule = finalRule();
      if (initial) {
        await updateAutomation(initial.id, rule);
        return onSaved(`Saved “${rule.name}”.`);
      }
      const created = await addAutomation(rule);
      if (turnOn) {
        try {
          await toggleAutomationApi(created.automation.id);
        } catch (e: any) {
          return onSaved(`Saved “${rule.name}”, but it is still paused: ${e.message}`);
        }
        return onSaved(`“${rule.name}” is on, in test mode: it only runs for the numbers you listed.`);
      }
      onSaved(`Saved “${rule.name}” paused. Turn it on when you are ready.`);
    } catch (e: any) {
      setError(e.message || "Couldn't save the workflow.");
    } finally {
      setBusy("");
    }
  };

  const undo = async () => {
    if (!initial || !lastVersion) return;
    setBusy("save");
    setError("");
    try {
      await restoreAutomationVersion(initial.id, lastVersion.version);
      onSaved("Went back to the version before your last change.");
    } catch (e: any) {
      setError(e.message || "Couldn't go back.");
    } finally {
      setBusy("");
    }
  };
  const known = labelsLookedAt(draft?.rule.config.workflow);
  const footer =
    stage === "confirm" && draft ? (
      <div className="w-full flex flex-wrap items-center justify-end gap-2">
        {initial && lastVersion && (
          <button type="button" className={`${btn("ghost")} sm:mr-auto`} disabled={busy === "save"} onClick={() => void undo()}>
            Undo my last change
          </button>
        )}
        <button type="button" className={btn("ghost")} onClick={onClose}>
          Cancel
        </button>
        {initial ? (
          <button type="button" className={btn("primary")} disabled={busy === "save" || needsOpen || Boolean(checkError) || checking} onClick={() => void save(false)}>
            {busy === "save" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Save changes
          </button>
        ) : (
          <>
            <button type="button" className={btn("secondary")} disabled={busy === "save" || needsOpen || Boolean(checkError) || checking} onClick={() => void save(false)}>
              Save paused
            </button>
            <button type="button" className={btn("primary")} disabled={busy === "save" || needsOpen || Boolean(checkError) || checking || !phonesOk} onClick={() => void save(true)} title={phonesOk ? "" : "Add a number to test with first"}>
              {busy === "save" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Turn on in test mode
            </button>
          </>
        )}
      </div>
    ) : undefined;

  return (
    <Sheet open onClose={onClose} wide title={initial ? "Change workflow" : "Describe it, then try it"} subtitle={stage === "confirm" ? undefined : "Say what should happen in your own words, in any language. Riwo builds it, you check it and try it before any customer sees it."} footer={footer}>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {stage === "describe" && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-start gap-3">
            <img src="/brand/riwo-wave.webp" alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl object-cover shrink-0" />
            <div className="rounded-2xl rounded-tl-md bg-bubble-out px-4 py-3 text-[14.5px] leading-relaxed">
              Tell me what should happen when customers write, the way you would tell a new team member. I'll turn it into steps and ask only what I truly need.
            </div>
          </div>
          <textarea
            aria-label="Describe what should happen"
            rows={6}
            value={instruction}
            maxLength={2000}
            onChange={(e) => setInstruction(e.target.value)}
            className={textareaCls}
            dir="auto"
            placeholder="For example: if someone new messages me, or writes after a month, ask whether it is about work or they are family or a friend. For work, be professional and set up a meeting. For friends, send a warm note and tell me."
          />
          <div className="flex flex-wrap items-center gap-2" aria-label="Examples">
            <span className="text-[12.5px] text-fg-3">Try an example:</span>
            {EXAMPLES.map((x) => (
              <button key={x.label} type="button" onClick={() => setInstruction(x.text)} className="h-8 px-3 rounded-full bg-surface-2 text-[13px] hover:bg-surface-3">
                {x.label}
              </button>
            ))}
          </div>
          {message && <Notice tone="info">{message}</Notice>}
          <button type="button" className={btn("primary")} disabled={busy === "draft"} onClick={() => void build()}>
            {busy === "draft" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Sparkles className="w-4 h-4" aria-hidden />} Let Riwo build it
          </button>
          <div className="pt-4 border-t border-line">
            <p className="text-[13.5px] font-semibold">Or start from a ready-made workflow</p>
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              {(shown.length ? shown : recipes.data?.recipes || []).map((r) => (
                <article key={r.id} className="card p-4 flex flex-col">
                  <h4 className="text-[14.5px] font-semibold leading-snug">{r.title}</h4>
                  <p className="mt-1.5 text-[12.5px] text-fg-2 leading-relaxed flex-1">{r.summary}</p>
                  <button type="button" disabled={busy === "draft"} onClick={() => void startFromRecipe(r.id)} className={`${btn("secondary", "sm")} mt-3 self-start`}>
                    Use this
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === "asking" && (
        <div className="max-w-2xl mx-auto space-y-5" aria-label="Riwo's questions">
          <div className="flex items-start gap-3">
            <Face size={44} />
            <div className="rounded-2xl rounded-tl-md bg-bubble-out px-4 py-3 text-[14.5px]">Just {questions.length === 1 ? "one thing" : "a couple of things"} before I build it:</div>
          </div>
          {questions.map((q, i) => (
            <div key={q.question} className="space-y-2">
              <p className="text-[14.5px] font-medium">{q.question}</p>
              {q.choices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {q.choices.map((c) => (
                    <button key={c} type="button" aria-pressed={q.answer === c} onClick={() => setQuestions(questions.map((x, k) => (k === i ? { ...x, answer: c } : x)))} className={`h-9 px-4 rounded-full text-[13.5px] ${q.answer === c ? "bg-brand-solid text-white" : "bg-surface-2 hover:bg-surface-3"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <input aria-label={q.question} value={q.answer} maxLength={500} placeholder="Or write your own answer" onChange={(e) => setQuestions(questions.map((x, k) => (k === i ? { ...x, answer: e.target.value } : x)))} className={inputCls} dir="auto" />
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className={btn("ghost")} onClick={() => setStage("describe")}>
              Back
            </button>
            <button type="button" className={btn("primary")} disabled={busy === "draft" || questions.every((q) => !q.answer.trim())} onClick={() => void build(questions.filter((q) => q.answer.trim()).map((q) => ({ question: q.question, answer: q.answer.trim() })))}>
              {busy === "draft" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Build it
            </button>
          </div>
        </div>
      )}

      {stage === "confirm" && !draft && !error && (
        <p className="text-[14px] text-fg-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Opening…
        </p>
      )}

      {stage === "confirm" && draft && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="space-y-4 min-w-0">
            {draft.note && <Notice tone="info">{draft.note}</Notice>}
            <div className="flex items-start gap-3">
              <Face size={44} />
              <div className="rounded-2xl rounded-tl-md bg-bubble-out px-4 py-3 text-[14.5px] leading-relaxed">
                <b className="font-semibold">Here is what I understood. </b>
                {draft.understood || "Check each step below, try it on the right, and change anything."}
              </div>
            </div>
            <p className="flex items-center gap-2 text-[13.5px] rounded-xl bg-surface-2 px-3.5 py-2.5">
              <Clock className="w-4 h-4 text-gold shrink-0" aria-hidden /> {draft.when}
            </p>
            {draft.warnings.map((w) => (
              <p key={w} className="flex items-start gap-2 text-[13px] text-warn">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden /> {w}
              </p>
            ))}
            {checkError && <Notice tone="error">{checkError}</Notice>}
            <FlowView draft={draft} active={active} onEdit={editStep} />
            <NeedsPanel needs={draft.needs} rule={draft.rule} onChange={patchConfig} />
            <SafetyChips lines={draft.guardrails} />
            <ReviseBox rule={draft.rule} outline={draft.outline} onApply={accept} />
          </div>
          <div className="lg:sticky lg:top-0 self-start">
            <Simulator key={version} rule={draft.rule} known={known} onStep={setActive} />
          </div>
        </div>
      )}
      {stage === "confirm" && draft && (
        <section aria-label="Name and test numbers" className="mt-6 rounded-2xl ring-1 ring-line p-4 grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wf-name" className="text-[13px] font-medium text-fg-2 ml-1">
              Name
            </label>
            <input id="wf-name" aria-label="Workflow name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label htmlFor="wf-numbers" className="text-[13px] font-medium text-fg-2 ml-1">
              {initial ? "Test mode: only these numbers" : "Test with these numbers"}
            </label>
            <input id="wf-numbers" aria-label="Numbers to test with" value={phonesText} onChange={(e) => setPhonesText(e.target.value)} placeholder="+91 99716 94047, +971 50 123 4567" className={`${inputCls} mt-1`} inputMode="tel" />
          </div>
          <p className="md:col-span-2 text-[12.5px] text-fg-3 leading-relaxed">
            In test mode the workflow runs only for these numbers, so nobody else is touched. Use a friend's number or a second phone: a number your company has connected is never answered automatically.{initial ? " Clear the box and save to run it for everyone." : ""}
          </p>
        </section>
      )}
      {stage === "confirm" && draft && !draft.needs.length && !checkError && !checking && (
        <p className="mt-4 text-[12.5px] text-ok flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" aria-hidden /> Checked: every path ends, and every answer goes somewhere.
        </p>
      )}
    </Sheet>
  );
}
