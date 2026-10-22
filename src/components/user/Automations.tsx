import { useState } from "react";
import { Bot, Plus, Trash2 } from "lucide-react";
import {
  addAutomation,
  toggleAutomationApi,
  removeAutomation,
} from "../../services/api";
import { EmptyState, Field, Notice, Page, PageHeader, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { Sheet } from "../ui/Sheet";

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
    <Page>
      <PageHeader
        eyebrow="Automate"
        title="Automations"
        subtitle="Keyword rules apply to new incoming customer messages. New rules start paused until you enable them."
        actions={
          <button onClick={() => setOpen(true)} className={btn("primary")}>
            <Plus className="w-4 h-4" /> New rule
          </button>
        }
      />
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="New rule"
        subtitle="It starts paused, so you can review it before it goes live."
        footer={
          <>
            <button
              type="button"
              className={btn("ghost")}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button form="rule-form" disabled={busy} className={btn("primary")}>
              Save paused rule
            </button>
          </>
        }
      >
        <form
          id="rule-form"
          className="space-y-4"
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
            ["keyword", "When a message contains"],
            ["value", "Reply text or exact teammate name"],
          ].map(([name, label]) => (
            <Field key={name} label={label}>
              <input required name={name} className={inputCls} />
            </Field>
          ))}
          <Field label="Then">
            <select name="action" className={inputCls}>
              <option value="reply_text">Send a reply</option>
              <option value="assign_agent">Assign a teammate</option>
            </select>
          </Field>
        </form>
      </Sheet>

      {!automations.length ? (
        <EmptyState
          icon={<Bot className="w-6 h-6" />}
          title="No automation rules yet"
          body="Reply or assign a teammate automatically when a customer writes a keyword."
          action={
            <button onClick={() => setOpen(true)} className={btn("primary")}>
              <Plus className="w-4 h-4" /> New rule
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {automations.map((a) => (
            <article key={a.id} className="card p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[18px] font-semibold">{a.name}</h2>
                <Pill tone={a.isEnabled ? "ok" : "neutral"} dot>
                  {a.isEnabled ? "Live" : "Paused"}
                </Pill>
              </div>
              <p className="mt-3 text-[14px] text-fg-2">
                When a message contains{" "}
                <span className="text-fg font-medium">
                  “{a.triggerCondition}”
                </span>
              </p>
              <p className="mt-2 text-[15px] text-fg leading-relaxed">
                {a.actionSummary}
              </p>
              <p className="mt-4 text-[12.5px] text-fg-3">
                Completed executions: {a.executionsCount}
              </p>
              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                <button
                  disabled={busy}
                  onClick={() => void run(() => toggleAutomationApi(a.id))}
                  className={btn("secondary", "sm")}
                >
                  {a.isEnabled ? "Pause" : "Enable"}
                </button>
                <button
                  disabled={busy}
                  aria-label={`Delete ${a.name}`}
                  className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-danger hover:bg-danger/10 transition"
                  onClick={() => void run(() => removeAutomation(a.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Page>
  );
}
