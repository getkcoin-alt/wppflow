import { useQuery } from "@tanstack/react-query";
import { getOtpLog, type OtpOverview, type OtpRequest } from "../../../services/api";
import { Pill } from "../../ui/Page";

const TONE: Record<string, "ok" | "warn" | "danger" | "info" | "neutral"> = { verified: "ok", delivered: "info", read: "info", sent: "neutral", pending: "neutral", uncertain: "warn", expired: "neutral", locked: "warn", superseded: "neutral", failed: "danger" };
const WORDS: Record<string, string> = { not_on_whatsapp: "Not on WhatsApp", number_offline: "Number offline", delivery_failed: "Not delivered", busy: "Number busy", delivery_uncertain: "Not confirmed" };
const label = (r: OtpRequest) => (r.status === "failed" && r.error ? WORDS[r.error] || "Failed" : r.status === "verified" ? "Verified" : r.status.charAt(0).toUpperCase() + r.status.slice(1));

function Meter({ name, used, limit }: { name: string; used: number; limit: number }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13.5px]">
        <span className="text-fg-2">{name}</span>
        <span className="text-fg font-medium tabular-nums">{used} of {limit}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
        <div className={`h-full rounded-full ${pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warn" : "bg-brand-solid"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** What has been used, what came of it, and the latest codes (numbers hidden but for the last four digits). */
export function ActivityCard({ usage, stats, tenant }: { usage: OtpOverview["usage"]; stats: OtpOverview["stats"]; tenant: string | null }) {
  const log = useQuery({ queryKey: ["otp-log", tenant], queryFn: getOtpLog, refetchInterval: 8000 });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Meter name="Free codes today" used={usage.today.used} limit={usage.today.limit} />
        <Meter name="Free codes this month" used={usage.month.used} limit={usage.month.limit} />
      </div>
      {stats.sent > 0 && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            ["Sent (7 days)", stats.sent],
            ["Delivered", stats.delivered],
            ["Verified", stats.verified],
            ["Median time to verify", stats.medianSecondsToVerify == null ? "–" : `${stats.medianSecondsToVerify}s`],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl bg-surface-2 py-3">
              <dd className="text-[20px] font-semibold text-fg tabular-nums">{v}</dd>
              <dt className="text-[12px] text-fg-3">{k}</dt>
            </div>
          ))}
        </dl>
      )}
      {log.data?.length ? (
        <ul className="divide-y divide-line rounded-2xl bg-surface-2/60 px-4" aria-label="Recent codes">
          {log.data.slice(0, 12).map((r) => (
            <li key={r.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
              <span className="font-mono text-fg">{r.to}</span>
              <Pill tone={TONE[r.status] || "neutral"}>{label(r)}</Pill>
              <span className="text-fg-3">{r.mode === "test" ? "test key" : r.source === "dashboard" ? "test from here" : r.source === "widget" ? "widget" : "your server"}</span>
              <span className="ml-auto text-fg-3">{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{r.secondsToVerify != null ? ` · ${r.secondsToVerify}s` : ""}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-fg-3">Nothing has been sent yet. Your codes will be listed here, as they happen.</p>
      )}
    </div>
  );
}
