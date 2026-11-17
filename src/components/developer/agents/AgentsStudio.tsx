import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, ShieldCheck } from "lucide-react";
import { createAgent, getAgents, getStoredTenantId, revokeAgent, updateAgent, type AgentInput } from "../../../services/api";
import { Notice } from "../../ui/Page";
import { btn } from "../../ui/styles";
import { CodeBlock } from "../otp/CodeBlock";
import { ActivityList } from "./ActivityList";
import { AgentCard } from "./AgentCard";
import { AgentForm } from "./AgentForm";
import { ConnectPanel } from "./ConnectPanel";

const problem = (e: any): string => `${e?.message || "Something went wrong."}${e?.data?.fix ? ` ${e.data.fix}` : ""}`;

const SAFE = [
  "It has a key of its own, never your password. Revoke it and it stops at once.",
  "It sees only the numbers you choose, and no group chats or customers' phone numbers unless you allow them.",
  "It has limits on how many messages it may send, so a mistake cannot become a flood.",
  "Customers are told when an AI answered, and \"human\" brings a person from your team.",
  "Everything it does is listed at the bottom of this page.",
  "What it reads goes to the AI service you connect it to. Choose one you trust with your customers' messages.",
];

/** Developers → AI agents: make an agent, say what it may do, connect it, and watch what it does. */
export function AgentsStudio({ canManage }: { canManage: boolean }) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"list" | "new" | string>("list"); // an agent's id: that agent's settings are open
  const [open, setOpen] = useState<string | null>(null); // the agent whose connect panel is open
  const [fresh, setFresh] = useState<{ id: string; key: string } | null>(null); // a key made on this visit: shown once, kept nowhere
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const overview = useQuery({
    queryKey: ["agents", tenant],
    queryFn: getAgents,
    enabled: canManage,
    // while a freshly connected panel waits for the agent's first call, look every few seconds
    refetchInterval: (q) => (open && q.state.data?.agents.some((a) => a.id === open && a.state === "active" && !a.lastUsedAt) ? 4000 : false),
  });
  const data = overview.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["agents", tenant] });
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) return <Notice tone="info">AI agents are set up by your company's owner or an administrator. Ask them to open Developers, AI agents.</Notice>;
  if (overview.error && !data) return <Notice tone="error">{problem(overview.error)}</Notice>;
  if (!data) return <div className="card p-6 text-[14.5px] text-fg-3" role="status">Loading…</div>;
  if (!data.allowed) return <Notice tone="warn">{data.reason}</Notice>;

  const live = data.agents.filter((a) => a.state !== "revoked");
  const make = (input: AgentInput) =>
    act(async () => {
      const made = await createAgent(input);
      setFresh({ id: made.id, key: made.key });
      setOpen(made.id);
      setMode("list");
      await refresh();
    });
  const save = (id: string, input: AgentInput) =>
    act(async () => {
      await updateAgent(id, input);
      setMode("list");
      await refresh();
    });
  const revoke = (id: string) =>
    act(async () => {
      await revokeAgent(id);
      if (open === id) setOpen(null);
      if (fresh?.id === id) setFresh(null);
      await refresh();
    });

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}

      {live.length === 0 ? (
        <section className="card p-5 sm:p-7" aria-labelledby="agents-intro">
          <div className="flex items-start gap-4">
            <span className="h-11 w-11 shrink-0 rounded-full bg-gold/15 text-gold grid place-items-center" aria-hidden>
              <Bot className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 id="agents-intro" className="text-[19px] font-semibold text-fg">Let an AI agent work your WhatsApp inbox</h2>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-fg-2">
                Connect Claude, ChatGPT, Cursor or an agent of your own to this workspace. Ask it to answer the chats that are waiting, find a customer, hand a chat to a teammate or sum up the day. It works like a teammate with a login of its own, and does only what you allow.
              </p>
            </div>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3 text-[14px] text-fg-2" aria-label="How it works">
            {[
              ["Make an agent", "Choose what it may do and which numbers it may use."],
              ["Connect it", "Copy one snippet into your AI app. It takes a minute."],
              ["Ask it", "\"Answer the chats that are waiting for a reply.\""],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl bg-surface-2 p-4">
                <span className="text-[12.5px] font-semibold text-gold">Step {i + 1}</span>
                <span className="block mt-0.5 text-[15px] font-semibold text-fg">{t}</span>
                <span className="block mt-1">{d}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-5 space-y-1.5 text-[13.5px] text-fg-2" aria-label="What keeps it safe">
            {SAFE.map((s) => (
              <li key={s} className="flex gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-ok" aria-hidden />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <details className="card px-5 py-1">
          <summary className="cursor-pointer select-none min-h-11 flex items-center text-[14.5px] font-medium text-fg">How agents work, and what keeps them safe</summary>
          <ul className="pb-4 space-y-1.5 text-[13.5px] text-fg-2">
            {SAFE.map((s) => (
              <li key={s} className="flex gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-ok" aria-hidden />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {fresh && (
        <section className="card p-5 sm:p-6 ring-1 ring-gold/40 space-y-3" aria-labelledby="agent-key-title" role="status">
          <h2 id="agent-key-title" className="text-[16.5px] font-semibold text-fg">Copy the key now</h2>
          <p className="text-[14px] text-fg-2">It is shown once. Scriwo cannot show it again, and it is not kept in your browser. Put it only where the agent runs.</p>
          <CodeBlock code={fresh.key} label="Agent key" wrap />
          <button type="button" onClick={() => setFresh(null)} className={btn("secondary", "sm")}>
            I have copied it
          </button>
        </section>
      )}

      {mode === "new" ? (
        <section className="card p-5 sm:p-7" aria-labelledby="agent-new-title">
          <h2 id="agent-new-title" className="text-[18px] font-semibold text-fg mb-5">New agent</h2>
          <AgentForm overview={data} busy={busy} onSubmit={(v) => void make(v)} onCancel={() => setMode("list")} />
        </section>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setMode("new")} disabled={live.length >= data.maxAgents} className={btn("primary")}>
            <Plus className="w-4 h-4" aria-hidden /> Make an agent
          </button>
          {live.length >= data.maxAgents && <span className="text-[13.5px] text-fg-3">A company can have up to {data.maxAgents} agents. Revoke one to make room.</span>}
        </div>
      )}

      {data.agents.length > 0 && (
        <ul className="space-y-4" aria-label="Your agents">
          {data.agents.map((a) =>
            mode === a.id ? (
              <li key={a.id} className="card p-5 sm:p-7" aria-label={`Settings for ${a.name}`}>
                <h3 className="text-[17px] font-semibold text-fg mb-5">Settings for {a.name}</h3>
                <AgentForm overview={data} initial={a} busy={busy} onSubmit={(v) => void save(a.id, v)} onCancel={() => setMode("list")} />
              </li>
            ) : (
              <AgentCard
                key={a.id}
                agent={a}
                levels={data.levels}
                connecting={open === a.id}
                busy={busy}
                onConnect={() => setOpen(open === a.id ? null : a.id)}
                onEdit={() => setMode(a.id)}
                onRevoke={() => void revoke(a.id)}
              >
                <ConnectPanel agent={a} secret={fresh?.id === a.id ? fresh.key : null} endpoints={data.endpoints} />
              </AgentCard>
            ),
          )}
        </ul>
      )}

      {data.agents.length > 0 && <ActivityList agents={data.agents} />}
    </div>
  );
}
