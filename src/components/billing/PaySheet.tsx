import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Notice } from "../ui/Page";
import { btn } from "../ui/styles";
import { fetchBillingQuote, getStoredTenantId, startCheckout, verifyCheckoutPayment, type BillingOrder, type BillingProfile } from "../../services/api";
import { openCheckout, CheckoutClosed } from "../../services/razorpayCheckout";
import { formatMinor } from "../../utils/money";
import { formatDate } from "../../utils/subscription";

export interface PayTarget {
  planId: string;
  planName: string;
  interval: "monthly" | "annual";
}

const Row = ({ label, value, strong = false, muted = false }: { label: string; value: string; strong?: boolean; muted?: boolean }) => (
  <div className={`flex justify-between gap-4 py-1.5 ${strong ? "border-t border-line pt-3 mt-1 text-[16px] font-semibold text-fg" : `text-[14px] ${muted ? "text-fg-3" : "text-fg-2"}`}`}>
    <span>{label}</span>
    <span className="num text-fg">{value}</span>
  </div>
);

// What a payment will cost, line by line, before anything is charged, then Razorpay's window.
export function PaySheet({
  target,
  profile,
  paymentsOn,
  onClose,
  onPaid,
  onNeedProfile,
}: {
  target: PayTarget | null;
  profile: BillingProfile | null;
  paymentsOn: boolean;
  onClose: () => void;
  onPaid: (order: BillingOrder, status: "paid" | "processing") => void;
  onNeedProfile: () => void;
}) {
  const qc = useQueryClient();
  const [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setConfirmed(false);
    setError("");
  }, [target?.planId, target?.interval]);
  const quote = useQuery({
    queryKey: ["billing-quote", getStoredTenantId(), target?.planId, target?.interval, profile?.stateCode],
    queryFn: () => fetchBillingQuote(target!.planId, target!.interval),
    enabled: Boolean(target),
    retry: false,
  });
  const q = quote.data?.quote;
  const needsConfirm = Boolean(q?.requiresConfirm);
  const canPay = Boolean(q) && paymentsOn && Boolean(profile) && !busy && (!needsConfirm || confirmed) && !quote.data?.autopayActive;

  const pay = async () => {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      const started = await startCheckout({ plan: target.planId, interval: target.interval, confirm: confirmed });
      const result = await openCheckout(started.checkout);
      const verified = await verifyCheckoutPayment({
        razorpay_order_id: result.razorpay_order_id!,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      await qc.invalidateQueries({ queryKey: ["billing", getStoredTenantId()] });
      await qc.invalidateQueries({ queryKey: ["capabilities", getStoredTenantId()] });
      onPaid(verified.order, verified.status === "paid" ? "paid" : "processing");
    } catch (e: any) {
      // closing the window is not an error worth shouting about
      setError(e instanceof CheckoutClosed ? "" : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={Boolean(target)}
      onClose={onClose}
      title={target ? `Pay for ${target.planName}, ${target.interval === "annual" ? "yearly" : "monthly"}` : "Pay"}
      subtitle="You pay in rupees through Razorpay. Card and bank details go to Razorpay, never to Scriwo."
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btn("primary")} disabled={!canPay} onClick={() => void pay()}>
            {q ? `Pay ${formatMinor(q.totalMinor, "INR")}` : "Pay"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!paymentsOn && <Notice tone="error">Online payment is not switched on yet. Message the Scriwo team and they will send you an invoice.</Notice>}
        {!profile && paymentsOn && (
          <div className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-[14px]">
            Add your billing details first: the invoice needs your company's name, address and state.{" "}
            <button type="button" className="underline font-medium" onClick={onNeedProfile}>
              Add billing details
            </button>
          </div>
        )}
        {quote.isPending && target && <p className="text-[14px] text-fg-3">Working out the price…</p>}
        {quote.error && <Notice tone="error">{(quote.error as Error).message}</Notice>}
        {q && (
          <section aria-label="Price" className="rounded-2xl bg-surface-2 px-4 py-3">
            <Row label={`${q.plan.name} plan, ${q.interval === "annual" ? "one year" : "one month"}`} value={formatMinor(q.baseMinor, "INR")} />
            {q.creditMinor > 0 && <Row label={`Credit for the unused days of ${q.previousPlan ?? "your current plan"}`} value={`− ${formatMinor(q.creditMinor, "INR")}`} />}
            <Row label="Before tax" value={formatMinor(q.taxableMinor, "INR")} muted />
            {q.intraState ? (
              <>
                <Row label={`CGST ${q.gstRate / 2}%`} value={formatMinor(q.cgstMinor, "INR")} muted />
                <Row label={`SGST ${q.gstRate / 2}%`} value={formatMinor(q.sgstMinor, "INR")} muted />
              </>
            ) : (
              <Row label={`IGST ${q.gstRate}%`} value={formatMinor(q.igstMinor, "INR")} muted />
            )}
            <Row label="Total" value={formatMinor(q.totalMinor, "INR")} strong />
          </section>
        )}
        {q && (
          <p className="text-[14px] text-fg-2">
            {q.kind === "change" ? "Starts today and replaces your current period. " : q.kind === "renewal" ? "Follows on from your current period. " : "Starts today. "}
            Covers <strong className="text-fg">{formatDate(q.periodStart)}</strong> to <strong className="text-fg">{formatDate(q.periodEnd)}</strong>.
          </p>
        )}
        {profile && (
          <p className="text-[13.5px] text-fg-3">
            Invoice to {profile.legalName}, {profile.state || profile.city}
            {profile.gstin ? `, GSTIN ${profile.gstin}` : ""}.{" "}
            <button type="button" className="underline hover:text-fg" onClick={onNeedProfile}>
              Change
            </button>
          </p>
        )}
        {needsConfirm && q && (
          <label className="flex items-start gap-3 rounded-2xl ring-1 ring-warn/40 bg-warn/5 p-4 cursor-pointer">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[rgb(var(--c-brand-solid))]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span className="text-[14px] text-fg">
              Your plan is already paid until {formatDate(q.paidUntil)}. I want to pay for another {q.interval === "annual" ? "year" : "month"} after it.
            </span>
          </label>
        )}
        {quote.data?.autopayActive && <Notice tone="error">Autopay is on and renews this plan by itself. To pay now instead, turn autopay off first.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Sheet>
  );
}
