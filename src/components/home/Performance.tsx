import { useQuery } from "@tanstack/react-query";
import { apiGet, getStoredTenantId } from "../../services/api";

const fmt = (n: unknown) => Number(n || 0).toLocaleString();
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function Meter({ label, value, of }: { label: string; value: number; of: number }) {
  const p = pct(value, of);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13.5px] text-fg-2">{label}</span>
        <span className="text-[13.5px] text-fg num">
          <span className="font-semibold">{fmt(value)}</span>
          <span className="text-fg-3"> · {p}%</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-700 ease-out" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

/** The long-run numbers, kept below what needs doing: the old Overview, quieter. */
export function Performance() {
  const { data } = useQuery({
    queryKey: ["summary", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/summary"),
    refetchInterval: 30000,
  });
  const s = data?.summary;
  if (!s) return null;
  const sent = Number(s.sent || 0);
  return (
    <section aria-labelledby="performance-title" className="mt-10">
      <h2 id="performance-title" className="eyebrow mb-3">
        Performance
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Conversations", s.conversations],
          ["Contacts", s.contacts],
          ["Connected numbers", s.sessions],
          ["Messages waiting to send", s.pending],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl bg-surface border border-line p-4">
            <p className="text-[13px] text-fg-2">{label}</p>
            <p className="mt-1.5 text-[28px] leading-none font-semibold text-fg num tracking-tight">{fmt(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-3xl bg-surface border border-line p-5 grid sm:grid-cols-3 gap-5">
        <Meter label="Sent" value={sent} of={sent} />
        <Meter label="Delivered" value={Number(s.delivered || 0)} of={sent} />
        <Meter label="Read" value={Number(s.read || 0)} of={sent} />
      </div>
      <p className="mt-3 text-[12.5px] text-fg-3">Sent, delivered and read count every confirmed outgoing message. Private notes are not counted.</p>
    </section>
  );
}
