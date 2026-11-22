import { useState, type FormEvent } from "react";
import type { Agent, AgentInput, AgentsOverview } from "../../../services/api";
import { Field, Notice } from "../../ui/Page";
import { btn, inputCls, selectCls } from "../../ui/styles";
import { buildInput, draftOf, type Draft } from "./agentInput";

function Check({ checked, onChange, title, children, disabled }: { checked: boolean; onChange: (v: boolean) => void; title: string; children?: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-3 min-h-11 py-1.5 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand,#0f766e)]" />
      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium text-fg">{title}</span>
        {children && <span className="block text-[13px] text-fg-3 leading-snug">{children}</span>}
      </span>
    </label>
  );
}

/** Make an agent, or change one: what it may do, which numbers, what it may see, how much it may send, and for how long. */
export function AgentForm({ overview, initial, busy, onSubmit, onCancel }: { overview: AgentsOverview; initial?: Agent; busy: boolean; onSubmit: (v: AgentInput) => void; onCancel: () => void }) {
  const editing = Boolean(initial);
  const [d, setD] = useState<Draft>(() => draftOf(overview, initial));
  const [problem, setProblem] = useState("");
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const built = buildInput(overview, d, editing);
    if (built.problem) return setProblem(built.problem);
    setProblem("");
    onSubmit(built.value!);
  };
  const noNumbers = overview.numbers.length === 0;
  return (
    <form onSubmit={submit} className="space-y-6" aria-label={editing ? "Agent settings" : "New agent"}>
      {problem && <Notice tone="error">{problem}</Notice>}
      <Field label="Name" hint="Shown in the activity list, and on the messages and notes this agent writes.">
        <input className={inputCls} value={d.name} maxLength={80} required placeholder="Claude support helper" onChange={(e) => set({ name: e.target.value })} />
      </Field>

      <fieldset>
        <legend className="block text-[13px] font-medium text-fg-2 mb-2 ml-1">What may it do?</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {overview.levels.map((l) => (
            <label
              key={l.key}
              className={`block cursor-pointer rounded-2xl p-4 ring-1 transition focus-within:ring-2 focus-within:ring-gold/70 ${d.level === l.key ? "bg-gold/10 ring-gold/60" : "bg-surface-2 ring-transparent hover:bg-surface-3"}`}
            >
              <input type="radio" name="level" value={l.key} checked={d.level === l.key} onChange={() => set({ level: l.key })} className="sr-only" />
              <span className="block text-[15px] font-semibold text-fg">{l.label}</span>
              <span className="block mt-1 text-[13px] leading-snug text-fg-2">{l.blurb}</span>
              <span className="block mt-2 text-[12px] text-fg-3">{l.tools.length} tools</span>
            </label>
          ))}
        </div>
        {d.level === "read" && <p className="mt-2 ml-1 text-[13px] text-fg-3">A read-only agent can draft replies for you to send yourself.</p>}
      </fieldset>

      <fieldset>
        <legend className="block text-[13px] font-medium text-fg-2 mb-1 ml-1">Which WhatsApp numbers?</legend>
        {noNumbers ? (
          <Notice tone="info">No number is linked yet. You can make the agent now; it has nothing to look at until a number is linked.</Notice>
        ) : (
          <div className="rounded-2xl bg-surface-2 px-4 py-2">
            <Check checked={d.allNumbers} onChange={(v) => set({ allNumbers: v })} title="All of the company's numbers">
              The agent can use every number, including ones linked later.
            </Check>
            {!d.allNumbers && (
              <div className="border-t border-line mt-1 pt-1" role="group" aria-label="Numbers this agent may use">
                {overview.numbers.map((n) => (
                  <Check
                    key={n.name}
                    checked={d.picked.includes(n.name)}
                    onChange={(v) => set({ picked: v ? [...d.picked, n.name] : d.picked.filter((x) => x !== n.name) })}
                    title={n.name}
                  >
                    {`${n.phone ? `+${String(n.phone).replace(/\D/g, "")} · ` : ""}${n.connected ? "connected" : "not connected"}`}
                  </Check>
                ))}
              </div>
            )}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="block text-[13px] font-medium text-fg-2 mb-1 ml-1">What may it see and say?</legend>
        <div className="rounded-2xl bg-surface-2 px-4 py-2 divide-y divide-line">
          <Check checked={d.disclose} onChange={(v) => set({ disclose: v })} title="Tell customers it is an AI (recommended)">
            Adds a short line to what the agent sends: it came from an AI assistant, and "human" brings a person. The customer's "human" reaches your team.
          </Check>
          <Check checked={d.sharePhones} onChange={(v) => set({ sharePhones: v })} title="Show customers' phone numbers and email addresses">
            Off: the agent sees names, and numbers with the middle hidden. What it reads goes to the AI service you connect it to.
          </Check>
          <Check checked={d.allowGroups} onChange={(v) => set({ allowGroups: v })} title="Allow group chats">
            Off: the agent does not see groups at all.
          </Check>
          <Check checked={d.allowNewChats} onChange={(v) => set({ allowNewChats: v })} title="Allow starting chats with new numbers">
            Off: the agent answers and manages the chats that exist. On: it may message a number you give it, up to the daily limit below. WhatsApp can restrict a number that messages people who have not written first.
          </Check>
        </div>
      </fieldset>

      <details className="rounded-2xl bg-surface-2 px-4 py-3" open={editing}>
        <summary className="cursor-pointer select-none text-[14.5px] font-medium text-fg min-h-11 flex items-center">Limits and expiry</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Messages an hour">
            <input className={inputCls} inputMode="numeric" value={d.perHour} onChange={(e) => set({ perHour: e.target.value })} />
          </Field>
          <Field label="Messages in 24 hours">
            <input className={inputCls} inputMode="numeric" value={d.perDay} onChange={(e) => set({ perDay: e.target.value })} />
          </Field>
          <Field label="To one chat, an hour">
            <input className={inputCls} inputMode="numeric" value={d.perChatHour} onChange={(e) => set({ perChatHour: e.target.value })} />
          </Field>
          <Field label="New chats a day">
            <input className={inputCls} inputMode="numeric" value={d.newChatsPerDay} onChange={(e) => set({ newChatsPerDay: e.target.value })} />
          </Field>
        </div>
        <p className="mt-2 text-[13px] text-fg-3">The agent is stopped when it reaches a limit, and told when to try again. A message that failed does not count.</p>
        <div className="mt-4 max-w-xs">
          <Field label="The key stops working">
            <select className={selectCls} value={d.expiry} onChange={(e) => set({ expiry: e.target.value })}>
              {editing && <option value="keep">When it already does</option>}
              <option value="30">{editing ? "30 days from now" : "After 30 days"}</option>
              <option value="90">{editing ? "90 days from now" : "After 90 days"}</option>
              <option value="365">{editing ? "1 year from now" : "After 1 year"}</option>
              <option value="never">Never</option>
            </select>
          </Field>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={btn("primary")}>
          {editing ? "Save changes" : "Make agent"}
        </button>
        <button type="button" onClick={onCancel} className={btn("ghost")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
