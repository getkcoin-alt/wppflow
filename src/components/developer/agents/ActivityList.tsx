import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgentActivity, getStoredTenantId, type Agent, type AgentEvent } from "../../../services/api";
import { timeAgo } from "../../../utils/timeAgo";
import { Pill } from "../../ui/Page";
import { btn } from "../../ui/styles";

const RESULT = (e: AgentEvent) =>
  e.ok === null ? (
    <Pill tone="neutral">Sending…</Pill>
  ) : e.errorCode === "duplicate" ? (
    <Pill tone="neutral">Repeat</Pill>
  ) : e.ok ? (
    <Pill tone="ok">Done</Pill>
  ) : (
    <Pill tone="warn">Refused</Pill>
  );

/** What the agents did, newest first: a short line each, never the words of a message. The owner can look at only what changed something. */
export function ActivityList({ agents }: { agents: Agent[] }) {
  const tenant = getStoredTenantId();
  const [changes, setChanges] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [older, setOlder] = useState<AgentEvent[]>([]);
  const [more, setMore] = useState(true);
  const first = useQuery({
    queryKey: ["agent-activity", tenant, changes, agentId],
    queryFn: () => getAgentActivity({ changes, agentId: agentId || undefined, limit: 30 }),
    refetchInterval: 10000,
  });
  const rows = [...(first.data ?? []), ...older];
  const reset = () => {
    setOlder([]);
    setMore(true);
  };
  const loadMore = async () => {
    const last = rows.at(-1);
    if (!last) return;
    const next = await getAgentActivity({ changes, agentId: agentId || undefined, limit: 30, beforeId: last.id });
    setOlder((o) => [...o, ...next]);
    if (next.length < 30) setMore(false);
  };
  return (
    <section aria-labelledby="agent-activity" className="card p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="agent-activity" className="text-[17px] font-semibold text-fg">
          What the agents did
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {agents.length > 1 && (
            <select
              aria-label="Show one agent"
              value={agentId}
              onChange={(e) => {
                setAgentId(e.target.value);
                reset();
              }}
              className="h-9 rounded-full bg-surface-2 px-3 text-[13.5px] text-fg outline-none"
            >
              <option value="">All agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={changes}
            onClick={() => {
              setChanges(!changes);
              reset();
            }}
            className={`${btn(changes ? "primary" : "secondary", "sm")}`}
          >
            Only what changed something
          </button>
        </div>
      </div>
      {first.error && <p className="text-[14px] text-danger" role="alert">{first.error.message}</p>}
      {!first.data && !first.error && <p className="text-[14px] text-fg-3" role="status">Loading…</p>}
      {first.data && rows.length === 0 && <p className="text-[14px] text-fg-3">Nothing yet. When an agent looks at a chat or answers a customer, it is listed here.</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl bg-surface-2/60 px-4" aria-label="Agent activity">
          {rows.map((e) => (
            <li key={e.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
              {RESULT(e)}
              <span className="text-fg font-medium">{e.agent}</span>
              <span className="text-fg-2 min-w-0 break-words">
                {e.summary}
                {e.chat ? ` · ${e.chat}` : ""}
              </span>
              {e.via === "test" && <Pill tone="info">test</Pill>}
              <span className="ml-auto text-fg-3 whitespace-nowrap" title={new Date(e.at).toLocaleString()}>
                {timeAgo(e.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length >= 30 && more && (
        <button type="button" onClick={() => void loadMore()} className={btn("secondary", "sm")}>
          Show older
        </button>
      )}
    </section>
  );
}
