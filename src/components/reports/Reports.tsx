import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Field, Notice, Page, PageHeader, Pill, Segmented } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls } from "../ui/styles";
import {
  exportAgentEpisodes,
  exportTeamResponse,
  fetchAgentEpisodes,
  fetchDailyChats,
  fetchDailyReport,
  fetchReportSettings,
  fetchTeamResponse,
  getStoredTenantId,
  saveReportSettings,
  type AgentReport,
  type ReportFilters,
} from "../../services/api";
import type { WhatsAppSession } from "../../types";
import { numberName } from "../../utils/numbers";
import { formatDuration, isoDay } from "../../utils/duration";

type Section = "times" | "daily" | "settings";
type Preset = "today" | "yesterday" | "7" | "30" | "custom";

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="card p-4">
    <p className="text-[13px] text-fg-2">{label}</p>
    <p className="mt-1 text-[24px] font-semibold num text-fg">{value}</p>
    {hint && <p className="text-[12.5px] text-fg-3 mt-0.5">{hint}</p>}
  </div>
);

function rangeOf(preset: Preset, custom: { from: string; to: string }) {
  if (preset === "today") return { from: isoDay(0), to: isoDay(0) };
  if (preset === "yesterday") return { from: isoDay(-1), to: isoDay(-1) };
  if (preset === "7") return { from: isoDay(-6), to: isoDay(0) };
  if (preset === "30") return { from: isoDay(-29), to: isoDay(0) };
  return custom;
}
const dayText = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// The chats behind one person's figures (or one number or team's on a day), so a number can be checked.
function ChatsSheet({ title, onClose, children }: { title: string | null; onClose: () => void; children: React.ReactNode }) {
  return (
    <Sheet open={Boolean(title)} onClose={onClose} title={title ?? ""} footer={<button className={btn("ghost")} onClick={onClose}>Close</button>}>
      {children}
    </Sheet>
  );
}

function ReplyTimes({ filters, sessions, currentUserId, onOpenChat }: { filters: ReportFilters; sessions: WhatsAppSession[]; currentUserId?: number | string | null; onOpenChat: (id: string) => void }) {
  const lineName = (key: string) => {
    const line = sessions.find((x) => x.sessionKey === key);
    return line ? numberName(line, currentUserId) : key;
  };
  const tenant = getStoredTenantId();
  const q = useQuery({ queryKey: ["report-times", tenant, filters], queryFn: () => fetchTeamResponse(filters) });
  const [agent, setAgent] = useState<AgentReport | null>(null),
    [error, setError] = useState("");
  const episodes = useQuery({
    queryKey: ["report-episodes", tenant, filters, agent?.userId],
    queryFn: () => fetchAgentEpisodes({ ...filters, userId: agent!.userId! }),
    enabled: Boolean(agent?.userId),
  });
  const r = q.data;
  const maxDay = Math.max(1, ...(r?.daily.map((d) => d.medianSeconds ?? 0) ?? [0]));
  if (q.error) return <Notice tone="error">{(q.error as Error).message}</Notice>;
  if (!r) return <p className="text-[14px] text-fg-3" aria-busy>Loading the report…</p>;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Chats answered" value={r.totals.answered.toLocaleString()} />
        <Stat label="Median reply" value={formatDuration(r.totals.medianSeconds)} hint={r.totals.enoughData ? "Half of the chats were answered faster" : `Needs ${r.minSample} answered chats`} />
        <Stat label="90% answered within" value={formatDuration(r.totals.p90Seconds)} />
        <Stat label="Within the target" value={r.totals.withinSlaPercent === null ? "No data yet" : `${r.totals.withinSlaPercent}%`} hint={`Target: ${r.settings.slaMinutes} min`} />
        <Stat label="Waiting for a reply" value={String(r.totals.waiting)} hint="Open chats nobody has answered" />
      </div>
      <p className="text-[13px] text-fg-3">{r.timeNote}</p>

      <section className="card p-5" aria-label="Leaderboard">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[18px] font-semibold">Leaderboard</h2>
          <button className={btn("secondary", "sm")} onClick={() => void exportTeamResponse(filters).catch((e) => setError(e.message))}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
        {r.agents.length === 0 ? (
          <p className="mt-3 text-[14px] text-fg-3">Nobody on the team answered a chat in these dates.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[14px] min-w-[640px]">
              <thead>
                <tr className="text-left text-[12.5px] text-fg-3">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Person</th>
                  <th className="py-2 pr-3 font-medium text-right">Answered</th>
                  <th className="py-2 pr-3 font-medium text-right">Median</th>
                  <th className="py-2 pr-3 font-medium text-right">90% within</th>
                  <th className="py-2 pr-3 font-medium text-right">In target</th>
                  <th className="py-2 pr-3 font-medium text-right">Replies sent</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {r.agents.map((a) => (
                  <tr key={a.userId ?? a.name}>
                    <td className="py-2.5 pr-3 num text-fg-2">{a.rank ?? "–"}</td>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-fg">{a.name}</span> <Pill>{a.team}</Pill>
                    </td>
                    <td className="py-2.5 pr-3 text-right num">{a.answered}</td>
                    <td className="py-2.5 pr-3 text-right num">{a.enoughData ? formatDuration(a.medianSeconds) : <span className="text-fg-3" title={`Needs ${r.minSample} answered chats`}>Not enough data</span>}</td>
                    <td className="py-2.5 pr-3 text-right num">{a.enoughData ? formatDuration(a.p90Seconds) : "–"}</td>
                    <td className="py-2.5 pr-3 text-right num">{a.withinSlaPercent === null ? "–" : `${a.withinSlaPercent}%`}</td>
                    <td className="py-2.5 pr-3 text-right num">{a.repliesSent}</td>
                    <td className="py-2.5 text-right">
                      {a.userId && (
                        <button className={btn("ghost", "sm")} onClick={() => setAgent(a)} aria-label={`Show the chats behind ${a.name}'s numbers`}>
                          Chats
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5" aria-label="Waiting for a reply">
        <h2 className="text-[18px] font-semibold">Waiting for a reply</h2>
        {r.waiting.length === 0 ? (
          <p className="mt-2 text-[14px] text-fg-3">No open chat is waiting. Everyone who wrote has been answered.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {r.waiting.slice(0, 15).map((w) => (
              <li key={w.conversationId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14.5px] font-medium text-fg">{w.contact}</p>
                  <p className="text-[13px] text-fg-2">
                    {w.assignedTo ? `${w.assignedTo} · ` : ""}
                    {lineName(w.session)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Pill tone={w.waitingSeconds > r.settings.slaMinutes * 60 ? "danger" : "warn"}>Waiting {formatDuration(w.waitingSeconds)}</Pill>
                  <button className={btn("secondary", "sm")} onClick={() => onOpenChat(w.conversationId)} aria-label={`Open the chat with ${w.contact}`}>
                    Open chat
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5" aria-label="Day by day">
        <h2 className="text-[18px] font-semibold">Day by day</h2>
        {r.daily.length === 0 ? (
          <p className="mt-2 text-[14px] text-fg-3">Nothing was answered in these dates.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {r.daily.map((d) => (
              <li key={d.date} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-[13.5px]">
                <span className="text-fg-2">{dayText(d.date)}</span>
                <span className="h-2.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
                  <span className="block h-full rounded-full bg-gold-gradient" style={{ width: `${d.medianSeconds === null ? 0 : Math.max(4, (d.medianSeconds / maxDay) * 100)}%` }} />
                </span>
                <span className="num text-fg">
                  {d.enoughData ? formatDuration(d.medianSeconds) : "–"} <span className="text-fg-3">· {d.answered} answered</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ChatsSheet title={agent ? `${agent.name}: the chats behind the numbers` : null} onClose={() => setAgent(null)}>
        {episodes.isPending && <p className="text-[14px] text-fg-3">Loading…</p>}
        {episodes.error && <Notice tone="error">{(episodes.error as Error).message}</Notice>}
        {episodes.data && (
          <>
            <div className="flex justify-end mb-2">
              <button className={btn("secondary", "sm")} onClick={() => void exportAgentEpisodes({ ...filters, userId: agent!.userId! }).catch((e) => setError(e.message))}>
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <ul className="divide-y divide-line">
              {episodes.data.map((e, i) => (
                <li key={`${e.conversationId}-${i}`} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-[14px]">
                  <span>
                    <span className="text-fg font-medium">{e.contact}</span> <span className="text-fg-3">· {e.session}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="num">{formatDuration(e.seconds)}</span>
                    <button className={btn("ghost", "sm")} onClick={() => onOpenChat(e.conversationId)}>
                      Open
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </ChatsSheet>
    </div>
  );
}

function Daily({ onOpenChat }: { onOpenChat: (id: string) => void }) {
  const tenant = getStoredTenantId();
  const [date, setDate] = useState(isoDay(-1));
  const [drill, setDrill] = useState<{ title: string; params: { sessionName?: string; team?: string; userId?: number } } | null>(null);
  const q = useQuery({ queryKey: ["report-daily", tenant, date], queryFn: () => fetchDailyReport(date) });
  const chats = useQuery({ queryKey: ["report-daily-chats", tenant, date, drill?.params], queryFn: () => fetchDailyChats({ date, ...drill!.params }), enabled: Boolean(drill) });
  const d = q.data;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Day">
          <input type="date" aria-label="Day" value={date} max={isoDay(0)} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${inputCls} !w-auto`} />
        </Field>
        <div className="flex gap-2 pb-0.5">
          <button className={btn("ghost", "sm")} onClick={() => setDate(isoDay(-1))}>Yesterday</button>
          <button className={btn("ghost", "sm")} onClick={() => setDate(isoDay(0))}>Today so far</button>
        </div>
      </div>
      {q.error && <Notice tone="error">{(q.error as Error).message}</Notice>}
      {!d ? (
        <p className="text-[14px] text-fg-3" aria-busy>Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="New chats" value={String(d.newChats)} />
            <Stat label="Customer messages in" value={String(d.received)} />
            <Stat label="Replies out" value={String(d.replied)} hint="By people, not automations" />
            <Stat label="Median reply" value={formatDuration(d.medianSeconds)} />
            <Stat label="Waiting now" value={String(d.waitingNow)} />
          </div>
          {d.topAgent && <p className="text-[14px] text-fg-2">Most chats answered: <strong className="text-fg">{d.topAgent.name}</strong> ({d.topAgent.answered}).</p>}
          <section className="card p-5" aria-label="By WhatsApp number">
            <h2 className="text-[18px] font-semibold">By WhatsApp number</h2>
            <ul className="mt-2 divide-y divide-line">
              {d.numbers.map((n) => (
                <li key={n.session} className="py-3 flex flex-wrap items-center justify-between gap-3 text-[14px]">
                  <span>
                    <span className="font-medium text-fg">{n.label}</span> <Pill>{n.team}</Pill>
                  </span>
                  <span className="flex items-center gap-4 num text-fg-2">
                    <span>{n.newChats} new</span>
                    <span>{n.received} in</span>
                    <span>{n.replied} out</span>
                    <button className={btn("ghost", "sm")} onClick={() => setDrill({ title: `${n.label}: chats on ${dayText(date)}`, params: { sessionName: n.session } })} aria-label={`Show the chats on ${n.label}`}>
                      Chats
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5" aria-label="By team">
            <h2 className="text-[18px] font-semibold">By team</h2>
            {d.teams.length === 0 ? (
              <p className="mt-2 text-[14px] text-fg-3">Nobody answered a chat on this day.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {d.teams.map((t) => (
                  <li key={t.team} className="py-3 flex flex-wrap items-center justify-between gap-3 text-[14px]">
                    <span className="font-medium text-fg capitalize">{t.team}</span>
                    <span className="flex items-center gap-4 num text-fg-2">
                      <span>{t.answered} answered</span>
                      <span>{t.repliesSent} replies</span>
                      <button className={btn("ghost", "sm")} onClick={() => setDrill({ title: `${t.team}: chats on ${dayText(date)}`, params: { team: t.team } })} aria-label={`Show the ${t.team} team's chats`}>
                        Chats
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-5" aria-label="Scorecards">
            <h2 className="text-[18px] font-semibold">Scorecards</h2>
            {d.agents.length === 0 ? (
              <p className="mt-2 text-[14px] text-fg-3">No scorecards: nobody answered a chat on this day.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {d.agents.map((a) => (
                  <li key={a.userId ?? a.name} className="py-3 flex flex-wrap items-center justify-between gap-3 text-[14px]">
                    <span>
                      <span className="font-medium text-fg">{a.name}</span> <Pill>{a.team}</Pill>
                    </span>
                    <span className="flex items-center gap-4 num text-fg-2">
                      <span>{a.answered} answered</span>
                      <span>{a.enoughData ? `median ${formatDuration(a.medianSeconds)}` : "not enough for a median"}</span>
                      {a.userId && (
                        <button className={btn("ghost", "sm")} onClick={() => setDrill({ title: `${a.name}: chats on ${dayText(date)}`, params: { userId: a.userId! } })} aria-label={`Show ${a.name}'s chats`}>
                          Chats
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <ChatsSheet title={drill?.title ?? null} onClose={() => setDrill(null)}>
        {chats.isPending && <p className="text-[14px] text-fg-3">Loading…</p>}
        {chats.data?.length === 0 && <p className="text-[14px] text-fg-3">No chats.</p>}
        <ul className="divide-y divide-line">
          {chats.data?.map((c) => (
            <li key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-[14px]">
              <span>
                <span className="font-medium text-fg">{c.contact}</span> <span className="text-fg-3">· {c.received} in, {c.replied} out{c.repliedBy ? `, ${c.repliedBy}` : ""}</span>
              </span>
              <button className={btn("ghost", "sm")} onClick={() => onOpenChat(c.id)}>
                Open
              </button>
            </li>
          ))}
        </ul>
      </ChatsSheet>
    </div>
  );
}

function Settings({ teams }: { teams: string[] }) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["report-settings", tenant], queryFn: fetchReportSettings });
  const [form, setForm] = useState<{ sla: string; teams: Record<string, string>; app: boolean; email: boolean } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const s = q.data;
  const f = form ?? (s && { sla: String(s.slaMinutes), teams: Object.fromEntries(teams.map((t) => [t, s.teams[t] ? String(s.teams[t]) : ""])), app: s.dailyInApp, email: s.dailyEmail });
  if (q.error) return <Notice tone="error">{(q.error as Error).message}</Notice>;
  if (!f) return <p className="text-[14px] text-fg-3">Loading…</p>;
  const change = (patch: Partial<typeof f>) => {
    setSaved(false);
    setForm({ ...f, ...patch });
  };
  return (
    <form
      className="card p-6 space-y-5 max-w-xl"
      aria-label="Report settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await saveReportSettings({
            slaMinutes: Number(f.sla),
            dailyInApp: f.app,
            dailyEmail: f.email,
            teams: Object.fromEntries(Object.entries(f.teams).filter(([, v]) => v.trim()).map(([k, v]) => [k, Number(v)])),
          });
          await Promise.all([qc.invalidateQueries({ queryKey: ["report-settings", tenant] }), qc.invalidateQueries({ queryKey: ["report-times", tenant] })]);
          setForm(null);
          setSaved(true);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Reply target, in minutes" hint="A chat answered inside this time counts as on target.">
        <input aria-label="Reply target in minutes" type="number" min={1} max={10080} value={f.sla} onChange={(e) => change({ sla: e.target.value })} className={inputCls} />
      </Field>
      {teams.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-[13px] font-medium text-fg-2 mb-1">A different target for a team</legend>
          {teams.map((t) => (
            <Field key={t} label={`${t[0].toUpperCase()}${t.slice(1)} team`} hint="Blank uses the company target.">
              <input aria-label={`${t} team target in minutes`} type="number" min={1} max={10080} value={f.teams[t] ?? ""} onChange={(e) => change({ teams: { ...f.teams, [t]: e.target.value } })} className={inputCls} />
            </Field>
          ))}
        </fieldset>
      )}
      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-fg-2 mb-1">The morning summary of yesterday</legend>
        <label className="flex items-center gap-3 text-[14.5px]">
          <input type="checkbox" checked={f.app} onChange={(e) => change({ app: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--c-brand-solid))]" /> Tell owners and administrators in the app
        </label>
        <label className="flex items-center gap-3 text-[14.5px]">
          <input type="checkbox" checked={f.email} onChange={(e) => change({ email: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--c-brand-solid))]" /> Also email the owner
        </label>
      </fieldset>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex items-center gap-3">
        <button className={btn("primary")} disabled={busy}>Save settings</button>
        {saved && <span role="status" className="text-[13.5px] text-ok">Saved.</span>}
      </div>
    </form>
  );
}

// Reports for owners and administrators: how fast the team answers, who answers most, and what is waiting.
export function Reports({ sessions, currentUserId, onOpenChat }: { sessions: WhatsAppSession[]; currentUserId?: number | string | null; onOpenChat: (conversationId: string) => void }) {
  const [section, setSection] = useState<Section>("times"),
    [preset, setPreset] = useState<Preset>("30"),
    [custom, setCustom] = useState({ from: isoDay(-29), to: isoDay(0) }),
    [team, setTeam] = useState(""),
    [session, setSession] = useState("");
  const range = rangeOf(preset, custom);
  const filters: ReportFilters = { ...range, ...(team ? { team } : {}), ...(session ? { sessionName: session } : {}) };
  const meta = useQuery({ queryKey: ["report-times", getStoredTenantId(), { ...range, team: "", sessionName: "" }], queryFn: () => fetchTeamResponse({ ...range }) });
  const teams = meta.data?.teams ?? [];
  return (
    <Page>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="How fast your team answers, who answers most, and which chats are waiting."
        actions={
          <Segmented<Section>
            label="Report sections"
            items={[
              { key: "times", label: "Reply times" },
              { key: "daily", label: "Daily report" },
              { key: "settings", label: "Settings" },
            ]}
            value={section}
            onChange={setSection}
          />
        }
      />
      {section === "times" && (
        <>
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <Segmented<Preset>
              label="Dates"
              items={[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "7", label: "7 days" },
                { key: "30", label: "30 days" },
                { key: "custom", label: "Pick dates" },
              ]}
              value={preset}
              onChange={setPreset}
            />
            {preset === "custom" && (
              <>
                <Field label="From">
                  <input type="date" aria-label="From" value={custom.from} max={custom.to} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} className={`${inputCls} !w-auto`} />
                </Field>
                <Field label="To">
                  <input type="date" aria-label="To" value={custom.to} min={custom.from} max={isoDay(0)} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} className={`${inputCls} !w-auto`} />
                </Field>
              </>
            )}
            {teams.length > 1 && (
              <Field label="Team">
                <select aria-label="Team" value={team} onChange={(e) => setTeam(e.target.value)} className={`${selectCls} !w-auto`}>
                  <option value="">Every team</option>
                  {teams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {sessions.length > 1 && (
              <Field label="WhatsApp number">
                <select aria-label="WhatsApp number" value={session} onChange={(e) => setSession(e.target.value)} className={`${selectCls} !w-auto`}>
                  <option value="">Every number</option>
                  {sessions.map((s) => (
                    <option key={s.sessionKey} value={s.sessionKey}>
                      {numberName(s, currentUserId)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <ReplyTimes filters={filters} sessions={sessions} currentUserId={currentUserId} onOpenChat={onOpenChat} />
        </>
      )}
      {section === "daily" && <Daily onOpenChat={onOpenChat} />}
      {section === "settings" && <Settings teams={teams} />}
    </Page>
  );
}
