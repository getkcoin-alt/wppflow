import { useQuery } from "@tanstack/react-query";
import { apiGet, getStoredTenantId } from "../../services/api";
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
  if (error) return <p role="alert">{error.message}</p>;
  if (isPending) return <p>Loading workspace activity…</p>;
  const s = data.summary;
  return (
    <section className="space-y-6">
      <header className="bg-[#111b21] border border-[#2a3942] p-6 rounded-2xl">
        <h1 className="text-2xl font-bold">{workspaceName}</h1>
        <p className="text-slate-400 mt-2">
          Your team’s WhatsApp workspace. Counts below come from saved activity.
        </p>
        <div className="flex gap-4 mt-4">
          <button onClick={onNavigateToInbox} className="text-emerald-400">
            Open inbox
          </button>
          <button onClick={onOpenSessionModal}>Connect WhatsApp</button>
          <button onClick={onOpenNewBroadcast}>Campaigns</button>
        </div>
      </header>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries({
          Contacts: s.contacts,
          Conversations: s.conversations,
          "Unread conversations": s.unread,
          "Connected accounts": s.sessions,
          "Messages sent": s.sent,
          Delivered: s.delivered,
          Read: s.read,
          "Queued messages": s.pending,
        }).map(([label, value]) => (
          <div
            key={label}
            className="bg-[#111b21] border border-[#2a3942] rounded-xl p-5"
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-3xl font-bold mt-2">{String(value)}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Sent, delivered and read are cumulative confirmed outgoing message
        counts. Private notes are excluded. WhatsApp account availability is
        determined by the provider connection.
      </p>
    </section>
  );
}
