import { useQuery } from "@tanstack/react-query";
import { apiGet, getStoredTenantId } from "../../services/api";
export function AuditLogs() {
  const { data, error, isPending } = useQuery({
    queryKey: ["audit", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/audit"),
  });
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Workspace Audit Logs</h1>
      {error && <p role="alert">{error.message}</p>}
      {isPending && <p>Loading audit events…</p>}
      <div className="bg-[#111b21] rounded-xl p-5 space-y-3">
        {data?.events.map((e: any) => (
          <article key={e.id} className="border-b border-[#2a3942] pb-3">
            <strong>{e.event_type}</strong>
            <p className="text-sm text-slate-400">
              {e.actor || "System"} · {new Date(e.created_at).toLocaleString()}
            </p>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(e.metadata)}
            </pre>
          </article>
        ))}
        {data && !data.events.length && <p>No audit events recorded.</p>}
      </div>
    </section>
  );
}
