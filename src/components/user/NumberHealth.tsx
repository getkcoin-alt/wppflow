import type { ReactNode } from "react";
import { Pill } from "../ui/Page";
import { useNow } from "../../hooks/useNow";
import { formatDuration } from "../../utils/duration";
import { timeAgo } from "../../utils/timeAgo";
import type { NumberHealthRow } from "../../services/api";

const LEVEL = {
  ok: { tone: "ok", text: "Healthy" },
  warn: { tone: "warn", text: "Needs a look" },
  down: { tone: "danger", text: "Down" },
} as const;

// How one number is doing, in a few lines: whether it answers when the server asks, how long it has been up,
// what went wrong when sending, what is waiting to leave, and what the server has already tried by itself.
function Row({ label, children, bad = false }: { label: string; children: ReactNode; bad?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-3">{label}</dt>
      <dd className={`num text-right ${bad ? "text-danger font-medium" : "text-fg"}`}>{children}</dd>
    </div>
  );
}

export function NumberHealthBlock({ health }: { health: NumberHealthRow }) {
  const now = useNow();
  if (health.level === "unpaired") return null;
  const level = LEVEL[health.level];
  const upFor = health.connectedSince ? (now - new Date(health.connectedSince).getTime()) / 1000 : null;
  return (
    <section aria-label={`Health of ${health.label}`} className="mt-5 rounded-2xl bg-surface-2 p-3.5 text-[13.5px] space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-fg-2">Health</h3>
        <Pill tone={level.tone} dot>
          {level.text}
        </Pill>
      </div>
      {health.problems.length > 0 && (
        <ul className="space-y-1">
          {health.problems.map((p) => (
            <li key={p.code} className={health.level === "down" ? "text-danger" : "text-warn"}>
              {p.text}
            </li>
          ))}
        </ul>
      )}
      <dl className="space-y-1.5">
        <Row label="Last check">{health.lastHeartbeatAt ? timeAgo(health.lastHeartbeatAt, now) : "Not checked yet"}</Row>
        {upFor !== null && <Row label="Connected for">{formatDuration(upFor)}</Row>}
        <Row label="Failed sends, last 24 h" bad={health.sends.failedLast24h > 0}>
          {health.sends.failedLast24h}
        </Row>
        <Row label="Waiting to send" bad={health.queued.count > 0 && (health.queued.oldestSeconds ?? 0) >= 600}>
          {health.queued.count}
          {health.queued.count > 0 && health.queued.oldestSeconds !== null ? ` · oldest ${formatDuration(health.queued.oldestSeconds)}` : ""}
        </Row>
        {health.reconnectAttempts > 0 && <Row label="Reconnect attempts">{health.reconnectAttempts}</Row>}
      </dl>
    </section>
  );
}
