import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { fetchWorkflowInsights } from "../../../services/api";

/** How a workflow is doing, in one line under its card, and Riwo's suggestion when many answers could not be understood */
export function Insights({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["workflow-insights", id], queryFn: () => fetchWorkflowInsights(id), staleTime: 30_000 });
  const i = q.data?.insights;
  if (!i) return null;
  if (!i.started) return <p className="mt-3 text-[12.5px] text-fg-3">No one has gone through it yet.</p>;
  const ways = i.questions.flatMap((x) => x.options).filter((o) => o.count > 0);
  return (
    <div className="mt-3" aria-label="How it is doing">
      <p className="text-[12.5px] text-fg-2 leading-relaxed">
        <b className="font-semibold text-fg">{i.started}</b> {i.started === 1 ? "person" : "people"} so far ({i.last7Days} in the last 7 days)
        {ways.length > 0 && ` · ${ways.map((o) => `${o.count} ${o.label.toLowerCase()}`).join(", ")}`}
        {i.handedOver > 0 && ` · ${i.handedOver} handed to a person`}
        {i.meetings > 0 && ` · ${i.meetings} asked for a meeting`}
        {i.active > 0 && ` · ${i.active} waiting for an answer`}
      </p>
      {i.suggestion && (
        <p className="mt-1.5 text-[12.5px] text-gold flex items-start gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden /> {i.suggestion}
        </p>
      )}
    </div>
  );
}
