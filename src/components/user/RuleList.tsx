import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Pill } from "../ui/Page";
import { btn } from "../ui/styles";
import { Insights } from "./workflow/Insights";
import { describeRule, endSentence } from "../../utils/automationText";

export type RuleFilter = "all" | "live" | "paused";

/** "3 live · 4 paused" */
export const summaryText = (rules: { isEnabled: boolean }[]) => {
  const live = rules.filter((r) => r.isEnabled).length;
  return `${live} live · ${rules.length - live} paused`;
};

export const filterRules = <T extends { isEnabled: boolean }>(rules: T[], filter: RuleFilter) => (filter === "all" ? rules : rules.filter((r) => (filter === "live" ? r.isEnabled : !r.isEnabled)));

/** One saved rule: what it does in plain words, whether it is live, and the things to do with it. Deleting asks first, in the card. */
function RuleCard({
  rule,
  sentence,
  busy,
  onToggle,
  onEdit,
  onRemove,
  onForEveryone,
}: {
  rule: any;
  sentence: { when: string; then: string };
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onForEveryone: () => void;
}) {
  const [asking, setAsking] = useState(false);
  return (
    <article className="card p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[18px] font-semibold">{rule.name}</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {rule.config?.pilot?.enabled && <Pill tone="gold">Test mode</Pill>}
          <Pill tone={rule.isEnabled ? "ok" : "neutral"} dot>
            {rule.isEnabled ? "Live" : "Paused"}
          </Pill>
        </div>
      </div>
      <p className="mt-3 text-[14px] text-fg-2">{sentence.when},</p>
      <p className="mt-1 text-[15px] text-fg leading-relaxed">{endSentence(sentence.then)}</p>
      {rule.actionType === "workflow" && <Insights id={rule.id} />}
      <p className="mt-4 text-[12.5px] text-fg-3">
        Completed executions: {rule.executionsCount}
        {rule.config?.cooldownHours ? ` · waits ${rule.config.cooldownHours} h before repeating` : ""}
      </p>
      {asking ? (
        <div className="mt-5 rounded-2xl bg-danger/10 p-4" role="alertdialog" aria-label={`Delete ${rule.name}?`}>
          <p className="text-[14.5px] text-fg">
            Delete <strong>{rule.name}</strong>? It stops working at once and cannot be brought back. {rule.isEnabled ? "You can pause it instead and keep it for later." : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={onRemove} className={btn("danger", "sm")}>
              Yes, delete it
            </button>
            <button type="button" onClick={() => setAsking(false)} className={btn("ghost", "sm")}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button disabled={busy} onClick={onToggle} className={btn("secondary", "sm")}>
              {rule.isEnabled ? "Pause" : "Enable"}
            </button>
            <button disabled={busy} onClick={onEdit} className={btn("ghost", "sm")} aria-label={`Edit ${rule.name}`}>
              <Pencil className="w-4 h-4" /> Edit
            </button>
            {rule.config?.pilot?.enabled && (
              <button disabled={busy} onClick={onForEveryone} className={btn("ghost", "sm")} aria-label={`Run ${rule.name} for everyone`}>
                For everyone
              </button>
            )}
          </div>
          <button disabled={busy} aria-label={`Delete ${rule.name}`} className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-danger hover:bg-danger/10 transition" onClick={() => setAsking(true)}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </article>
  );
}

/** The company's rules, with a count of what is live and a way to look at only the live or only the paused ones. */
export function RuleList({
  rules,
  busy,
  describe,
  onToggle,
  onEdit,
  onRemove,
  onForEveryone,
}: {
  rules: any[];
  busy: boolean;
  describe: (rule: any) => { when: string; then: string };
  onToggle: (rule: any) => void;
  onEdit: (rule: any) => void;
  onRemove: (rule: any) => void;
  onForEveryone: (rule: any) => void;
}) {
  const [filter, setFilter] = useState<RuleFilter>("all");
  const shown = filterRules(rules, filter);
  const live = rules.filter((r) => r.isEnabled).length;
  const counts: Record<RuleFilter, number> = { all: rules.length, live, paused: rules.length - live };
  return (
    <section aria-label="Your rules">
      {rules.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-fg-2" aria-live="polite">
            {summaryText(rules)}
          </p>
          <div role="group" aria-label="Show rules" className="inline-flex rounded-full bg-surface-2 p-1">
            {(["all", "live", "paused"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`min-h-11 rounded-full px-4 text-[13.5px] font-medium capitalize transition ${filter === f ? "bg-surface text-fg shadow-sm" : "text-fg-3 hover:text-fg"}`}>
                {f} ({counts[f]})
              </button>
            ))}
          </div>
        </div>
      )}
      {shown.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {shown.map((a) => (
            <RuleCard key={a.id} rule={a} sentence={describe(a)} busy={busy} onToggle={() => onToggle(a)} onEdit={() => onEdit(a)} onRemove={() => onRemove(a)} onForEveryone={() => onForEveryone(a)} />
          ))}
        </div>
      ) : (
        <p className="card p-6 text-[14.5px] text-fg-2">{filter === "live" ? "None of your rules is live. Enable one to start it." : "No rule is paused."}</p>
      )}
    </section>
  );
}
