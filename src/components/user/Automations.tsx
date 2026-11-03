import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Briefcase, Globe2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  addAutomation,
  fetchAutomationContext,
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
import { AbroadRecipe } from "./AbroadRecipe";
import { SalesRecipe } from "./SalesRecipe";
import { AgentRecipe } from "./AgentRecipe";
import { WorkflowBuilder, type BuilderInitial } from "./workflow/WorkflowBuilder";
import { Insights } from "./workflow/Insights";
import { KnowledgeCard } from "./KnowledgeCard";
import { AssignmentRule } from "./AssignmentRule";
import { blankRule, describeRule, endSentence, withOwnTimezone } from "../../utils/automationText";

type Editing = { rule: RuleDraft; id?: string; hint?: string };

// What the "welcome people from other countries" recipe starts from when it is not taken from the gallery
const abroadStart = (): RuleDraft => ({
  name: "Welcome people from other countries",
  triggerType: "foreign_number",
  triggerCondition: "",
  actionType: "ai_chat",
  actionSummary: "",
  templateId: "foreign-welcome-riwo",
  config: {},
});

// the sales assistant is a Riwo chat that asks questions and hands pricing requests to an executive
const isSales = (r: { config?: { sales?: { enabled?: boolean } } }) => r.config?.sales?.enabled === true;
// the Riwo sales agent: a whole conversation from the knowledge base, toward a goal described in the owner's own words
const isAgent = (r: { config?: { agent?: { enabled?: boolean } } }) => r.config?.agent?.enabled === true;
const agentStart = (): RuleDraft => ({
  name: "Riwo sales agent",
  triggerType: "first_message",
  triggerCondition: "",
  actionType: "ai_chat",
  actionSummary: "",
  templateId: null,
  config: {},
});
const salesStart = (): RuleDraft => ({
  name: "Sales assistant",
  triggerType: "first_message",
  triggerCondition: "",
  actionType: "ai_chat",
  actionSummary: "",
  templateId: "sales-assistant",
  config: {},
});

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
    [recipe, setRecipe] = useState<Editing | null>(null),
    [salesRecipe, setSalesRecipe] = useState<Editing | null>(null),
    [agentRecipe, setAgentRecipe] = useState<Editing | null>(null),
    [builder, setBuilder] = useState<{ initial: BuilderInitial | null } | null>(null),
    [notice, setNotice] = useState(""),
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
  // used to say "United Arab Emirates" instead of "+971" in the sentences below
  const context = useQuery({ queryKey: ["automation-context"], queryFn: fetchAutomationContext, staleTime: 60_000 });
  const countryName = (code: string) => context.data?.countries.find((c) => c.code === code)?.name || `+${code}`;
  // a workflow in test mode only runs for the numbers its owner listed; this makes it run for everyone
  const switchOnForEveryone = (a: any) =>
    run(async () => {
      const { pilot: _pilot, ...config } = a.config || {};
      void _pilot;
      await updateAutomation(a.id, { ...ruleOf(a), config });
    });
  const edit = (a: any) =>
    a.actionType === "workflow" ? setBuilder({ initial: { id: a.id, rule: ruleOf(a) } }) : isAgent(a) ? setAgentRecipe({ rule: ruleOf(a), id: a.id }) : isSales(a) ? setSalesRecipe({ rule: ruleOf(a), id: a.id }) : a.triggerType === "foreign_number" ? setRecipe({ rule: ruleOf(a), id: a.id }) : setEditing({ rule: ruleOf(a), id: a.id });
  const fromTemplate = (t: AutomationTemplate) =>
    isSales(t.rule)
      ? setSalesRecipe({ rule: { name: t.name, templateId: t.id, ...t.rule, config: { ...t.rule.config } }, hint: t.hint })
      : t.rule.triggerType === "foreign_number"
      ? setRecipe({ rule: { name: t.name, templateId: t.id, ...t.rule, config: { ...t.rule.config } }, hint: t.hint })
      : setEditing({
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
          <>
            <button onClick={() => setBuilder({ initial: null })} className={btn("secondary")}>
              <Sparkles className="w-4 h-4" /> Describe it in words
            </button>
            <button onClick={() => setEditing({ rule: blankRule() })} className={btn("primary")}>
              <Plus className="w-4 h-4" /> New rule
            </button>
          </>
        }
      />
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {notice && (
        <div className="mb-4">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <WorkflowBuilder
        open={!!builder}
        initial={builder?.initial || null}
        onClose={() => setBuilder(null)}
        onSaved={(message) => {
          setBuilder(null);
          setNotice(message);
          onChanged();
        }}
      />

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

      <AgentRecipe
        open={!!agentRecipe}
        initial={agentRecipe?.rule || agentStart()}
        editing={!!agentRecipe?.id}
        onClose={() => setAgentRecipe(null)}
        onSave={async (rule, turnOn) => {
          if (agentRecipe?.id) await updateAutomation(agentRecipe.id, rule);
          else {
            const created = await addAutomation(rule);
            if (turnOn)
              try {
                await toggleAutomationApi(created.automation.id);
              } catch (e: any) {
                setAgentRecipe(null);
                onChanged();
                setError(`Saved, but it is still paused: ${e.message}`);
                return;
              }
          }
          setAgentRecipe(null);
          onChanged();
        }}
      />

      <SalesRecipe
        open={!!salesRecipe}
        initial={salesRecipe?.rule || salesStart()}
        editing={!!salesRecipe?.id}
        onClose={() => setSalesRecipe(null)}
        onSave={async (rule, turnOn) => {
          if (salesRecipe?.id) await updateAutomation(salesRecipe.id, rule);
          else {
            const created = await addAutomation(rule);
            if (turnOn)
              try {
                await toggleAutomationApi(created.automation.id);
              } catch (e: any) {
                setSalesRecipe(null);
                onChanged();
                setError(`Saved, but it is still paused: ${e.message}`);
                return;
              }
          }
          setSalesRecipe(null);
          onChanged();
        }}
      />

      <AbroadRecipe
        open={!!recipe}
        initial={recipe?.rule || abroadStart()}
        editing={!!recipe?.id}
        onClose={() => setRecipe(null)}
        onSave={async (rule, turnOn) => {
          if (recipe?.id) await updateAutomation(recipe.id, rule);
          else {
            const created = await addAutomation(rule);
            // a failed switch-on leaves the rule saved and paused; say so instead of pretending it is live
            if (turnOn)
              try {
                await toggleAutomationApi(created.automation.id);
              } catch (e: any) {
                setRecipe(null);
                onChanged();
                setError(`Saved, but it is still paused: ${e.message}`);
                return;
              }
          }
          setRecipe(null);
          onChanged();
        }}
      />

      {!automations.some((a) => a.actionType === "workflow") && (
        <section aria-label="Describe a workflow in your own words" className="card p-6 mb-8 flex flex-wrap items-center gap-5 bg-gradient-to-br from-brand/5 via-transparent to-gold/10">
          <img src="/brand/riwo-wave.webp" alt="" width={84} height={84} className="h-[84px] w-[84px] rounded-3xl object-cover shrink-0" />
          <div className="flex-1 min-w-[16rem]">
            <h2 className="text-[18px] font-semibold">Just tell Riwo what you want</h2>
            <p className="text-[14px] text-fg-2 mt-1 max-w-2xl">
              Write it the way you would tell a new team member, in any language. Riwo builds the whole workflow for you, adds the safety, shows it back in plain steps and lets you try it as a customer before anyone real sees it.
            </p>
          </div>
          <button type="button" className={btn("primary")} onClick={() => setBuilder({ initial: null })}>
            <Sparkles className="w-4 h-4" aria-hidden /> Describe it
          </button>
        </section>
      )}

      <KnowledgeCard />

      {!automations.some(isAgent) && (
        <section aria-label="Riwo sales agent" className="card p-6 mb-8 flex flex-wrap items-start gap-4">
          <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-gold/15 text-gold">
            <Sparkles className="w-5 h-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-[16rem]">
            <h2 className="text-[17px] font-semibold">Riwo sales agent</h2>
            <p className="text-[14px] text-fg-2 mt-1 max-w-2xl">
              Describe in your own words how you want customers handled. Riwo talks to every new customer from your knowledge base, finds out what they need, recommends the right product and moves them to the next step. It never invents a price, and a person takes over when the customer is ready.
            </p>
          </div>
          <button type="button" className={btn("primary")} onClick={() => setAgentRecipe({ rule: agentStart() })}>
            <Plus className="w-4 h-4" aria-hidden /> Set it up
          </button>
        </section>
      )}

      {!automations.some(isSales) && (
        <section aria-label="Sales assistant" className="card p-6 mb-8 flex flex-wrap items-start gap-4">
          <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
            <Briefcase className="w-5 h-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-[16rem]">
            <h2 className="text-[17px] font-semibold">Sales assistant</h2>
            <p className="text-[14px] text-fg-2 mt-1 max-w-2xl">
              Riwo asks new customers your questions and keeps the answers. When they ask for pricing or a proposal, it sends your formal message, hands the chat to an executive with a summary, and adds them to your pipeline.
            </p>
          </div>
          <button type="button" className={btn("primary")} onClick={() => setSalesRecipe({ rule: salesStart() })}>
            <Plus className="w-4 h-4" aria-hidden /> Set it up
          </button>
        </section>
      )}

      {!automations.some((a) => a.triggerType === "foreign_number") && (
        <section aria-label="Welcome people from other countries" className="card p-6 mb-8 flex flex-wrap items-start gap-4">
          <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
            <Globe2 className="w-5 h-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-[16rem]">
            <h2 className="text-[17px] font-semibold">Welcome people from other countries</h2>
            <p className="text-[14px] text-fg-2 mt-1 max-w-2xl">
              When a number from abroad writes to you for the first time, send a warm welcome, ask where they found you, and let Riwo answer their short questions until your team replies.
            </p>
          </div>
          <button type="button" className={btn("primary")} onClick={() => setRecipe({ rule: abroadStart() })}>
            <Plus className="w-4 h-4" aria-hidden /> Set it up
          </button>
        </section>
      )}

      <AssignmentRule />

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
            const sentence = describeRule(ruleOf(a), countryName);
            return (
              <article key={a.id} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[18px] font-semibold">{a.name}</h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {a.config?.pilot?.enabled && <Pill tone="gold">Test mode</Pill>}
                    <Pill tone={a.isEnabled ? "ok" : "neutral"} dot>
                      {a.isEnabled ? "Live" : "Paused"}
                    </Pill>
                  </div>
                </div>
                <p className="mt-3 text-[14px] text-fg-2">{sentence.when},</p>
                <p className="mt-1 text-[15px] text-fg leading-relaxed">{endSentence(sentence.then)}</p>
                {a.actionType === "workflow" && <Insights id={a.id} />}
                <p className="mt-4 text-[12.5px] text-fg-3">
                  Completed executions: {a.executionsCount}
                  {a.config?.cooldownHours ? ` · waits ${a.config.cooldownHours} h before repeating` : ""}
                </p>
                <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button disabled={busy} onClick={() => void run(() => toggleAutomationApi(a.id))} className={btn("secondary", "sm")}>
                      {a.isEnabled ? "Pause" : "Enable"}
                    </button>
                    <button disabled={busy} onClick={() => edit(a)} className={btn("ghost", "sm")} aria-label={`Edit ${a.name}`}>
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    {a.config?.pilot?.enabled && (
                      <button disabled={busy} onClick={() => void switchOnForEveryone(a)} className={btn("ghost", "sm")} aria-label={`Run ${a.name} for everyone`}>
                        For everyone
                      </button>
                    )}
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
