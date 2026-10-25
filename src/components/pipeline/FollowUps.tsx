import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteLeadTask, updateLeadTask, type LeadTask } from "../../services/api";
import { Pill } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import { dueLabel, followUpOptions } from "../../utils/pipeline";

// The follow-ups on a lead or a chat: tick one off, plan another for a ready-made time or a chosen one, and (for a
// manager) hand one to a teammate. Shared by the lead sheet and the chat's own follow-ups.
export function FollowUps({
  tasks,
  onAdd,
  onChanged,
  onError,
  empty,
  teammates = [],
  canAssign = false,
}: {
  tasks: LeadTask[];
  onAdd: (data: { title: string; dueAt: string; assignedUserId?: number }) => Promise<unknown>;
  onChanged: () => Promise<unknown>;
  onError: (m: string) => void;
  empty: string;
  teammates?: { id: number; name: string }[];
  canAssign?: boolean;
}) {
  const [title, setTitle] = useState("Follow up");
  const [at, setAt] = useState("");
  const [who, setWho] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    onError("");
    try {
      await fn();
      await onChanged();
    } catch (e: any) {
      onError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const add = (when: Date) => run(() => onAdd({ title: title.trim() || "Follow up", dueAt: when.toISOString(), ...(canAssign && who ? { assignedUserId: Number(who) } : {}) }));
  return (
    <section aria-label="Follow-ups">
      <p className="text-[13px] font-medium text-fg-2 mb-2">Follow-ups</p>
      <ul className="space-y-2 mb-3">
        {tasks.map((t) => {
          const due = dueLabel(t.dueAt);
          return (
            <li key={t.id} className="flex items-center gap-3 text-[14px]">
              <input type="checkbox" aria-label={`${t.title} is done`} checked={t.done} disabled={busy} onChange={(e) => void run(() => updateLeadTask(t.id, { done: e.target.checked }))} className="h-4 w-4 accent-brand-solid" />
              <span className={`flex-1 min-w-0 [overflow-wrap:anywhere] ${t.done ? "line-through text-fg-3" : ""}`} dir="auto">
                {t.title}
              </span>
              {!t.done && t.escalated && <Pill tone="danger">Escalated</Pill>}
              {canAssign && !t.done && teammates.length > 0 && (
                <select
                  aria-label={`Who has “${t.title}”`}
                  value={t.assignedUserId ?? ""}
                  disabled={busy}
                  onChange={(e) => e.target.value && void run(() => updateLeadTask(t.id, { assignedUserId: Number(e.target.value) }))}
                  className="h-8 rounded-full bg-surface-2 px-2.5 text-[12.5px] max-w-[120px] shrink-0"
                >
                  {t.assignedUserId == null && <option value="">Nobody</option>}
                  {teammates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
              <span className={`shrink-0 text-[12.5px] ${!t.done && due.late ? "text-danger" : "text-fg-3"}`}>{t.done ? "Done" : due.text}</span>
              <button type="button" aria-label={`Delete ${t.title}`} disabled={busy} onClick={() => void run(() => deleteLeadTask(t.id))} className="h-7 w-7 grid place-items-center rounded-full text-fg-3 hover:text-danger">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          );
        })}
        {!tasks.length && <li className="text-[13.5px] text-fg-3">{empty}</li>}
      </ul>
      <div className="space-y-2.5">
        <input aria-label="Follow-up" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className={inputCls} dir="auto" />
        {canAssign && teammates.length > 0 && (
          <select aria-label="Give it to" value={who} onChange={(e) => setWho(e.target.value)} className={selectCls}>
            <option value="">Me</option>
            {teammates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {followUpOptions().map((o) => (
            <button key={o.key} type="button" disabled={busy} onClick={() => void add(o.at)} className="rounded-full px-3.5 h-9 text-[13.5px] bg-surface-2 ring-1 ring-line hover:ring-gold/60">
              {o.label}
            </button>
          ))}
          <input aria-label="Pick a time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="h-9 rounded-full bg-surface-2 px-3 text-[13px]" />
          <button type="button" disabled={busy || !at} onClick={() => void add(new Date(at))} className={btn("secondary", "sm")}>
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
