import { AlertCircle, CalendarClock, MessageSquare } from "lucide-react";
import type { Lead, PipelineStage } from "../../services/api";
import { dueLabel, formatMoney, inStage } from "../../utils/pipeline";

// One lead on the board. The whole card opens it; the step menu is a real <select>, so it works with a keyboard
// and brings up the phone's own picker on a phone, where dragging a card is awkward.
export function LeadCard({
  lead,
  currency,
  stages,
  onOpen,
  onMove,
  dragging,
  onDragStart,
  onDragEnd,
  onDropBefore,
}: {
  lead: Lead;
  currency: string;
  stages: PipelineStage[];
  onOpen: () => void;
  onMove: (stage: PipelineStage) => void;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDropBefore?: () => void;
}) {
  const due = lead.nextTask ? dueLabel(lead.nextTask.dueAt) : null;
  return (
    <article
      draggable={Boolean(onDragStart)}
      onDragStart={(e) => {
        e.dataTransfer?.setData("text/plain", lead.id);
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDropBefore && e.preventDefault()}
      onDrop={(e) => {
        if (!onDropBefore) return;
        e.preventDefault();
        e.stopPropagation();
        onDropBefore();
      }}
      className={`card p-4 cursor-pointer transition hover:ring-1 hover:ring-gold/50 ${dragging ? "opacity-40" : ""}`}
      aria-label={`${lead.contactName}, ${lead.stageName}`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[15px] font-semibold leading-snug truncate" dir="auto">
            {lead.contactName}
          </h4>
          {lead.unread > 0 && (
            <span className="shrink-0 h-5 min-w-5 px-1.5 grid place-items-center rounded-full bg-brand-solid text-white text-[11px] font-semibold" aria-label={`${lead.unread} unread`}>
              {lead.unread}
            </span>
          )}
        </div>
        {lead.title && lead.title !== lead.contactName && (
          <p className="mt-0.5 text-[13px] text-fg-2 truncate" dir="auto">
            {lead.title}
          </p>
        )}
        {lead.lastMessage && (
          <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-fg-3 line-clamp-2" dir="auto">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
            <span>
              {lead.lastMessage.fromMe ? "You: " : ""}
              {lead.lastMessage.text}
            </span>
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 text-[12.5px]">
          <span className="font-semibold num">{lead.value ? formatMoney(lead.value, currency) : <span className="text-fg-3 font-normal">No value yet</span>}</span>
          <span className="text-fg-3">{lead.status === "open" ? `${inStage(lead)} here` : lead.stageName}</span>
        </div>
        {due && (
          <p className={`mt-2 flex items-center gap-1.5 text-[12.5px] ${due.late ? "text-danger" : "text-fg-2"}`}>
            {due.late ? <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden /> : <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden />}
            <span className="truncate">
              {lead.nextTask!.title} · {due.text}
            </span>
          </p>
        )}
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[12px] text-fg-3 truncate" title={lead.ownerName ? `Owned by ${lead.ownerName}` : "Nobody owns this yet"}>
          {lead.ownerName || "Unowned"}
        </span>
        <select
          aria-label={`Move ${lead.contactName} to another step`}
          value=""
          onChange={(e) => {
            const stage = stages.find((s) => s.id === e.target.value);
            if (stage) onMove(stage);
          }}
          className="h-8 rounded-full bg-surface-2 px-2.5 text-[12.5px] text-fg-2 hover:text-fg cursor-pointer max-w-[130px]"
        >
          <option value="">Move to…</option>
          {stages
            .filter((s) => s.id !== lead.stageId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </div>
    </article>
  );
}
