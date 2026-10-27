import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BellPlus, CalendarClock, Funnel, Plus } from "lucide-react";
import { fetchChatLead, getStoredTenantId } from "../../services/api";
import { dueLabel, formatMoney } from "../../utils/pipeline";
import { btn } from "../ui/styles";
import { ChatTasksSheet } from "./ChatTasksSheet";
import { LeadSheet } from "./LeadSheet";
import { NewLeadSheet } from "./NewLeadSheet";
import { useLeadMover } from "./useLeadMover";
import { usePipelineSettings } from "./usePipelineSettings";

// A slim bar under the chat's header: where this customer is in the pipeline, with one tap to move them on or to
// add them. A salesperson works in the chat, so the pipeline comes to them instead of the other way round.
export function LeadPanel({
  conversationId,
  contactName,
  teammates,
  aiAvailable,
  isManager,
  currentUserId = 0,
  onOpenChat,
}: {
  conversationId: string;
  contactName: string;
  teammates: { id: number; name: string }[];
  aiAvailable: boolean;
  isManager: boolean;
  currentUserId?: number;
  onOpenChat: (conversationId: string) => void;
}) {
  const tenant = getStoredTenantId();
  const settings = usePipelineSettings();
  const chat = useQuery({ queryKey: ["leads", tenant, "chat", conversationId], queryFn: () => fetchChatLead(conversationId) });
  const [open, setOpen] = useState(false),
    [adding, setAdding] = useState(false),
    [reminding, setReminding] = useState(false),
    [error, setError] = useState("");
  const mover = useLeadMover(setError);
  const lead = chat.data?.lead;
  const stages = (settings.data?.stages || []).map(({ id, name, kind, position }) => ({ id, name, kind, position }));
  const currency = settings.data?.currency || "AED";
  if (chat.isPending || chat.error) return null;
  const due = lead?.nextTask ? dueLabel(lead.nextTask.dueAt) : null;

  return (
    <div className="shrink-0 border-b border-line bg-surface px-3 sm:px-5 py-2 flex items-center gap-x-3 gap-y-2 text-[13.5px] min-w-0" aria-label="Sales pipeline">
      <Funnel className="w-4 h-4 text-gold shrink-0" aria-hidden />
      {lead ? (
        <>
          <select
            aria-label="Pipeline step"
            value={lead.stageId}
            disabled={mover.busy}
            onChange={(e) => {
              const stage = stages.find((s) => s.id === e.target.value);
              if (stage) void mover.move(lead, stage);
            }}
            className="h-8 rounded-full bg-surface-2 px-3 text-[13px] font-medium cursor-pointer max-w-[170px] shrink-0"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {lead.value > 0 && <span className="font-semibold num shrink-0">{formatMoney(lead.value, currency)}</span>}
          <span className="hidden sm:inline text-fg-3 truncate max-w-[120px] shrink-0">{lead.ownerName || "Unowned"}</span>
          {due && (
            <span className={`inline-flex items-center gap-1.5 min-w-0 ${due.late ? "text-danger" : "text-fg-2"}`} title={`${lead.nextTask!.title} · ${due.text}`}>
              {due.late ? <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-label="Follow-up overdue" /> : <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-label="Follow-up planned" />}
              <span className="hidden sm:inline truncate">
                {lead.nextTask!.title} · {due.text}
              </span>
            </span>
          )}
          <button type="button" onClick={() => setOpen(true)} className="ml-auto shrink-0 text-gold hover:underline">
            Details
          </button>
        </>
      ) : (
        <>
          <span className="text-fg-2 truncate">Not in your pipeline yet</span>
          <button type="button" onClick={() => setReminding(true)} className={`${btn("ghost", "sm")} ml-auto shrink-0`}>
            <BellPlus className="w-4 h-4" /> Follow-up
          </button>
          <button type="button" onClick={() => setAdding(true)} className={`${btn("secondary", "sm")} shrink-0`}>
            <Plus className="w-4 h-4" /> Add to pipeline
          </button>
        </>
      )}
      {error && (
        <span role="alert" className="text-danger truncate">
          {error}
        </span>
      )}
      <LeadSheet leadId={open && lead ? lead.id : null} currency={currency} stages={stages} teammates={teammates} isManager={isManager} aiAvailable={aiAvailable} currentUserId={currentUserId} onClose={() => setOpen(false)} onOpenChat={onOpenChat} />
      <NewLeadSheet open={adding} from={{ conversationId, name: contactName }} stages={stages} teammates={teammates} aiAvailable={aiAvailable} onClose={() => setAdding(false)} onCreated={() => setAdding(false)} />
      <ChatTasksSheet conversationId={reminding ? conversationId : null} contactName={contactName} teammates={teammates} isManager={isManager} onClose={() => setReminding(false)} />
      {mover.dialog}
    </div>
  );
}
