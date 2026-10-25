import type { Lead } from "../../services/api";
import { Pill } from "../ui/Page";
import { dueLabel, formatMoney, inStage, stageTone } from "../../utils/pipeline";

// The same leads as a table, for sorting through many at once. On a phone each row is a card.
export function LeadList({
  leads,
  total,
  currency,
  onOpen,
  onMore,
}: {
  leads: Lead[];
  total: number;
  currency: string;
  onOpen: (lead: Lead) => void;
  onMore: () => void;
}) {
  if (!leads.length) return <p className="card p-8 text-center text-[14px] text-fg-2">No leads match.</p>;
  return (
    <div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-[14px]">
          <thead className="hidden md:table-header-group text-[12.5px] text-fg-3 border-b border-line">
            <tr>
              {["Lead", "Step", "Value", "Owner", "Next follow-up"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((l) => {
              const due = l.nextTask ? dueLabel(l.nextTask.dueAt) : null;
              return (
                <tr key={l.id} className="block md:table-row px-4 py-3 md:p-0 hover:bg-surface-2/60 cursor-pointer" onClick={() => onOpen(l)}>
                  <td className="block md:table-cell md:px-4 md:py-3">
                    <button type="button" className="text-left font-medium hover:underline" onClick={(e) => { e.stopPropagation(); onOpen(l); }} dir="auto">
                      {l.contactName}
                    </button>
                    {l.title && l.title !== l.contactName && <div className="text-[12.5px] text-fg-3 truncate max-w-[260px]">{l.title}</div>}
                  </td>
                  <td className="inline-block md:table-cell md:px-4 md:py-3 mr-3 md:mr-0">
                    <Pill tone={stageTone(l.stageKind)}>{l.stageName}</Pill>
                    {l.status === "open" && <span className="ml-2 text-[12px] text-fg-3">{inStage(l)}</span>}
                  </td>
                  <td className="inline-block md:table-cell md:px-4 md:py-3 num">{l.value ? formatMoney(l.value, currency) : "—"}</td>
                  <td className="block md:table-cell md:px-4 md:py-3 text-fg-2">{l.ownerName || <span className="text-fg-3">Unowned</span>}</td>
                  <td className={`block md:table-cell md:px-4 md:py-3 text-[13px] ${due?.late ? "text-danger" : "text-fg-2"}`}>{due ? `${l.nextTask!.title} · ${due.text}` : <span className="text-fg-3">None</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-fg-3 text-center">
        Showing {leads.length} of {total}
        {total > leads.length && (
          <>
            {" · "}
            <button type="button" className="text-gold hover:underline" onClick={onMore}>
              Show more
            </button>
          </>
        )}
      </p>
    </div>
  );
}
