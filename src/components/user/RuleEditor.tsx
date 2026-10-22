import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { RuleAction, RuleDraft, RuleTrigger } from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";
import {
  ACTION_LABELS,
  browserTimezone,
  DEFAULT_HOURS,
  endSentence,
  DAY_NAMES,
  describeRule,
  MATCH_LABELS,
  TIMEZONES,
  TRIGGER_LABELS,
} from "../../utils/automationText";

const FIELDS: [string, string][] = [
  ["{{first_name}}", "First name"],
  ["{{name}}", "Full name"],
  ["{{company}}", "Company"],
];

// One form for every rule: built from a ready-made one, from nothing, or to change a saved one. It starts with
// a sentence saying what the rule will do, so the person can check it reads right.
export function RuleEditor({
  open,
  initial,
  hint,
  editing,
  teammates,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: RuleDraft;
  /** From a ready-made rule that needs the company's own words */
  hint?: string;
  editing: boolean;
  teammates: { id: number; name: string }[];
  onClose: () => void;
  onSave: (rule: RuleDraft) => Promise<void>;
}) {
  return open ? (
    <EditorBody key={`${initial.templateId || "custom"}:${initial.name}`} initial={initial} hint={hint} editing={editing} teammates={teammates} onClose={onClose} onSave={onSave} />
  ) : null;
}

function EditorBody({
  initial,
  hint,
  editing,
  teammates,
  onClose,
  onSave,
}: {
  initial: RuleDraft;
  hint?: string;
  editing: boolean;
  teammates: { id: number; name: string }[];
  onClose: () => void;
  onSave: (rule: RuleDraft) => Promise<void>;
}) {
  const [rule, setRule] = useState<RuleDraft>(initial);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (patch: Partial<RuleDraft>) => setRule((r) => ({ ...r, ...patch }));
  const config = (patch: Partial<RuleDraft["config"]>) => setRule((r) => ({ ...r, config: { ...r.config, ...patch } }));
  const hours = rule.config.hours || DEFAULT_HOURS;
  const zones = TIMEZONES.includes(hours.timezone) ? TIMEZONES : [hours.timezone, ...TIMEZONES];
  const sentence = describeRule(rule);

  const changeTrigger = (triggerType: RuleTrigger) =>
    setRule((r) => ({
      ...r,
      triggerType,
      config: {
        ...r.config,
        ...(triggerType === "after_hours" ? { hours: r.config.hours || { ...DEFAULT_HOURS, timezone: browserTimezone() }, cooldownHours: r.config.cooldownHours ?? 12 } : {}),
        ...(triggerType === "keyword" ? { match: r.config.match || "contains" } : {}),
      },
    }));
  const changeAction = (actionType: RuleAction) =>
    set({ actionType, actionSummary: actionType === rule.actionType ? rule.actionSummary : "" });

  const insert = (token: string, target: "summary" | "reply") => {
    if (target === "summary") set({ actionSummary: rule.actionSummary + token });
    else config({ reply: (rule.config.reply || "") + token });
  };
  const toggleDay = (day: number) => {
    const days = hours.days.includes(day) ? hours.days.filter((d) => d !== day) : [...hours.days, day].sort();
    config({ hours: { ...hours, days } });
  };

  const missing = (): string => {
    if (!rule.name.trim()) return "Give the rule a name.";
    if (rule.triggerType === "keyword" && !rule.triggerCondition.trim()) return "Add at least one word or phrase to look for.";
    if (rule.triggerType === "after_hours" && !hours.days.length) return "Choose the days you are open.";
    if (rule.actionType === "reply_text" && !rule.actionSummary.trim()) return "Write the reply.";
    if (rule.actionType === "assign_agent" && !rule.actionSummary) return "Choose who gets these chats.";
    if (rule.actionType === "add_tag" && !rule.actionSummary.trim()) return "Type the tag to add.";
    return "";
  };
  const save = async () => {
    const problem = missing();
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      const clean: RuleDraft = { ...rule, name: rule.name.trim(), config: { ...rule.config } };
      if (!clean.config.reply?.trim()) delete clean.config.reply;
      if (clean.triggerType !== "keyword") clean.triggerCondition = "";
      await onSave(clean);
    } catch (e: any) {
      setError(e.message || "Couldn't save the rule.");
    } finally {
      setBusy(false);
    }
  };

  const fieldButtons = (target: "summary" | "reply") => (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-[12.5px] text-fg-3">Add the customer's:</span>
      {FIELDS.map(([token, label]) => (
        <button key={token} type="button" onClick={() => insert(token, target)} className="rounded-full px-3 h-8 text-[12.5px] bg-surface-2 ring-1 ring-line hover:ring-gold/60">
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={editing ? "Edit rule" : "New rule"}
      subtitle={editing ? "Changes apply to new messages straight away." : "It starts paused, so you can check it before it goes live."}
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          <button type="button" disabled={busy} className={btn("primary")} onClick={() => void save()}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {editing ? "Save changes" : "Save paused rule"}
          </button>
        </>
      }
    >
      <div className="rounded-2xl bg-surface-2 ring-1 ring-line px-4 py-3 mb-5 text-[14px] leading-relaxed" aria-label="What this rule does">
        <span className="text-fg-2">{sentence.when}, </span>
        <span className="font-medium">{endSentence(sentence.then)}</span>
      </div>
      {hint && <p className="mb-4 text-[13.5px] text-fg-2">{hint}</p>}
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="space-y-4">
        <Field label="Rule name">
          <input aria-label="Rule name" value={rule.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
        </Field>

        <Field label="When">
          <select aria-label="When" value={rule.triggerType} onChange={(e) => changeTrigger(e.target.value as RuleTrigger)} className={selectCls}>
            {(Object.keys(TRIGGER_LABELS) as RuleTrigger[]).map((t) => (
              <option key={t} value={t}>
                {TRIGGER_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        {rule.triggerType === "keyword" && (
          <>
            <Field label="Words or phrases" hint="Separate them with commas. Any one of them starts the rule. Capital letters and punctuation don't matter.">
              <textarea aria-label="Words or phrases" rows={3} value={rule.triggerCondition} onChange={(e) => set({ triggerCondition: e.target.value })} className={textareaCls} />
            </Field>
            <Field label="The message">
              <select aria-label="The message" value={rule.config.match || "contains"} onChange={(e) => config({ match: e.target.value as "contains" | "word" | "exact" })} className={selectCls}>
                {Object.entries(MATCH_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {rule.triggerType === "after_hours" && (
          <fieldset className="rounded-2xl ring-1 ring-line p-4 space-y-3">
            <legend className="px-1 text-[13px] font-medium text-fg-2">Your opening hours</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Days you are open">
              {DAY_NAMES.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={hours.days.includes(i + 1)}
                  onClick={() => toggleDay(i + 1)}
                  className={`h-9 w-12 rounded-full text-[13px] ring-1 transition ${hours.days.includes(i + 1) ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 ring-line hover:ring-gold/60"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opens">
                <input aria-label="Opens" type="time" value={hours.start} onChange={(e) => config({ hours: { ...hours, start: e.target.value } })} className={inputCls} />
              </Field>
              <Field label="Closes">
                <input aria-label="Closes" type="time" value={hours.end} onChange={(e) => config({ hours: { ...hours, end: e.target.value } })} className={inputCls} />
              </Field>
            </div>
            <Field label="Time zone">
              <select aria-label="Time zone" value={hours.timezone} onChange={(e) => config({ hours: { ...hours, timezone: e.target.value } })} className={selectCls}>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>
        )}

        <Field label="Then">
          <select aria-label="Then" value={rule.actionType} onChange={(e) => changeAction(e.target.value as RuleAction)} className={selectCls}>
            {(Object.keys(ACTION_LABELS) as RuleAction[]).map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a]}
              </option>
            ))}
          </select>
        </Field>

        {rule.actionType === "reply_text" && (
          <div>
            <Field label="The reply">
              <textarea aria-label="The reply" rows={5} value={rule.actionSummary} onChange={(e) => set({ actionSummary: e.target.value })} className={textareaCls} />
            </Field>
            {fieldButtons("summary")}
          </div>
        )}
        {rule.actionType === "assign_agent" && (
          <Field label="Assign to" hint={teammates.length ? undefined : "Add teammates under Team first."}>
            <select aria-label="Assign to" value={rule.actionSummary} onChange={(e) => set({ actionSummary: e.target.value })} className={selectCls}>
              <option value="">Choose a teammate…</option>
              {teammates.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {rule.actionType === "add_tag" && (
          <Field label="Tag" hint="You can send a broadcast to everyone with this tag later.">
            <input aria-label="Tag" value={rule.actionSummary} onChange={(e) => set({ actionSummary: e.target.value })} className={inputCls} />
          </Field>
        )}

        {rule.actionType !== "reply_text" && (
          <div>
            <Field label="Also reply with (optional)" hint={rule.actionType === "opt_out" ? "A confirmation, so they know it worked." : "Tell the customer what happens next."}>
              <textarea aria-label="Also reply with" rows={3} value={rule.config.reply || ""} onChange={(e) => config({ reply: e.target.value })} className={textareaCls} />
            </Field>
            {fieldButtons("reply")}
          </div>
        )}

        <Field label="Wait before repeating (hours)" hint="Leave empty to act on every matching message. A customer is never answered more than six times an hour.">
          <input
            aria-label="Wait before repeating"
            type="number"
            min={0}
            max={168}
            value={rule.config.cooldownHours ?? ""}
            onChange={(e) => config({ cooldownHours: e.target.value === "" ? undefined : Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
      </div>
    </Sheet>
  );
}
