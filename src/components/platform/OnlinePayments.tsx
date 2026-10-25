import { useQuery } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Notice, Pill } from "../ui/Page";
import { btn } from "../ui/styles";
import { fetchAdminPayments, type AdminPaymentOrder } from "../../services/api";
import { formatMinor } from "../../utils/money";
import { formatDate } from "../../utils/subscription";

export const useOnlinePayments = (enabled = true) => useQuery({ queryKey: ["admin-payments"], queryFn: () => fetchAdminPayments(), enabled, refetchInterval: 120000 });

const TONE: Record<AdminPaymentOrder["status"], "ok" | "warn" | "danger" | "neutral"> = { paid: "ok", created: "neutral", attempted: "warn", failed: "danger", expired: "neutral", mismatch: "danger" };

// Every online payment across companies, with the ones that did not match what was asked for at the top: those
// activated nothing and need a person to look at them with Razorpay's dashboard.
export function OnlinePayments({ open, onClose }: { open: boolean; onClose: () => void }) {
  const q = useOnlinePayments(open);
  const d = q.data;
  const orders = d ? [...d.orders].sort((a, b) => Number(b.status === "mismatch") - Number(a.status === "mismatch")) : [];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Online payments"
      subtitle="Payments companies made through Razorpay. A payment that does not match its order activates nothing and shows here."
      footer={
        <button type="button" className={btn("ghost")} onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {q.error && <Notice tone="error">{(q.error as Error).message}</Notice>}
        {d && (
          <p className="text-[14px] text-fg-2">
            {d.payments.configured ? `Online payment is on, in ${d.payments.mode} mode.` : "Online payment is off: the Razorpay keys are not set on the server."}
          </p>
        )}
        {d && (
          <div className="flex flex-wrap gap-2" aria-label="Counts">
            {Object.entries(d.counts).map(([status, n]) => (
              <Pill key={status} tone={TONE[status as AdminPaymentOrder["status"]] ?? "neutral"}>
                {status} {n}
              </Pill>
            ))}
          </div>
        )}
        {orders.length === 0 && d && <p className="text-[14px] text-fg-3">No online payments yet.</p>}
        <ul className="divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14.5px] text-fg">
                  {o.company} · {o.plan}, {o.interval === "annual" ? "yearly" : "monthly"}
                  {o.source === "autopay" ? " (autopay)" : ""}
                </p>
                <p className="text-[13px] text-fg-2">
                  {formatDate(o.createdAt.slice(0, 10))}
                  {o.paymentId ? ` · ${o.paymentId}` : ""}
                </p>
                {o.failureReason && o.status !== "paid" && <p className="text-[13px] text-danger mt-0.5">{o.failureReason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={TONE[o.status]}>{o.status}</Pill>
                <span className="num text-[14.5px]">{formatMinor(o.totalMinor, "INR")}</span>
              </div>
            </li>
          ))}
        </ul>
        {d && d.refunds.length > 0 && (
          <section aria-label="Refunds">
            <h3 className="text-[14px] font-semibold text-fg">Refunds</h3>
            <p className="text-[13px] text-fg-2 mb-1">A refund does not remove a company's access by itself.</p>
            <ul className="divide-y divide-line">
              {d.refunds.map((r) => (
                <li key={r.id} className="py-2 flex justify-between gap-3 text-[14px]">
                  <span>
                    {r.company ?? "Unknown company"} · {r.paymentId ?? r.id} · {r.status}
                  </span>
                  <span className="num">{formatMinor(r.amountMinor, "INR")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Sheet>
  );
}
