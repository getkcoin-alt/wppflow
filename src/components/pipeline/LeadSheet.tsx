import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import {
  addLeadTask,
  deleteLead,
  deleteLeadTask,
  fetchLead,
  getStoredTenantId,
  updateLead,
  updateLeadTask,
  type Lead,
  type LeadTask,
  type PipelineStage,
} from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls } from "../ui/styles";
import { timeAgo } from "../../utils/timeAgo";
import { describeEvent, dueLabel, followUpOptions, formatMoney, SOURCE_LABELS } from "../../utils/pipeline";
import { useLeadMover } from "./useLeadMover";

// Everything about one lead: where it is, who has it, what it is worth, what to do next, and what has happened.
export function LeadSheet({
  leadId,
  currency,
  stages,
  teammates,
  isManager,
  onClose,
  onOpenChat,
}: {
  leadId: string | null;
  currency: string;
  stages: PipelineStage[];
  teammates: { id: number; name: string }[];
  isManager: boolean;
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
}) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const detail = useQuery({ queryKey: ["lead", tenant, leadId], queryFn: () => fetchLead(leadId!), enabled: !!leadId });
  const [error, setError] = useState("");
  const mover = useLeadMover(setError);
  const refresh = () => Promise.all(["leads", "lead", "lead-tasks"].map((k) => qc.invalidateQueries({ queryKey: [k, tenant] })));
  const lead = detail.data?.lead;

  return (
    <Sheet
      open={!!leadId}
      onClose={onClose}
      title={lead?.contactName || "Lead"}
      subtitle={lead ? `${lead.phone}${lead.source ? ` · ${SOURCE_LABELS[lead.source] || lead.source}` : ""}` : ""}
      footer={
        lead ? (
          <>
            {lead.conversationId && (
              <button type="button" className={btn("secondary")} onClick={() => onOpenChat(lead.conversationId!)}>
                <MessageSquare className="w-4 h-4" /> Open chat
              </button>
            )}
            <button type="button" className={btn("ghost")} onClick={onClose}>
              Close
            </button>
          </>
        ) : undefined
      }
    >
      {detail.isPending && <Loader2 className="w-5 h-5 animate-spin text-fg-3" aria-label="Loading" />}
      {detail.error && <Notice tone="error">{(detail.error as Error).message}</Notice>}
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {lead && detail.data && (
        <div className="space-y-6">
          <section aria-label="Step">
            <p className="text-[13px] font-medium text-fg-2 mb-2">Step</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Move to a step">
              {stages.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={lead.stageId === s.id}
                  disabled={mover.busy}
                  onClick={() => void mover.move(lead, s)}
                  className={`rounded-full px-3.5 h-9 text-[13.5px] ring-1 transition ${lead.stageId === s.id ? (s.kind === "won" ? "bg-ok text-white ring-transparent" : s.kind === "lost" ? "bg-danger text-white ring-transparent" : "bg-brand-solid text-white ring-transparent") : "bg-surface-2 ring-line text-fg-2 hover:ring-gold/60"}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            {lead.status === "lost" && lead.lostReason && <p className="mt-2 text-[13px] text-fg-2">Lost: {lead.lostReason}</p>}
            {lead.status === "won" && lead.value > 0 && <p className="mt-2 text-[13px] text-ok">Won {formatMoney(lead.value, currency)}</p>}
          </section>

          <Details key={lead.id + lead.title + lead.value + (lead.ownerUserId ?? "") + (lead.expectedClose ?? "")} lead={lead} teammates={teammates} onSaved={refresh} onError={setError} />

          <Tasks lead={lead} tasks={detail.data.tasks} onChanged={refresh} onError={setError} />

          <section aria-label="History">
            <p className="text-[13px] font-medium text-fg-2 mb-2">History</p>
            <ol className="space-y-2 text-[13.5px]">
              {detail.data.timeline.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <span className="text-fg-2">{describeEvent(e)}</span>
                  <span className="shrink-0 text-fg-3 text-[12px]">{timeAgo(e.createdAt)}</span>
                </li>
              ))}
            </ol>
          </section>

          {isManager && <Remove lead={lead} onDeleted={async () => { await refresh(); onClose(); }} onError={setError} />}
        </div>
      )}
      {mover.dialog}
    </Sheet>
  );
}

function Details({ lead, teammates, onSaved, onError }: { lead: Lead; teammates: { id: number; name: string }[]; onSaved: () => Promise<unknown>; onError: (m: string) => void }) {
  const [title, setTitle] = useState(lead.title === lead.contactName ? "" : lead.title);
  const [value, setValue] = useState(lead.value ? String(lead.value) : "");
  const [close, setClose] = useState(lead.expectedClose || "");
  const [owner, setOwner] = useState(lead.ownerUserId ? String(lead.ownerUserId) : "");
  const [busy, setBusy] = useState(false);
  const dirty = title !== (lead.title === lead.contactName ? "" : lead.title) || value !== (lead.value ? String(lead.value) : "") || close !== (lead.expectedClose || "") || owner !== (lead.ownerUserId ? String(lead.ownerUserId) : "");
  const save = async () => {
    setBusy(true);
    onError("");
    try {
      await updateLead(lead.id, { title, value: Number(value) || 0, expectedClose: close || null, ownerUserId: owner ? Number(owner) : null });
      await onSaved();
    } catch (e: any) {
      onError(e.message || "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="Details" className="space-y-4">
      <Field label="What is it for?" hint="For example “2 bedroom in Marina”.">
        <input aria-label="What is it for?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} placeholder={lead.contactName} className={inputCls} dir="auto" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Value">
          <input aria-label="Value" type="number" min={0} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Expected close">
          <input aria-label="Expected close" type="date" value={close} onChange={(e) => setClose(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Owner" hint="The chat is assigned to the same person.">
        <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={selectCls}>
          <option value="">Nobody yet</option>
          {teammates.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      {dirty && (
        <button type="button" disabled={busy} onClick={() => void save()} className={btn("primary")}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          Save changes
        </button>
      )}
    </section>
  );
}

function Tasks({ lead, tasks, onChanged, onError }: { lead: Lead; tasks: LeadTask[]; onChanged: () => Promise<unknown>; onError: (m: string) => void }) {
  const [title, setTitle] = useState("Follow up");
  const [at, setAt] = useState("");
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
  const add = (when: Date) => run(() => addLeadTask(lead.id, { title: title.trim() || "Follow up", dueAt: when.toISOString() }));
  return (
    <section aria-label="Follow-ups">
      <p className="text-[13px] font-medium text-fg-2 mb-2">Follow-ups</p>
      <ul className="space-y-2 mb-3">
        {tasks.map((t) => {
          const due = dueLabel(t.dueAt);
          return (
            <li key={t.id} className="flex items-center gap-3 text-[14px]">
              <input type="checkbox" aria-label={`${t.title} is done`} checked={t.done} disabled={busy} onChange={(e) => void run(() => updateLeadTask(t.id, { done: e.target.checked }))} className="h-4 w-4 accent-brand-solid" />
              <span className={`flex-1 min-w-0 truncate ${t.done ? "line-through text-fg-3" : ""}`} dir="auto">
                {t.title}
              </span>
              <span className={`shrink-0 text-[12.5px] ${!t.done && due.late ? "text-danger" : "text-fg-3"}`}>{t.done ? "Done" : due.text}</span>
              <button type="button" aria-label={`Delete ${t.title}`} disabled={busy} onClick={() => void run(() => deleteLeadTask(t.id))} className="h-7 w-7 grid place-items-center rounded-full text-fg-3 hover:text-danger">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          );
        })}
        {!tasks.length && <li className="text-[13.5px] text-fg-3">Nothing planned. Set a follow-up so this lead isn't forgotten.</li>}
      </ul>
      <div className="space-y-2.5">
        <input aria-label="Follow-up" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className={inputCls} dir="auto" />
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

function Remove({ lead, onDeleted, onError }: { lead: Lead; onDeleted: () => Promise<void>; onError: (m: string) => void }) {
  const [sure, setSure] = useState(false);
  return (
    <section aria-label="Remove" className="pt-4 border-t border-line">
      {!sure ? (
        <button type="button" onClick={() => setSure(true)} className="text-[13.5px] text-fg-3 hover:text-danger">
          Delete this lead
        </button>
      ) : (
        <div className="flex items-center gap-3 text-[13.5px]">
          <span>Delete {lead.contactName}'s lead for good?</span>
          <button
            type="button"
            className={btn("secondary", "sm")}
            onClick={async () => {
              try {
                await deleteLead(lead.id);
                await onDeleted();
              } catch (e: any) {
                onError(e.message || "Couldn't delete.");
              }
            }}
          >
            Yes, delete
          </button>
          <button type="button" className={btn("ghost", "sm")} onClick={() => setSure(false)}>
            Keep
          </button>
        </div>
      )}
    </section>
  );
}

