import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addAutomation,
  fetchAutomationTemplates,
  removeAutomation,
  toggleAutomationApi,
  updateAutomation,
  type AutomationTemplate,
  type RuleDraft,
} from "../../services/api";
import { Notice, Page, PageHeader, Pill } from "../ui/Page";
import { btn } from "../ui/styles";
import { RuleEditor } from "./RuleEditor";
import { blankRule, describeRule, endSentence, withOwnTimezone } from "../../utils/automationText";

type Editing = { rule: RuleDraft; id?: string; hint?: string };

const ruleOf = (a: any): RuleDraft => ({
  name: a.name,
  triggerType: a.triggerType || "keyword",
  triggerCondition: a.triggerCondition || "",
  actionType: a.actionType,
  actionSummary: a.actionSummary || "",
  templateId: a.templateId || null,
  config: a.config || {},
});

export function Automations({
  automations,
  teammates = [],
  onChanged,
}: {
  automations: any[];
  teammates?: { id: number; name: string }[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Editing | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const templates = useQuery({
    queryKey: ["automation-templates"],
    queryFn: fetchAutomationTemplates,
    staleTime: 60 * 60 * 1000,
  });
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const fromTemplate = (t: AutomationTemplate) =>
    setEditing({
      rule: withOwnTimezone({ name: t.name, templateId: t.id, ...t.rule, config: { ...t.rule.config } }),
      hint: t.hint,
    });
  const added = new Set(automations.map((a) => a.templateId).filter(Boolean));
  const groups = [...new Set((templates.data?.templates || []).map((t) => t.group))];

  const gallery = (
    <section aria-labelledby="ready-made" className={automations.length ? "mt-10" : ""}>
      <h2 id="ready-made" className="text-[20px] font-semibold">
        Ready-made rules
      </h2>
      <p className="text-[14px] text-fg-2 mt-1 mb-5 max-w-2xl">
        Pick one, add the details only you know, and save it. Nothing goes live until you turn it on.
      </p>
      {templates.isPending && <p className="text-[14px] text-fg-3">Loading…</p>}
      {templates.error && <Notice tone="error">{(templates.error as Error).message}</Notice>}
      <div className="space-y-7">
        {groups.map((group) => (
          <div key={group}>
            <h3 className="text-[13px] font-medium text-fg-2 uppercase tracking-wide mb-3">{group}</h3>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {templates.data?.templates
                .filter((t) => t.group === group)
                .map((t) => (
                  <article key={t.id} className="card p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[15.5px] font-semibold leading-snug">{t.name}</h4>
                      {added.has(t.id) ? <Pill tone="ok">Added</Pill> : t.recommended ? <Pill tone="gold">Recommended</Pill> : null}
                    </div>
                    <p className="mt-2 text-[13.5px] text-fg-2 leading-relaxed flex-1">{t.description}</p>
                    <button type="button" onClick={() => fromTemplate(t)} className={`${btn("secondary", "sm")} mt-4 self-start`}>
                      <Plus className="w-4 h-4" /> {added.has(t.id) ? "Add another" : "Use this rule"}
                    </button>
                  </article>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Automate"
        title="Automations"
        subtitle="Rules answer, route and organise new customer messages for you. New rules start paused until you turn them on."
        actions={
          <button onClick={() => setEditing({ rule: blankRule() })} className={btn("primary")}>
            <Plus className="w-4 h-4" /> New rule
          </button>
        }
      />
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <RuleEditor
        open={!!editing}
        initial={editing?.rule || blankRule()}
        hint={editing?.hint}
        editing={!!editing?.id}
        teammates={teammates}
        onClose={() => setEditing(null)}
        onSave={async (rule) => {
          if (editing?.id) await updateAutomation(editing.id, rule);
          else await addAutomation(rule);
          setEditing(null);
          onChanged();
        }}
      />

      {!automations.length ? (
        <div className="card p-6 mb-8 flex items-start gap-4">
          <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
            <Bot className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold">No rules yet</h2>
            <p className="text-[14px] text-fg-2 mt-1 max-w-xl">
              Start with the recommended ones below: a welcome for new customers, an away message after hours, and the STOP and SUBSCRIBE replies that let customers manage their own broadcast permission.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {automations.map((a) => {
            const sentence = describeRule(ruleOf(a));
            return (
              <article key={a.id} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[18px] font-semibold">{a.name}</h2>
                  <Pill tone={a.isEnabled ? "ok" : "neutral"} dot>
                    {a.isEnabled ? "Live" : "Paused"}
                  </Pill>
                </div>
                <p className="mt-3 text-[14px] text-fg-2">{sentence.when},</p>
                <p className="mt-1 text-[15px] text-fg leading-relaxed">{endSentence(sentence.then)}</p>
                <p className="mt-4 text-[12.5px] text-fg-3">
                  Completed executions: {a.executionsCount}
                  {a.config?.cooldownHours ? ` · waits ${a.config.cooldownHours} h before repeating` : ""}
                </p>
                <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button disabled={busy} onClick={() => void run(() => toggleAutomationApi(a.id))} className={btn("secondary", "sm")}>
                      {a.isEnabled ? "Pause" : "Enable"}
                    </button>
                    <button disabled={busy} onClick={() => setEditing({ rule: ruleOf(a), id: a.id })} className={btn("ghost", "sm")} aria-label={`Edit ${a.name}`}>
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  </div>
                  <button
                    disabled={busy}
                    aria-label={`Delete ${a.name}`}
                    className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-danger hover:bg-danger/10 transition"
                    onClick={() => void run(() => removeAutomation(a.id))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {gallery}
    </Page>
  );
}
