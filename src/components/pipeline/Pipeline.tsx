import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Funnel, Plus, Search, Settings2, X } from "lucide-react";
import {
  fetchLeadBoard,
  fetchLeadTasks,
  fetchLeads,
  getStoredTenantId,
  updateLeadTask,
  type Lead,
  type LeadFilters,
  type LeadTask,
} from "../../services/api";
import { EmptyState, Notice, Page, PageHeader, Segmented } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import { endOfToday, formatMoney, shortMoney } from "../../utils/pipeline";
import type { WhatsAppSession } from "../../types";
import { Board } from "./Board";
import { LeadList } from "./LeadList";
import { LeadSheet } from "./LeadSheet";
import { NewLeadSheet } from "./NewLeadSheet";
import { PipelineSettings } from "./PipelineSettings";
import { TodayList } from "./TodayList";
import { useLeadMover } from "./useLeadMover";
import { usePipelineSettings } from "./usePipelineSettings";

type View = "board" | "list" | "today";

// The sales pipeline: leads as a board, as a list, and as today's follow-ups.
export function Pipeline({
  teammates,
  sessions,
  currentUserId,
  isManager,
  aiAvailable,
  onOpenChat,
}: {
  teammates: { id: number; name: string }[];
  sessions: WhatsAppSession[];
  currentUserId: number;
  isManager: boolean;
  aiAvailable: boolean;
  onOpenChat: (conversationId: string) => void;
}) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const [view, setView] = useState<View>("board");
  const [input, setInput] = useState(""),
    [q, setQ] = useState(""),
    [owner, setOwner] = useState(""),
    [number, setNumber] = useState(""),
    [overdue, setOverdue] = useState(false),
    [stage, setStage] = useState<{ id: string; name: string } | null>(null),
    [limit, setLimit] = useState(50),
    [everyone, setEveryone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null),
    [adding, setAdding] = useState(false),
    [configuring, setConfiguring] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const filters: LeadFilters = {
    ...(q ? { q } : {}),
    ...(owner === "me" ? { mine: true } : owner === "none" ? { owner: "none" } : owner ? { owner } : {}),
    ...(number ? { number } : {}),
    ...(overdue ? { overdue: true } : {}),
  };
  const settings = usePipelineSettings();
  const board = useQuery({ queryKey: ["leads", tenant, "board", filters], queryFn: () => fetchLeadBoard(filters), enabled: view === "board" });
  const list = useQuery({
    queryKey: ["leads", tenant, "list", filters, stage?.id, limit],
    queryFn: () => fetchLeads({ ...filters, ...(stage ? { stage: stage.id } : {}), limit }),
    enabled: view === "list",
  });
  const until = endOfToday().toISOString();
  const today = useQuery({
    queryKey: ["lead-tasks", tenant, "today", everyone],
    queryFn: () => fetchLeadTasks({ when: "today", until, everyone: everyone && isManager }),
  });
  const mover = useLeadMover(setError);
  const currency = board.data?.currency || settings.data?.currency || "AED";
  const stages = (settings.data?.stages || []).map(({ id, name, kind, position }) => ({ id, name, kind, position }));
  const refresh = () => Promise.all(["leads", "lead", "lead-tasks"].map((k) => qc.invalidateQueries({ queryKey: [k, tenant] })));
  const tasks: LeadTask[] = today.data?.tasks || [];
  const totals = board.data?.totals;

  const doneTask = async (t: LeadTask) => {
    try {
      await updateLeadTask(t.id, { done: true });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const snooze = async (t: LeadTask) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      await updateLeadTask(t.id, { dueAt: tomorrow.toISOString() });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const reassign = async (t: LeadTask, userId: number) => {
    try {
      await updateLeadTask(t.id, { assignedUserId: userId });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const showAll = (c: { id: string; name: string }) => {
    setStage({ id: c.id, name: c.name });
    setLimit(50);
    setView("list");
  };

  const empty = view === "board" && board.data && board.data.stages.every((c) => c.count === 0) && !q && !owner && !number && !overdue;

  return (
    <Page>
      <PageHeader
        eyebrow="Sell"
        title="Pipeline"
        subtitle="Every customer you are selling to, step by step. Open a lead to set a follow-up so nobody is forgotten."
        actions={
          <>
            {isManager && (
              <button className={btn("secondary")} onClick={() => setConfiguring(true)} aria-label="Pipeline settings">
                <Settings2 className="w-4 h-4" /> Settings
              </button>
            )}
            <button className={btn("primary")} onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4" /> New lead
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
      {totals && view === "board" && (
        <dl className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          {[
            { label: "Open leads", short: "Open", full: String(totals.open), compact: String(totals.open) },
            { label: "In the pipeline", short: `Pipeline (${currency})`, full: formatMoney(totals.openValue, currency), compact: shortMoney(totals.openValue) },
            { label: "Won in 30 days", short: `Won (${currency})`, full: formatMoney(totals.won, currency), compact: shortMoney(totals.won) },
          ].map((t) => (
            <div key={t.label} className="card p-3 sm:p-4">
              <dt className="text-[12px] sm:text-[12.5px] text-fg-3 truncate">
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </dt>
              <dd className="mt-1 text-[18px] sm:text-[22px] font-semibold num truncate" title={t.full}>
                <span className="hidden sm:inline">{t.full}</span>
                <span className="sm:hidden">{t.compact}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Segmented<View>
          label="Pipeline views"
          value={view}
          onChange={(v) => {
            setView(v);
            if (v !== "list") setStage(null);
          }}
          items={[
            { key: "board", label: "Board" },
            { key: "list", label: "List" },
            { key: "today", label: tasks.length ? `Today (${tasks.length})` : "Today" },
          ]}
        />
        {view !== "today" && (
          <>
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" aria-hidden />
              <input aria-label="Search leads" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search name or number" className={`${inputCls} !h-10 pl-11`} />
            </div>
            <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={`${selectCls} !h-10 !w-auto`}>
              <option value="">Everyone's leads</option>
              <option value="me">Mine</option>
              <option value="none">Unowned</option>
              {teammates
                .filter((m) => m.id !== currentUserId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            {sessions.length > 1 && (
              <select aria-label="Number" value={number} onChange={(e) => setNumber(e.target.value)} className={`${selectCls} !h-10 !w-auto`}>
                <option value="">All numbers</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.sessionKey}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            )}
            <button type="button" aria-pressed={overdue} onClick={() => setOverdue(!overdue)} className={`rounded-full px-3.5 h-10 text-[13.5px] ring-1 transition ${overdue ? "bg-danger text-white ring-transparent" : "bg-surface-2 ring-line text-fg-2"}`}>
              Late follow-ups
            </button>
          </>
        )}
        {view === "today" && isManager && (
          <label className="flex items-center gap-2 text-[13.5px] text-fg-2">
            <input type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} className="h-4 w-4 accent-brand-solid" />
            Show everyone's
          </label>
        )}
        {stage && view === "list" && (
          <button type="button" onClick={() => setStage(null)} className="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-[13px] bg-surface-2 ring-1 ring-line">
            {stage.name} <X className="w-3.5 h-3.5" aria-label="Show every step" />
          </button>
        )}
      </div>

      {view === "board" && board.isPending && <div className="skeleton h-64 !rounded-3xl" aria-busy />}
      {view === "board" && board.error && <Notice tone="error">{(board.error as Error).message}</Notice>}
      {empty && (
        <EmptyState
          icon={<Funnel className="w-6 h-6" />}
          title="No leads yet"
          body="Add a customer from a chat with one tap, or press New lead. Managers can also turn on “Add every new customer as a lead” in Settings."
          action={
            <button className={btn("primary")} onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4" /> New lead
            </button>
          }
        />
      )}
      {view === "board" && board.data && !empty && <Board board={board.data} onOpen={(l: Lead) => setOpenId(l.id)} onMove={(l, s, before) => void mover.move(l, s, before)} onShowAll={showAll} />}
      {view === "list" && list.data && <LeadList leads={list.data.leads} total={list.data.total} currency={currency} onOpen={(l) => setOpenId(l.id)} onMore={() => setLimit((n) => n + 50)} />}
      {view === "list" && list.error && <Notice tone="error">{(list.error as Error).message}</Notice>}
      {view === "today" && <TodayList tasks={tasks} onDone={(t) => void doneTask(t)} onSnooze={(t) => void snooze(t)} onOpenLead={setOpenId} onOpenChat={onOpenChat} teammates={teammates} onReassign={isManager ? (t, id) => void reassign(t, id) : undefined} />}

      <LeadSheet leadId={openId} currency={currency} stages={stages} teammates={teammates} isManager={isManager} onClose={() => setOpenId(null)} onOpenChat={(id) => { setOpenId(null); onOpenChat(id); }} />
      <NewLeadSheet
        open={adding}
        stages={stages}
        teammates={teammates}
        aiAvailable={aiAvailable}
        onClose={() => setAdding(false)}
        onCreated={(lead, existing) => {
          setAdding(false);
          setOpenId(lead.id);
          setNotice(existing ? `${lead.contactName} already had an open lead, so that one is open now.` : "");
        }}
      />
      <PipelineSettings open={configuring} settings={settings.data} onClose={() => setConfiguring(false)} />
      {mover.dialog}
    </Page>
  );
}
