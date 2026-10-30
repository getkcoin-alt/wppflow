import { useState } from "react";
import { Copy, Megaphone, Pause, Play, Plus } from "lucide-react";
import type { WhatsAppSession } from "../../types";
import { EmptyState, Notice, Page, PageHeader, Pill } from "../ui/Page";
import { btn } from "../ui/styles";
import { BroadcastWizard, type BroadcastRequest } from "./BroadcastWizard";

const STATUS_TONE: Record<
  string,
  "ok" | "warn" | "danger" | "info" | "neutral"
> = {
  running: "ok",
  completed: "info",
  failed: "danger",
  stopped: "warn",
  paused: "warn",
};

// A running broadcast whose start time hasn't come yet is waiting, not sending.
const waitingUntil = (c: any): Date | null => {
  const at = c.scheduledFor ? new Date(c.scheduledFor) : null;
  return c.status === "running" && at && at.getTime() > Date.now() ? at : null;
};

const isCoolingDown = (c: any): boolean => {
  return Boolean(
    c.status === "running" &&
      c.cooldownUntil &&
      new Date(c.cooldownUntil).getTime() > Date.now(),
  );
};

const statusLabel = (c: any) => {
  if (c.circuitBreakerTripped) {
    return "Paused (Anti-Ban Safety)";
  }
  if (isCoolingDown(c)) {
    const mins = Math.max(
      1,
      Math.ceil((new Date(c.cooldownUntil).getTime() - Date.now()) / 60000),
    );
    return `Cool-down batch pause (${mins}m left)`;
  }
  const at = waitingUntil(c);
  return at
    ? `Starts ${at.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
    : c.status === "draft"
      ? "Draft"
      : c.status;
};

export function Campaigns({
  campaigns,
  sessions,
  companyName,
  onAddCampaign,
  onStartCampaign,
  onStopCampaign,
  onDuplicateCampaign,
  isCreateModalOpen,
  setIsCreateModalOpen,
}: {
  campaigns: any[];
  sessions: WhatsAppSession[];
  companyName: string;
  onAddCampaign: (data: BroadcastRequest) => Promise<void>;
  onStartCampaign: (id: string) => Promise<void>;
  onStopCampaign: (id: string) => Promise<void>;
  onDuplicateCampaign: (id: string) => Promise<void>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <PageHeader
        eyebrow="Reach"
        title="Broadcasts"
        subtitle="Send one message to many customers, only to people who agreed to hear from you. Stopping prevents new sends; messages already sent cannot be recalled."
        actions={
          <button
            className={btn("primary")}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> New broadcast
          </button>
        }
      />
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <BroadcastWizard
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        sessions={sessions}
        companyName={companyName}
        onCreate={onAddCampaign}
      />

      {!campaigns.length ? (
        <EmptyState
          icon={<Megaphone className="w-6 h-6" />}
          title="No broadcasts yet"
          body="Pick a ready-made message, choose who gets it, and send. You see exactly how many people will receive it before anything goes out."
          action={
            <button
              className={btn("primary")}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> New broadcast
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => {
            const total = Number(c.totalRecipients || 0);
            const sent = Number(c.sentCount || 0);
            const progress = total
              ? Math.min(100, Math.round((sent / total) * 100))
              : 0;
            const running = c.status === "running";
            const waiting = waitingUntil(c);
            return (
              <li key={c.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[18px] font-semibold truncate">
                      {c.name}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Pill
                        tone={
                          c.circuitBreakerTripped
                            ? "danger"
                            : isCoolingDown(c)
                              ? "info"
                              : waiting
                                ? "info"
                                : STATUS_TONE[c.status] || "neutral"
                        }
                        dot
                      >
                        {statusLabel(c)}
                      </Pill>
                      <span className="text-[12.5px] text-fg-3">
                        To {c.targetSegment && c.targetSegment !== "All Contacts" ? `“${c.targetSegment}”` : "everyone who agreed"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busy}
                      onClick={() => void act(() => onDuplicateCampaign(c.id))}
                      className={btn("ghost", "sm")}
                      aria-label={`Copy ${c.name}`}
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button
                      disabled={busy || c.status === "completed"}
                      onClick={() =>
                        void act(() =>
                          running ? onStopCampaign(c.id) : onStartCampaign(c.id),
                        )
                      }
                      className={btn(running ? "secondary" : "primary", "sm")}
                    >
                      {running ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {running
                        ? "Stop"
                        : c.status === "completed"
                          ? "Completed"
                          : c.status === "stopped" || c.status === "paused"
                            ? "Resume"
                            : "Start"}
                    </button>
                  </div>
                </div>
                {c.templateText && (
                  <p className="mt-3 text-[14px] text-fg-2 line-clamp-2 whitespace-pre-wrap">{c.templateText}</p>
                )}
                <div className="mt-5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold-gradient transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <dl className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-4 text-[13px]">
                  {[
                    ["Recipients", c.totalRecipients],
                    ["Sent", c.sentCount],
                    ["Delivered", c.deliveredCount],
                    ["Read", c.readCount],
                    ["Failed", c.failedCount],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <dt className="text-fg-3">{k}</dt>
                      <dd
                        className={`text-[22px] font-semibold num ${k === "Failed" && Number(v) ? "text-danger" : "text-fg"}`}
                      >
                        {Number(v || 0).toLocaleString()}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
