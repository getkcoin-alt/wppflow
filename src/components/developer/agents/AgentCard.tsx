import { useState, type ReactNode } from "react";
import { Plug, Settings2, Trash2 } from "lucide-react";
import type { Agent, AgentsOverview } from "../../../services/api";
import { timeAgo } from "../../../utils/timeAgo";
import { Pill } from "../../ui/Page";
import { btn } from "../../ui/styles";
import { expiryText, lastUse, limitsText } from "./connect";

const STATE = { active: ["ok", "Active"], expired: ["warn", "Expired"], revoked: ["neutral", "Revoked"] } as const;

/** One agent: what it may do, whether it is connected, what it has sent, and the three things to do with it. */
export function AgentCard({
  agent,
  levels,
  connecting,
  busy,
  onConnect,
  onEdit,
  onRevoke,
  children,
}: {
  agent: Agent;
  levels: AgentsOverview["levels"];
  connecting: boolean;
  busy: boolean;
  onConnect: () => void;
  onEdit: () => void;
  onRevoke: () => void;
  /** what opens under the card: the connect panel */
  children?: ReactNode;
}) {
  const [asking, setAsking] = useState(false);
  const [tone, label] = STATE[agent.state];
  const level = levels.find((l) => l.key === agent.level)?.label ?? agent.level;
  const live = agent.state !== "revoked";
  const used = agent.usage;
  const flags = [agent.allowGroups && "groups allowed", agent.sharePhones && "sees phone numbers", agent.allowNewChats && `may start chats (${agent.limits.newChatsPerDay} a day)`, agent.disclose && "AI line added"].filter(Boolean) as string[];
  return (
    <li className={`card p-5 sm:p-6 ${live ? "" : "opacity-70"}`} aria-label={`Agent ${agent.name}`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16.5px] font-semibold text-fg truncate max-w-full">{agent.name}</h3>
            <Pill tone={tone} dot>
              {label}
            </Pill>
            <Pill tone={agent.level === "full" ? "gold" : "neutral"}>{level}</Pill>
          </div>
          <p className="mt-1 text-[13.5px] text-fg-2">
            {agent.numbers.length ? `Numbers: ${agent.numbers.join(", ")}` : "All numbers"}
            {flags.length ? ` · ${flags.join(", ")}` : ""}
          </p>
          <p className="mt-0.5 text-[13.5px] text-fg-3">
            {live ? lastUse(agent.lastUsedAt, agent.lastClient, timeAgo) : `Revoked ${timeAgo(agent.revokedAt!)}`}
            {live && ` · ${expiryText(agent.expiresAt)}`}
          </p>
          {live && (
            <p className="mt-0.5 text-[13.5px] text-fg-3">
              {used ? `Sent ${used.sentLastHour} in the last hour, ${used.sentLast24h} in 24 hours. ` : ""}
              Limits: {limitsText(agent.limits)}.
            </p>
          )}
          <p className="mt-0.5 text-[12.5px] text-fg-3 font-mono">{agent.prefix}…</p>
        </div>
        {live && !asking && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onConnect} aria-expanded={connecting} className={btn(connecting ? "secondary" : "primary", "sm")}>
              <Plug className="w-4 h-4" aria-hidden /> {connecting ? "Hide connect" : "Connect"}
            </button>
            <button type="button" onClick={onEdit} disabled={busy} className={btn("secondary", "sm")} aria-label={`Settings for ${agent.name}`}>
              <Settings2 className="w-4 h-4" aria-hidden /> Settings
            </button>
            <button type="button" onClick={() => setAsking(true)} disabled={busy} className={`${btn("ghost", "sm")} !text-danger`} aria-label={`Revoke ${agent.name}`}>
              <Trash2 className="w-4 h-4" aria-hidden /> Revoke
            </button>
          </div>
        )}
      </div>
      {asking && (
        <div className="mt-4 rounded-2xl bg-danger/10 p-4" role="alertdialog" aria-label={`Revoke ${agent.name}?`}>
          <p className="text-[14.5px] text-fg">
            Revoke <strong>{agent.name}</strong>? It stops working at once and cannot be switched back on. Its key becomes useless; nothing it already did is undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={onRevoke} className={btn("danger", "sm")}>
              Yes, revoke it
            </button>
            <button type="button" onClick={() => setAsking(false)} className={btn("ghost", "sm")}>
              Keep it
            </button>
          </div>
        </div>
      )}
      {connecting && live && <div className="mt-5 border-t border-line pt-5">{children}</div>}
    </li>
  );
}
