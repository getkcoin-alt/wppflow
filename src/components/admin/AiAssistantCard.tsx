import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAiStatus, getStoredTenantId, setAiEnabled } from "../../services/api";
import { Notice, Pill } from "../ui/Page";

const REASONS: Record<string, string> = {
  not_configured:
    "The AI isn't switched on for this server yet. The person who runs the server adds the AI key, and Riwo appears.",
  plan: "Riwo is part of the Growth plan and above. Ask the Scriwo team to move your company to a plan that includes it.",
  disabled: "Riwo is switched off for your company.",
};

// Owners and administrators decide whether their team uses Riwo, and can see how much of today's allowance is used.
export function AiAssistantCard() {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["ai-status", tenant],
    queryFn: getAiStatus,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const data = status.data;
  const toggle = async () => {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      await setAiEnabled(!data.enabled);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ai-status", tenant] }),
        qc.invalidateQueries({ queryKey: ["capabilities", tenant] }),
      ]);
    } catch (e: any) {
      setError(e.message || "Couldn't change the setting.");
    } finally {
      setBusy(false);
    }
  };
  const canSwitch = data && data.reason !== "not_configured" && data.reason !== "plan";
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <img
            src="/brand/riwo-avatar.webp"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl object-cover bg-surface-2 shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold">Riwo, the AI assistant</h2>
            <p className="text-[14px] text-fg-2 mt-1 max-w-xl">
              Suggests replies, improves a draft, translates between languages and summarizes a chat for whoever takes it over. Staff always read and edit what Riwo writes. Nothing is sent to a customer by itself.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <Pill tone={data.available ? "ok" : "neutral"} dot>
              {data.available ? "On" : data.reason === "disabled" ? "Off" : "Unavailable"}
            </Pill>
          )}
          {canSwitch && (
            <button
              type="button"
              role="switch"
              aria-checked={data.enabled}
              aria-label="Use Riwo in this company"
              disabled={busy}
              onClick={() => void toggle()}
              className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-60 ${data.enabled ? "bg-brand-solid" : "bg-surface-2 ring-1 ring-line"}`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${data.enabled ? "left-[22px]" : "left-0.5"}`}
              />
              {busy && <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 animate-spin text-white" />}
            </button>
          )}
        </div>
      </div>
      {status.error && (
        <div className="mt-4">
          <Notice tone="error">{status.error.message}</Notice>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-[14px] text-danger">
          {error}
        </p>
      )}
      {data && !data.available && data.reason && (
        <p className="mt-4 text-[14px] text-fg-2">{REASONS[data.reason]}</p>
      )}
      {data && data.reason !== "not_configured" && data.reason !== "plan" && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between text-[13.5px]">
            <span className="text-fg-2">Used today</span>
            <span className="num text-fg">
              <span className="font-semibold">{data.used.toLocaleString()}</span> of {data.limit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-gradient transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.round((data.used / Math.max(data.limit, 1)) * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-[12.5px] text-fg-3">The allowance is shared by everyone in your company and resets at midnight UTC.</p>
        </div>
      )}
      <details className="mt-5 text-[13.5px] text-fg-2">
        <summary className="cursor-pointer font-medium text-fg">What Riwo sees</summary>
        <p className="mt-2 max-w-2xl leading-relaxed">
          When someone asks Riwo for help, it receives the latest messages of that chat as text, your saved replies, the private notes on that chat and your company's name. Phone numbers, photos and files are not sent. The text is processed by Anthropic's Claude to write the result and is not used by Scriwo for anything else.
        </p>
      </details>
    </section>
  );
}
