import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Undo2 } from "lucide-react";
import { fetchAutopilot, getStoredTenantId, setAutopilotRule, undoAutopilot, type AutopilotEntry } from "../../services/api";
import { RiwoAvatar } from "../user/Riwo";
import { btn } from "../ui/styles";

const WHY: Record<string, string> = {
  not_configured: "Riwo isn't switched on for this server yet.",
  disabled: "Riwo is switched off for your company.",
  no_private_provider: "Private mode is on and no private AI service is connected.",
};

function Switch({ checked, label, disabled, onChange }: { checked: boolean; label: string; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand-solid" : "bg-surface-2 ring-1 ring-line"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

/** What Riwo may do on its own, in plain words, with every action listed and one tap to take it back. */
export function AutopilotPanel({ onOpenChat, onPlan }: { onOpenChat: (conversationId: string) => void; onPlan?: () => void }) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const state = useQuery({ queryKey: ["autopilot", tenant], queryFn: fetchAutopilot, refetchInterval: 45_000 });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const data = state.data;
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["autopilot", tenant] }), qc.invalidateQueries({ queryKey: ["home", tenant] })]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e: any) {
      setError(e.message || "That did not work.");
    } finally {
      setBusy(null);
    }
  };

  if (!data) return null;
  // a person who cannot change anything and has nothing to look at is not shown a panel about it
  if (!data.canEdit && data.log.length === 0) return null;

  return (
    <section aria-labelledby="autopilot-title" className="rounded-3xl bg-surface border border-line p-5 sm:p-6 shadow-card">
      <div className="flex items-center gap-3">
        <RiwoAvatar size={36} />
        <div className="min-w-0">
          <h2 id="autopilot-title" className="text-[17px] font-semibold text-fg">
            Autopilot
          </h2>
          <p className="text-[13px] text-fg-3">
            {data.available ? `${data.sentToday} sent today, up to ${data.dailyCap} a day` : "Let Riwo handle the simple things"}
          </p>
        </div>
      </div>

      {data.reason === "plan" ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-fg-2">
          <Lock className="w-4 h-4 shrink-0" aria-hidden />
          <span>
            Autopilot is part of the Growth plan and above.
            {onPlan && (
              <button type="button" className="ml-1.5 font-medium text-gold hover:underline" onClick={onPlan}>
                See plans
              </button>
            )}
          </span>
        </p>
      ) : (
        <>
          {!data.available && data.reason && <p className="mt-3 text-[13.5px] text-fg-2">{WHY[data.reason]}</p>}
          <ul className="mt-4 space-y-4">
            {data.rules.map((r) => (
              <li key={r.key} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-medium text-fg">{r.label}</div>
                  <p className="mt-0.5 text-[13px] text-fg-2 leading-relaxed">{r.description}</p>
                </div>
                {data.canEdit ? (
                  <span className="relative">
                    <Switch checked={r.enabled} label={r.label} disabled={busy !== null} onChange={() => void run(r.key, () => setAutopilotRule(r.key, !r.enabled))} />
                    {busy === r.key && <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 animate-spin text-white" aria-hidden />}
                  </span>
                ) : (
                  <span className="text-[12.5px] text-fg-3 shrink-0">{r.enabled ? "On" : "Off"}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] text-fg-3 leading-relaxed">
            Riwo never answers a group, a chat a teammate owns or has answered lately, or a customer who sounds unhappy. Everything it does is listed here and can be taken back.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[13.5px] text-danger">
          {error}
        </p>
      )}

      {data.log.length > 0 && (
        <div className="mt-5 pt-4 border-t border-line/70">
          <h3 className="eyebrow mb-2.5">Autopilot did this</h3>
          <ul className="space-y-3" aria-label="Autopilot did this">
            {data.log.slice(0, 6).map((e: AutopilotEntry) => (
              <li key={e.id} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onOpenChat(e.conversationId)} className="text-[14px] font-medium text-fg hover:underline text-left">
                    {e.title}
                  </button>
                  <p className={`text-[13px] leading-snug ${e.outcome === "undone" ? "text-fg-3 line-through" : "text-fg-2"}`}>{e.what}</p>
                </div>
                {e.canUndo && (
                  <button type="button" className={btn("ghost", "sm")} disabled={busy !== null} onClick={() => void run(e.id, () => undoAutopilot(e.id))} aria-label={`Take back: ${e.what} for ${e.title}`}>
                    {busy === e.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Undo2 className="w-4 h-4" aria-hidden />} Take back
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
