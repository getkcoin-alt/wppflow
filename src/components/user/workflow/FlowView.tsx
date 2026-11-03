import { useState } from "react";
import { Bell, Bot, CalendarClock, Check, CornerDownRight, Flag, GitBranch, HelpCircle, ListChecks, MessageCircle, Pencil, Tag, TextCursorInput, UserCheck, UserPlus, Handshake } from "lucide-react";
import type { WorkflowDraft, WorkflowStepType } from "../../../services/api";
import { inputCls, textareaCls } from "../../ui/styles";
import { EDITABLE, STEP_NAMES, prettyFields, valueOf } from "./steps";

const ICONS: Record<WorkflowStepType, typeof Bot> = {
  say: MessageCircle,
  ask: HelpCircle,
  collect: TextCursorInput,
  meeting: CalendarClock,
  branch: GitBranch,
  agent: Bot,
  label: Tag,
  notify: Bell,
  assign: UserCheck,
  lead: UserPlus,
  task: ListChecks,
  handoff: Handshake,
  end: Flag,
};
// the colour of a step's tile: Riwo's own steps gold, steps that tell a person green, the rest quiet
const TONE: Partial<Record<WorkflowStepType, string>> = { agent: "bg-gold/15 text-gold", ask: "bg-gold/15 text-gold", notify: "bg-ok/15 text-ok", handoff: "bg-ok/15 text-ok", meeting: "bg-ok/15 text-ok" };

// how deep a step sits: one more than the step that first leads to it
function depths(outline: WorkflowDraft["outline"]): Record<string, number> {
  const parent: Record<string, string> = {};
  for (const item of outline) for (const g of item.goes) if (!(g.to in parent) && g.to !== item.id) parent[g.to] = item.id;
  const depth: Record<string, number> = {};
  const of = (id: string, guard = 0): number => (id in depth ? depth[id] : (depth[id] = parent[id] && guard < 30 ? of(parent[id], guard + 1) + 1 : 0));
  for (const item of outline) of(item.id);
  return depth;
}

/**
 * The workflow as a list of steps, in the order a customer meets them, with the way each branch goes. Words can be changed in
 * place; whatever is changed is checked by the server again.
 */
export function FlowView({ draft, active, onEdit, disabled = false }: { draft: WorkflowDraft; active: string | null; onEdit: (id: string, field: string, value: string) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const nodes = draft.rule.config.workflow?.nodes || {};
  const number = Object.fromEntries(draft.outline.map((o, i) => [o.id, i + 1]));
  const depth = depths(draft.outline);
  return (
    <ol className="space-y-2.5" aria-label="Steps of the workflow">
      {draft.outline.map((item) => {
        const step = nodes[item.id];
        const Icon = ICONS[item.type] || Bot;
        const fields = EDITABLE[item.type] || [];
        const isEditing = editing === item.id && step;
        const auto = /^(end_auto|handoff_unclear)\d*$/.test(item.id);
        return (
          <li key={item.id} style={{ marginLeft: `${Math.min(depth[item.id] || 0, 4) * 14}px` }} aria-current={active === item.id ? "step" : undefined}>
            {item.via && (
              <p className="flex items-center gap-1 text-[12px] text-fg-3 mb-1 ml-1">
                <CornerDownRight className="w-3 h-3" aria-hidden /> {item.via}
              </p>
            )}
            <div className={`rounded-2xl bg-surface-2 ring-1 px-3.5 py-3 transition ${active === item.id ? "ring-gold shadow-card" : "ring-line"} ${auto ? "opacity-80" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 shrink-0 grid place-items-center rounded-xl ${TONE[item.type] || "bg-surface text-fg-2"}`} aria-hidden>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-fg-3">
                    <span className="num">{number[item.id]}.</span> {STEP_NAMES[item.type]}
                    {auto && " (added by Riwo)"}
                  </p>
                  {isEditing ? (
                    <div className="mt-1.5 space-y-2">
                      {fields.map((f) =>
                        f.long ? (
                          <textarea key={f.field} aria-label={f.label} rows={3} value={valueOf(step, f.field)} onChange={(e) => onEdit(item.id, f.field, e.target.value)} className={`${textareaCls} !min-h-0 text-[14px]`} maxLength={1000} />
                        ) : (
                          <input key={f.field} aria-label={f.label} value={valueOf(step, f.field)} onChange={(e) => onEdit(item.id, f.field, e.target.value)} className={`${inputCls} !h-10 text-[14px]`} maxLength={300} />
                        ),
                      )}
                      <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand">
                        <Check className="w-3.5 h-3.5" aria-hidden /> Done
                      </button>
                    </div>
                  ) : (
                    <p className="text-[14px] leading-snug mt-0.5 whitespace-pre-line break-words">{prettyFields(item.summary)}</p>
                  )}
                  {item.type === "ask" && item.goes.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Where each answer goes">
                      {item.goes.map((g) => (
                        <li key={g.label} className="rounded-full bg-surface ring-1 ring-line px-2.5 h-6 inline-flex items-center text-[12px]">
                          {g.label} <span className="mx-1 text-fg-3">→</span> <span className="num">{number[g.to]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.type === "branch" && item.goes.length > 0 && (
                    <p className="mt-1.5 text-[12px] text-fg-3">{item.goes.map((g) => `${g.label} → ${number[g.to]}`).join("  ·  ")}</p>
                  )}
                </div>
                {fields.length > 0 && !isEditing && !disabled && (
                  <button type="button" onClick={() => setEditing(item.id)} aria-label={`Edit step ${number[item.id]}`} className="h-8 w-8 shrink-0 grid place-items-center rounded-full text-fg-3 hover:text-fg hover:bg-surface">
                    <Pencil className="w-3.5 h-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
