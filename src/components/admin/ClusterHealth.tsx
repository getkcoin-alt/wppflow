import { useQuery } from "@tanstack/react-query";
import { apiGet, getStoredTenantId } from "../../services/api";
export function ClusterHealth() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["diagnostics", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/health"),
    refetchInterval: 15000,
  });
  return (
    <section className="space-y-4">
      <header className="flex justify-between">
        <h1 className="text-xl font-bold">Engine Health</h1>
        <button onClick={() => void refetch()} className="text-emerald-400">
          Refresh measurements
        </button>
      </header>
      {error && <p role="alert">{error.message}</p>}
      {isPending && <p>Loading measurements…</p>}
      {data && (
        <div className="bg-[#111b21] p-5 rounded-xl space-y-3">
          <p>API process uptime: {Math.floor(data.uptime / 60)} minutes</p>
          <p>
            API memory: {(data.nodeMemoryBytes / 1024 / 1024).toFixed(1)} MB
          </p>
          <p>
            Host memory capacity:{" "}
            {(data.hostTotalMemoryBytes / 1024 ** 3).toFixed(1)} GB
          </p>
          <p>Host load averages: {data.loadAverage.join(", ")}</p>
          <p>
            Redis queue:{" "}
            {data.queue.connected
              ? "Connected"
              : "Unavailable — messages retained in the outbox"}
          </p>
          <p className="text-sm text-slate-400">{data.note}</p>
        </div>
      )}
    </section>
  );
}
