import { useState } from "react";
import { Megaphone, Pause, Play, Plus } from "lucide-react";
import type { WhatsAppSession } from "../../types";
import { EmptyState, Field, Notice, Page, PageHeader, Pill } from "../ui/Page";
import { btn, inputCls, textareaCls } from "../ui/styles";
import { Sheet } from "../ui/Sheet";

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

export function Campaigns({
  campaigns,
  sessions,
  onAddCampaign,
  onStartCampaign,
  onStopCampaign,
  isCreateModalOpen,
  setIsCreateModalOpen,
}: {
  campaigns: any[];
  sessions: WhatsAppSession[];
  onAddCampaign: (data: any) => Promise<void>;
  onStartCampaign: (id: string) => Promise<void>;
  onStopCampaign: (id: string) => Promise<void>;
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
        subtitle="Send only to contacts with recorded permission. Stopping prevents new sends; messages already sent cannot be recalled."
        actions={
          <button
            className={btn("primary")}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> New campaign
          </button>
        }
      />
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <Sheet
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New campaign"
        subtitle="Saved as a draft. You choose when it starts."
        footer={
          <>
            <button
              type="button"
              className={btn("ghost")}
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button
              form="campaign-form"
              disabled={busy}
              className={btn("primary")}
            >
              Save draft
            </button>
          </>
        }
      >
        <form
          id="campaign-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(async () => {
              await onAddCampaign({
                name: f.get("name"),
                sessionName: f.get("session"),
                targetSegment: f.get("segment") || "All Contacts",
                templateText: f.get("message"),
                scheduledFor: f.get("schedule")
                  ? new Date(String(f.get("schedule"))).toISOString()
                  : "",
                antiBanDelaySeconds: Number(f.get("delay")),
              });
              setIsCreateModalOpen(false);
            });
          }}
        >
          <Field label="Name">
            <input required name="name" className={inputCls} />
          </Field>
          <Field label="WhatsApp number">
            <select name="session" required className={inputCls}>
              <option value="">Select a number</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.sessionKey}>
                  {s.displayName} — {s.status}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Contact tag"
            hint="Leave empty to send to all opted-in contacts."
          >
            <input name="segment" className={inputCls} />
          </Field>
          <Field
            label="Message"
            hint="Use {{name}} to insert the contact’s name."
          >
            <textarea
              required
              name="message"
              maxLength={10000}
              className={textareaCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Seconds between sends"
              hint="At least 4, to protect your number."
            >
              <input
                name="delay"
                type="number"
                min={4}
                max={60}
                defaultValue={4}
                className={inputCls}
              />
            </Field>
            <Field label="Start time" hint="Optional.">
              <input
                name="schedule"
                type="datetime-local"
                className={inputCls}
              />
            </Field>
          </div>
        </form>
      </Sheet>

      {!campaigns.length ? (
        <EmptyState
          icon={<Megaphone className="w-6 h-6" />}
          title="No campaigns yet"
          body="Create a draft to reach your opted-in contacts."
          action={
            <button
              className={btn("primary")}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> New campaign
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
            return (
              <li key={c.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[18px] font-semibold truncate">
                      {c.name}
                    </h2>
                    <div className="mt-1.5">
                      <Pill tone={STATUS_TONE[c.status] || "neutral"} dot>
                        {c.status}
                      </Pill>
                    </div>
                  </div>
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
