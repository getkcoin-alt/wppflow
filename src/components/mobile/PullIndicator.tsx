import { ArrowDown, Loader2 } from "lucide-react";
import { PULL_TO_REFRESH } from "../../hooks/usePullToRefresh";

/** The small round indicator that follows a pull-to-refresh: an arrow that turns when it is far enough, then a spinner */
export function PullIndicator({ pull, refreshing }: { pull: number; refreshing: boolean }) {
  if (pull <= 0 && !refreshing) return null;
  const ready = pull >= PULL_TO_REFRESH.trigger;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center" style={{ transform: `translateY(${Math.max(pull - 44, -8)}px)`, opacity: Math.min(1, pull / 32 + (refreshing ? 1 : 0)) }} role="status" aria-label={refreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}>
      <span className="h-10 w-10 rounded-full bg-surface pop ring-1 ring-line grid place-items-center text-brand">
        {refreshing ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <ArrowDown className="w-5 h-5 transition-transform" style={{ transform: `rotate(${ready ? 180 : 0}deg)` }} aria-hidden />}
      </span>
    </div>
  );
}
