import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { moveLead, getStoredTenantId, type Lead, type PipelineStage } from "../../services/api";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls } from "../ui/styles";

const REASONS = ["Price too high", "Chose a competitor", "No reply", "Not interested", "Bought elsewhere"];

// Moving a lead between steps, in one place for the board, the list, the lead sheet and the chat. Moving to the
// lost step first asks why, because the reasons are what a manager learns from.
export function useLeadMover(onError: (message: string) => void, onMoved?: (lead: Lead) => void) {
  const qc = useQueryClient();
  const tenant = getStoredTenantId();
  const [asking, setAsking] = useState<{ lead: Lead; stage: PipelineStage; before?: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    Promise.all(["leads", "lead", "lead-tasks"].map((key) => qc.invalidateQueries({ queryKey: [key, tenant] })));
  const send = async (lead: Lead, stageId: string, before?: string, lostReason?: string) => {
    setBusy(true);
    try {
      const res = await moveLead(lead.id, { stageId, ...(before ? { beforeLeadId: before } : {}), ...(lostReason ? { lostReason } : {}) });
      await refresh();
      onMoved?.(res.lead);
      return true;
    } catch (e: any) {
      onError(e.message || "Couldn't move the lead.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const move = (lead: Lead, stage: PipelineStage, before?: string) => {
    if (stage.id === lead.stageId && !before) return Promise.resolve(true);
    if (stage.kind === "lost" && lead.status !== "lost") {
      setReason("");
      setAsking({ lead, stage, before });
      return Promise.resolve(true);
    }
    return send(lead, stage.id, before);
  };

  const dialog = (
    <Sheet
      open={!!asking}
      onClose={() => setAsking(null)}
      title="Why was it lost?"
      subtitle={asking ? `${asking.lead.contactName} will move to ${asking.stage.name}.` : ""}
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={() => setAsking(null)}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className={btn("primary")}
            onClick={async () => {
              if (!asking) return;
              if (await send(asking.lead, asking.stage.id, asking.before, reason.trim())) setAsking(null);
            }}
          >
            Mark as lost
          </button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Common reasons">
        {REASONS.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={reason === r}
            onClick={() => setReason(r)}
            className={`rounded-full px-3.5 h-9 text-[13.5px] ring-1 transition ${reason === r ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 ring-line hover:ring-gold/60"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <input aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write your own (optional)" maxLength={255} className={inputCls} />
    </Sheet>
  );
  return { move, dialog, busy };
}
