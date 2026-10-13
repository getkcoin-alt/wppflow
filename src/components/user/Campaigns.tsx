import { useState } from "react";
import type { WhatsAppSession } from "../../types";
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
    <section className="space-y-5">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Broadcasts & Campaigns</h1>
          <p className="text-slate-400 text-sm mt-2">
            Send only to recorded opted-in contacts. Stopping prevents new
            dispatch; messages already transmitted cannot be recalled.
          </p>
        </div>
        <button
          className="bg-emerald-600 p-3 rounded-xl shrink-0"
          onClick={() => setIsCreateModalOpen(true)}
        >
          New campaign
        </button>
      </header>
      {error && (
        <p role="alert" className="text-rose-300">
          {error}
        </p>
      )}
      {isCreateModalOpen && (
        <form
          className="bg-[#111b21] p-5 border border-[#2a3942] rounded-xl space-y-3"
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
          <label className="block">
            Name
            <input
              required
              name="name"
              className="block bg-[#202c33] rounded p-2 w-full"
            />
          </label>
          <label className="block">
            WhatsApp account
            <select
              name="session"
              required
              className="block bg-[#202c33] p-2 w-full"
            >
              <option value="">Select an account</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.sessionKey}>
                  {s.displayName} — {s.status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Contact tag (leave empty for all opted-in contacts)
            <input name="segment" className="block bg-[#202c33] p-2 w-full" />
          </label>
          <label className="block">
            Message
            <textarea
              required
              name="message"
              maxLength={10000}
              className="block bg-[#202c33] p-2 w-full"
              placeholder="Use {{name}} to insert the contact name"
            />
          </label>
          <label className="block">
            Minimum seconds between recipients
            <input
              name="delay"
              type="number"
              min={4}
              max={60}
              defaultValue={4}
              className="bg-[#202c33] p-2 ml-3"
            />
          </label>
          <label className="block">
            Optional start time
            <input
              name="schedule"
              type="datetime-local"
              className="bg-[#202c33] p-2 ml-3"
            />
          </label>
          <button disabled={busy} className="bg-emerald-600 rounded p-2">
            Save draft
          </button>
          <button
            type="button"
            className="ml-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </button>
        </form>
      )}
      <div className="overflow-x-auto bg-[#111b21] rounded-xl border border-[#2a3942]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {[
                "Campaign",
                "Status",
                "Recipients",
                "Sent",
                "Delivered",
                "Read",
                "Failed",
                "Action",
              ].map((h) => (
                <th key={h} className="p-3 text-left text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t border-[#2a3942]">
                <td className="p-3">{c.name}</td>
                <td>{c.status}</td>
                <td>{c.totalRecipients}</td>
                <td>{c.sentCount}</td>
                <td>{c.deliveredCount}</td>
                <td>{c.readCount}</td>
                <td>{c.failedCount}</td>
                <td>
                  <button
                    disabled={busy || c.status === "completed"}
                    onClick={() =>
                      void act(() =>
                        c.status === "running"
                          ? onStopCampaign(c.id)
                          : onStartCampaign(c.id),
                      )
                    }
                    className="text-emerald-400 p-2"
                  >
                    {c.status === "running"
                      ? "Stop"
                      : c.status === "completed"
                        ? "Completed"
                        : c.status === "stopped" || c.status === "paused"
                          ? "Resume"
                          : "Start"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!campaigns.length && (
          <p className="p-6 text-slate-400">
            No campaigns yet. Create a draft to begin.
          </p>
        )}
      </div>
    </section>
  );
}
