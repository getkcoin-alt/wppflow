import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { apiGet, getStoredTenantId } from "../../services/api";
import { EmptyState, Notice } from "../ui/Page";

const label = (t: string) =>
  String(t || "event")
    .replace(/[._:]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function AuditLogs() {
  const { data, error, isPending } = useQuery({
    queryKey: ["audit", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/audit"),
  });
  return (
    <section className="space-y-4">
      {error && <Notice tone="error">{error.message}</Notice>}
      {isPending && (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
          <span className="sr-only">Loading audit events…</span>
        </div>
      )}
      {data && !data.events.length && (
        <EmptyState
          icon={<ScrollText className="w-6 h-6" />}
          title="No activity recorded yet"
          body="Sign-ins, invitations and other important changes will appear here."
        />
      )}
      {!!data?.events.length && (
        <ol className="card !rounded-3xl divide-y divide-line overflow-hidden">
          {data.events.map((e: any) => (
            <li key={e.id} className="px-5 sm:px-6 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <strong className="text-[15px] font-medium text-fg">
                  {label(e.event_type)}
                </strong>
                <span className="text-[13px] text-fg-3 num">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-[13.5px] text-fg-2 mt-0.5">
                {e.actor || "System"}
              </p>
              {e.metadata && Object.keys(e.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="text-[12.5px] text-fg-3 cursor-pointer select-none">
                    Details
                  </summary>
                  <pre className="mt-2 rounded-2xl bg-surface-2 p-3 font-mono text-[12px] text-fg-2 whitespace-pre-wrap break-all">
                    {JSON.stringify(e.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
