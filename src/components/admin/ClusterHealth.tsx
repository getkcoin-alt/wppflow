import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiGet, getStoredTenantId } from "../../services/api";
import { Notice, Pill } from "../ui/Page";
import { btn } from "../ui/styles";
import { MediaStorageCard } from "./MediaStorageCard";

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-6">
      <p className="text-[13.5px] text-fg-2">{label}</p>
      <p className="mt-2 text-[26px] xl:text-[28px] leading-none font-semibold num tracking-tight whitespace-nowrap">
        {value}
      </p>
      {sub && <p className="mt-2 text-[13px] text-fg-3">{sub}</p>}
    </div>
  );
}

export function ClusterHealth() {
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ["diagnostics", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/health"),
    refetchInterval: 15000,
  });
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {data && (
            <Pill tone={data.queue.connected ? "ok" : "warn"} dot>
              {data.queue.connected ? "Queue connected" : "Queue unavailable"}
            </Pill>
          )}
        </div>
        <button
          onClick={() => void refetch()}
          className={btn("secondary", "sm")}
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />{" "}
          Refresh measurements
        </button>
      </div>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isPending && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 !rounded-3xl" />
          ))}
          <span className="sr-only">Loading measurements…</span>
        </div>
      )}
      {data && (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Tile
              label="Uptime"
              value={`${Math.floor(data.uptime / 60)} min`}
              sub="API process"
            />
            <Tile
              label="API memory"
              value={`${(data.nodeMemoryBytes / 1024 / 1024).toFixed(1)} MB`}
            />
            <Tile
              label="Host memory"
              value={`${(data.hostTotalMemoryBytes / 1024 ** 3).toFixed(1)} GB`}
              sub="Total capacity"
            />
            <Tile
              label="Load average"
              value={data.loadAverage
                .map((n: number) => Number(n).toFixed(2))
                .join(" · ")}
              sub="1 · 5 · 15 min"
            />
          </div>
          {!data.queue.connected && (
            <Notice tone="error">
              Redis queue is unavailable. Messages are retained in the outbox.
            </Notice>
          )}
          <p className="text-[13px] text-fg-3">{data.note}</p>
        </>
      )}
      <MediaStorageCard />
    </section>
  );
}
