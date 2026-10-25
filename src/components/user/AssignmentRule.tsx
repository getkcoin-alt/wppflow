import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shuffle } from "lucide-react";
import { fetchAssignment, getStoredTenantId, saveAssignment, type AssignmentSettings } from "../../services/api";
import { Field, Notice, Pill } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls } from "../ui/styles";
import { DAY_NAMES, describeRule } from "../../utils/assignment";

const ZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Riyadh", "Asia/Karachi", "Asia/Dhaka", "Asia/Singapore", "Europe/London", "UTC"];

type Form = {
  enabled: boolean;
  mode: AssignmentSettings["mode"];
  team: string;
  sessionNames: string[];
  rotation: number[];
  keepOwner: boolean;
  maxOpen: string;
  useHours: boolean;
  timezone: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
};
const formOf = (s: AssignmentSettings): Form => ({
  enabled: s.enabled,
  mode: s.mode,
  team: s.team,
  sessionNames: s.sessionNames,
  rotation: s.members.filter((m) => m.inRotation).map((m) => m.id),
  keepOwner: s.keepOwner,
  maxOpen: s.maxOpen ? String(s.maxOpen) : "",
  useHours: s.useHours,
  timezone: s.timezone,
  workDays: s.workDays,
  workStart: s.workStart,
  workEnd: s.workEnd,
});

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
const chip = (on: boolean) =>
  `h-9 px-3.5 rounded-full text-[13.5px] font-medium ring-1 transition ${on ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 text-fg-2 ring-line hover:text-fg"}`;

// The company's rule for new chats: who they go to, on which numbers, and when. Off until it is turned on.
export function AssignmentRule() {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["assignment", tenant], queryFn: fetchAssignment });
  const [form, setForm] = useState<Form | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const s = q.data;
  const f = form ?? (s ? formOf(s) : null);
  const set = (patch: Partial<Form>) => f && setForm({ ...f, ...patch });
  const save = async () => {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      await saveAssignment({
        enabled: f.enabled,
        mode: f.mode,
        team: f.team,
        sessionNames: f.sessionNames,
        rotation: f.rotation,
        keepOwner: f.keepOwner,
        maxOpen: f.maxOpen.trim() ? Number(f.maxOpen) : null,
        useHours: f.useHours,
        timezone: f.timezone,
        workDays: f.workDays,
        workStart: f.workStart,
        workEnd: f.workEnd,
      });
      await Promise.all([qc.invalidateQueries({ queryKey: ["assignment", tenant] }), qc.invalidateQueries({ queryKey: ["my-availability", tenant] })]);
      setForm(null);
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Automatic assignment" className="card p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
          <Shuffle className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold">Automatic assignment</h2>
            {s && <Pill tone={s.enabled ? "ok" : "neutral"} dot>{s.enabled ? "On" : "Off"}</Pill>}
          </div>
          {q.error ? (
            <p className="mt-1 text-[14px] text-danger">{(q.error as Error).message}</p>
          ) : (
            <p className="mt-1 text-[14px] text-fg-2 max-w-2xl">{s ? describeRule(s) : "Loading…"}</p>
          )}
          {saved && (
            <p role="status" className="mt-2 text-[13.5px] text-ok">
              Saved.
            </p>
          )}
        </div>
        {s && (
          <button type="button" className={btn("secondary", "sm")} onClick={() => { setSaved(false); setForm(formOf(s)); }}>
            {s.enabled ? "Change" : "Set up"}
          </button>
        )}
      </div>

      <Sheet
        open={!!form && !!s}
        onClose={() => { setForm(null); setError(""); }}
        title="Automatic assignment"
        subtitle="Give each new chat to a teammate without anyone picking it."
        footer={
          <>
            <button type="button" className={btn("ghost")} onClick={() => { setForm(null); setError(""); }}>
              Cancel
            </button>
            <button type="button" className={btn("primary")} disabled={busy} onClick={() => void save()}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Save
            </button>
          </>
        }
      >
        {f && s && (
          <div className="space-y-6 text-[14.5px]">
            {error && <Notice tone="error">{error}</Notice>}
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={f.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--c-brand-solid))]" />
              <span className="font-medium">Give new chats to people automatically</span>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium text-fg-2 mb-1.5">How to choose</legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="How to choose">
                <button type="button" aria-pressed={f.mode === "round_robin"} className={chip(f.mode === "round_robin")} onClick={() => set({ mode: "round_robin" })}>
                  In turn
                </button>
                <button type="button" aria-pressed={f.mode === "least_busy"} className={chip(f.mode === "least_busy")} onClick={() => set({ mode: "least_busy" })}>
                  Least busy
                </button>
              </div>
              <p className="text-[12.5px] text-fg-3 ml-1">{f.mode === "round_robin" ? "Each person gets a chat in turn." : "The person with the fewest open chats gets it."}</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium text-fg-2 mb-1.5">Which numbers</legend>
              {s.numbers.length === 0 && <p className="text-fg-3">Connect a number first.</p>}
              {s.numbers.map((n) => (
                <label key={n.sessionName} className="flex items-center gap-3">
                  <input type="checkbox" checked={f.sessionNames.includes(n.sessionName)} onChange={() => set({ sessionNames: toggle(f.sessionNames, n.sessionName) })} className="h-5 w-5 accent-[rgb(var(--c-brand-solid))]" />
                  <span>
                    {n.ownerName ? `${n.ownerName}'s number` : n.sessionName}
                    {n.phone ? <span className="text-fg-3 num"> · {n.phone}</span> : null}
                  </span>
                </label>
              ))}
              <p className="text-[12.5px] text-fg-3 ml-1">A chat on a number you don't tick is left alone. Someone who gets a chat can open it, even on a number that is not theirs.</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium text-fg-2 mb-1.5">Who takes new chats</legend>
              {s.members.map((m) => (
                <label key={m.id} className="flex items-center gap-3">
                  <input type="checkbox" checked={f.rotation.includes(m.id)} onChange={() => set({ rotation: toggle(f.rotation, m.id) })} className="h-5 w-5 accent-[rgb(var(--c-brand-solid))]" />
                  <span className="flex-1 min-w-0 truncate">
                    {m.name} <span className="text-fg-3">· {m.team}</span>
                  </span>
                  <span className="text-[12.5px] text-fg-3 num">{m.openChats} open</span>
                  {!m.available && <Pill tone="warn">Away</Pill>}
                </label>
              ))}
              <p className="text-[12.5px] text-fg-3 ml-1">People mark themselves away from the Inbox when they are on a break. They are skipped until they are back.</p>
            </fieldset>

            {s.teams.length > 1 && (
              <Field label="Only this team" hint="Leave on every team to use everyone you ticked.">
                <select aria-label="Only this team" value={f.team} onChange={(e) => set({ team: e.target.value })} className={selectCls}>
                  <option value="">Every team</option>
                  {s.teams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Most open chats one person can have" hint="Blank means no limit. When everyone is at the limit the chat waits for a person.">
              <input aria-label="Most open chats per person" type="number" min={1} max={1000} value={f.maxOpen} onChange={(e) => set({ maxOpen: e.target.value })} className={inputCls} />
            </Field>

            <label className="flex items-start gap-3">
              <input type="checkbox" checked={f.keepOwner} onChange={(e) => set({ keepOwner: e.target.checked })} className="mt-0.5 h-5 w-5 accent-[rgb(var(--c-brand-solid))]" />
              <span>
                Send a returning customer back to the person who has their lead
                <span className="block text-[12.5px] text-fg-3">If that person is away, the rotation decides.</span>
              </span>
            </label>

            <fieldset className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={f.useHours} onChange={(e) => set({ useHours: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--c-brand-solid))]" />
                <span className="font-medium">Only during working hours</span>
              </label>
              {f.useHours && (
                <div className="space-y-3 pl-8">
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Working days">
                    {DAY_NAMES.map((d, i) => (
                      <button key={d} type="button" aria-pressed={f.workDays.includes(i)} className={chip(f.workDays.includes(i))} onClick={() => set({ workDays: toggle(f.workDays, i).sort((a, b) => a - b) })}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From">
                      <input aria-label="Working hours from" type="time" value={f.workStart} onChange={(e) => set({ workStart: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Until">
                      <input aria-label="Working hours until" type="time" value={f.workEnd} onChange={(e) => set({ workEnd: e.target.value })} className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Time zone" hint="Outside these hours new chats wait for a person, as they do today.">
                    <input aria-label="Time zone" list="assignment-zones" value={f.timezone} onChange={(e) => set({ timezone: e.target.value })} className={inputCls} />
                    <datalist id="assignment-zones">
                      {ZONES.map((z) => (
                        <option key={z} value={z} />
                      ))}
                    </datalist>
                  </Field>
                </div>
              )}
            </fieldset>
          </div>
        )}
      </Sheet>
    </section>
  );
}
