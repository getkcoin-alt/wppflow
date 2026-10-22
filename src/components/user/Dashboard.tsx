import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Megaphone, MessageSquare, Smartphone } from "lucide-react";
import { apiGet, getStoredTenantId } from "../../services/api";
import { Notice, Page, PageHeader } from "../ui/Page";
import { btn } from "../ui/styles";

const fmt = (n: unknown) => Number(n || 0).toLocaleString();
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: unknown;
  hint?: string;
}) {
  return (
    <div className="card p-6">
      <p className="text-[13.5px] text-fg-2">{label}</p>
      <p className="mt-2 text-[40px] leading-none font-semibold text-fg num tracking-tight">
        {fmt(value)}
      </p>
      {hint && <p className="mt-3 text-[13px] text-fg-3">{hint}</p>}
    </div>
  );
}

function Meter({
  label,
  value,
  of,
}: {
  label: string;
  value: number;
  of: number;
}) {
  const p = pct(value, of);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[14px] text-fg-2">{label}</span>
        <span className="text-[14px] text-fg num">
          <span className="font-semibold">{fmt(value)}</span>
          <span className="text-fg-3"> · {p}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gold-gradient transition-[width] duration-700 ease-out"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

export function Dashboard({
  workspaceName,
  onNavigateToInbox,
  onOpenSessionModal,
  onOpenNewBroadcast,
}: {
  workspaceName: string;
  onNavigateToInbox: () => void;
  onOpenSessionModal: () => void;
  onOpenNewBroadcast: () => void;
}) {
  const { data, error, isPending } = useQuery({
    queryKey: ["summary", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/summary"),
    refetchInterval: 15000,
  });
  if (error)
    return (
      <Page>
        <Notice tone="error">{error.message}</Notice>
      </Page>
    );
  if (isPending)
    return (
      <Page>
        <div className="skeleton h-12 w-72 mb-3" />
        <div className="skeleton h-5 w-96 max-w-full mb-8" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-36 !rounded-3xl" />
          ))}
        </div>
        <span className="sr-only">Loading workspace activity…</span>
      </Page>
    );
  const s = data.summary;
  return (
    <Page>
      <PageHeader
        eyebrow="Overview"
        title={workspaceName}
        subtitle="How your team’s WhatsApp is doing, from saved activity."
        actions={
          <>
            <button onClick={onNavigateToInbox} className={btn("primary")}>
              <MessageSquare className="w-4 h-4" /> Open inbox
            </button>
            <button onClick={onOpenSessionModal} className={btn("secondary")}>
              <Smartphone className="w-4 h-4" /> Connect a number
            </button>
            <button onClick={onOpenNewBroadcast} className={btn("secondary")}>
              <Megaphone className="w-4 h-4" /> Broadcasts
            </button>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Conversations" value={s.conversations} />
        <Stat
          label="Waiting for a reply"
          value={s.unread}
          hint={s.unread ? "Unread conversations" : "You’re all caught up"}
        />
        <Stat label="Connected numbers" value={s.sessions} />
        <Stat label="Contacts" value={s.contacts} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        <section className="card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-semibold">Delivery</h2>
            <span className="text-[13px] text-fg-3">
              All confirmed outgoing messages
            </span>
          </div>
          <div className="space-y-6">
            <Meter
              label="Sent"
              value={Number(s.sent || 0)}
              of={Number(s.sent || 0)}
            />
            <Meter
              label="Delivered"
              value={Number(s.delivered || 0)}
              of={Number(s.sent || 0)}
            />
            <Meter
              label="Read"
              value={Number(s.read || 0)}
              of={Number(s.sent || 0)}
            />
          </div>
        </section>
        <section className="card p-6 sm:p-8 flex flex-col">
          <h2 className="text-[20px] font-semibold">Queue</h2>
          <p className="mt-6 text-[56px] leading-none font-semibold num tracking-tight">
            {fmt(s.pending)}
          </p>
          <p className="mt-3 text-[14.5px] text-fg-2">
            {Number(s.pending)
              ? "Messages waiting to be sent."
              : "Nothing waiting. Everything has been sent."}
          </p>
          <button
            onClick={onNavigateToInbox}
            className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-gold hover:gap-2.5 transition-all"
          >
            Go to inbox <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
      <p className="mt-6 text-[12.5px] text-fg-3 max-w-2xl">
        Sent, delivered and read are cumulative counts of confirmed outgoing
        messages. Private notes are excluded.
      </p>
    </Page>
  );
}
