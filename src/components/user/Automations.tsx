import { useState } from "react";
import {
  addAutomation,
  toggleAutomationApi,
  removeAutomation,
} from "../../services/api";
export function Automations({
  automations,
  onChanged,
}: {
  automations: any[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-5">
      <header className="flex justify-between">
        <div>
          <h1 className="text-xl font-bold">Bot Flows & Triggers</h1>
          <p className="text-sm text-slate-400 mt-2">
            Keyword rules apply to new incoming customer messages. New rules are
            paused until you enable them.
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="bg-emerald-600 p-3 rounded-xl"
        >
          New rule
        </button>
      </header>
      {error && (
        <p role="alert" className="text-rose-300">
          {error}
        </p>
      )}
      {open && (
        <form
          className="bg-[#111b21] rounded-xl p-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(async () => {
              await addAutomation({
                name: f.get("name"),
                triggerCondition: f.get("keyword"),
                actionType: f.get("action"),
                actionSummary: f.get("value"),
              });
              setOpen(false);
            });
          }}
        >
          {[
            ["name", "Rule name"],
            ["keyword", "Match keyword"],
            ["value", "Reply text or exact teammate name"],
          ].map(([name, label]) => (
            <label key={name} className="block">
              {label}
              <input
                required
                name={name}
                className="block bg-[#202c33] p-2 w-full rounded"
              />
            </label>
          ))}
          <label className="block">
            Action
            <select name="action" className="block bg-[#202c33] p-2 w-full">
              <option value="reply_text">Send reply</option>
              <option value="assign_agent">Assign teammate</option>
            </select>
          </label>
          <button disabled={busy} className="bg-emerald-600 p-2 rounded">
            Save paused rule
          </button>
        </form>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {automations.map((a) => (
          <article
            key={a.id}
            className="bg-[#111b21] p-5 rounded-xl border border-[#2a3942]"
          >
            <h2 className="font-bold">{a.name}</h2>
            <p className="text-slate-400 my-2">When: {a.triggerCondition}</p>
            <p>{a.actionSummary}</p>
            <p className="text-xs my-3">
              Completed executions: {a.executionsCount}
            </p>
            <button
              disabled={busy}
              onClick={() => void run(() => toggleAutomationApi(a.id))}
              className="text-emerald-400"
            >
              {a.isEnabled ? "Pause" : "Enable"}
            </button>
            <button
              disabled={busy}
              className="ml-4 text-rose-300"
              onClick={() => void run(() => removeAutomation(a.id))}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
      {!automations.length && (
        <p className="text-slate-400">No automation rules configured.</p>
      )}
    </section>
  );
}
