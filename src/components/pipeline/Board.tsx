import { useState } from "react";
import type { Board as BoardData, BoardColumn, Lead, PipelineStage } from "../../services/api";
import { formatMoney, shortMoney } from "../../utils/pipeline";
import { LeadCard } from "./LeadCard";

const TONE: Record<string, string> = { open: "bg-surface-2", won: "bg-ok/10", lost: "bg-danger/10" };

// The pipeline as columns, one per step. On a phone one step shows at a time, picked from a strip of tabs,
// because five columns side by side don't fit; every card has a "Move to…" menu, so nothing needs dragging.
export function Board({
  board,
  onOpen,
  onMove,
  onShowAll,
}: {
  board: BoardData;
  onOpen: (lead: Lead) => void;
  onMove: (lead: Lead, stage: PipelineStage, beforeLeadId?: string) => void;
  onShowAll: (column: BoardColumn) => void;
}) {
  const stages = board.stages.map(({ id, name, kind, position }) => ({ id, name, kind, position }));
  const [active, setActive] = useState(board.stages[0]?.id);
  const [dragging, setDragging] = useState<Lead | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const current = board.stages.some((c) => c.id === active) ? active : board.stages[0]?.id;

  return (
    <div>
      <div className="md:hidden -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Pipeline steps">
        {board.stages.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={current === c.id}
            onClick={() => setActive(c.id)}
            className={`shrink-0 rounded-full px-3.5 h-9 text-[13.5px] font-medium ring-1 transition ${current === c.id ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 text-fg-2 ring-line"}`}
          >
            {c.name} <span className="opacity-70 num">{c.count}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 md:overflow-x-auto md:pb-4 md:snap-x">
        {board.stages.map((c) => (
          <section
            key={c.id}
            aria-label={c.name}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              setOver(c.id);
            }}
            onDragLeave={() => setOver((o) => (o === c.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              if (dragging) onMove(dragging, stages.find((s) => s.id === c.id)!);
              setDragging(null);
            }}
            className={`${current === c.id ? "flex" : "hidden"} md:flex w-full md:w-[290px] md:shrink-0 md:snap-start flex-col rounded-3xl p-3 ${TONE[c.kind]} ${over === c.id ? "ring-2 ring-gold/60" : ""}`}
          >
            <header className="flex items-baseline justify-between gap-2 px-1.5 pb-3">
              <h3 className="text-[14px] font-semibold truncate">{c.name}</h3>
              <span className="text-[12.5px] text-fg-3 num shrink-0" title={c.value ? formatMoney(c.value, board.currency) : undefined}>
                {c.count}
                {c.value > 0 && ` · ${shortMoney(c.value)}`}
              </span>
            </header>
            <div className="space-y-2.5 md:min-h-[120px]">
              {c.leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  currency={board.currency}
                  stages={stages}
                  dragging={dragging?.id === lead.id}
                  onOpen={() => onOpen(lead)}
                  onMove={(stage) => onMove(lead, stage)}
                  onDragStart={() => setDragging(lead)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDropBefore={() => {
                    if (dragging && dragging.id !== lead.id) onMove(dragging, stages.find((s) => s.id === c.id)!, lead.id);
                    setDragging(null);
                    setOver(null);
                  }}
                />
              ))}
              {!c.leads.length && <p className="px-2 py-6 text-center text-[13px] text-fg-3">{c.kind === "open" ? "Nothing here yet" : "Nothing in the last 30 days"}</p>}
              {c.count > c.leads.length && (
                <button type="button" onClick={() => onShowAll(c)} className="w-full rounded-2xl py-2 text-[13px] text-gold hover:underline">
                  Show all {c.count}
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
