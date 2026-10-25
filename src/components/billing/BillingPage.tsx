import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { PlanCard, type PlanInfo } from "../admin/PlanCard";
import { PlanCompare } from "../admin/PlanCompare";
import { Notice, Pill } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn } from "../ui/styles";
import { BillingProfileForm } from "./BillingProfileForm";
import { PaySheet, type PayTarget } from "./PaySheet";
import {
  downloadInvoice,
  fetchBilling,
  getStoredTenantId,
  keepBillingPlan,
  scheduleBillingChange,
  startAutopaySetup,
  stopAutopay,
  verifyAutopaySetup,
  type AiStatus,
  type PlanUsage,
  type BillingAutopay,
  type BillingOrder,
  type BillingOverview,
} from "../../services/api";
import { openCheckout, CheckoutClosed } from "../../services/razorpayCheckout";
import { formatMinor } from "../../utils/money";
import { formatDate, type Subscription } from "../../utils/subscription";

const interval = (i: string) => (i === "annual" ? "yearly" : "monthly");
const ORDER_PILL: Record<BillingOrder["status"], { tone: "ok" | "warn" | "danger" | "neutral"; label: string }> = {
  paid: { tone: "ok", label: "Paid" },
  created: { tone: "neutral", label: "Not paid" },
  attempted: { tone: "warn", label: "Confirming" },
  failed: { tone: "danger", label: "Failed" },
  expired: { tone: "neutral", label: "Expired" },
  mismatch: { tone: "danger", label: "Needs a look" },
};
// Razorpay's recurring limit without asking the customer each time is about this; the bank decides, not us.
const AUTOPAY_NOTE_ABOVE = 1500000;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6" aria-label={title}>
      <h2 className="text-[18px] font-semibold">{title}</h2>
      {hint && <p className="text-[13.5px] text-fg-2 mt-1">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AutopayPanel({ overview, planId, planName, onChanged }: { overview: BillingOverview; planId: string | null; planName: string; onChanged: (message?: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const a: BillingAutopay | null = overview.autopay;
  const on = a && ["active", "authenticated", "pending", "created"].includes(a.status);
  const monthlyPlan = planId && planId !== "free" && planId !== "enterprise";
  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setError("");
    try {
      await onChanged((await fn()) || undefined);
    } catch (e: any) {
      if (!(e instanceof CheckoutClosed)) setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Autopay" hint="Optional. Charge the card, UPI or bank mandate you approve each month, instead of paying by hand. You can turn it off at any time and keep the period you paid for.">
      {a?.status === "halted" && <Notice tone="error">Autopay stopped because the last payment failed. Pay from the plans above to keep your plan, then set autopay up again.</Notice>}
      {a?.status === "pending" && <Notice tone="error">The last automatic payment did not go through. Razorpay will try again.</Notice>}
      {on ? (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <p className="text-[14.5px] text-fg">
            Autopay is on for <strong>{a!.plan}</strong>, {formatMinor(a!.amountMinor, "INR")} a month including GST.
            {a!.status === "created" && " It is not finished yet: complete the approval in Razorpay's window."}
          </p>
          <button
            className={btn("secondary", "sm")}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await stopAutopay();
                return "Autopay is off. Your paid period keeps running until it ends.";
              })
            }
          >
            Turn off autopay
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <p className="text-[14px] text-fg-2">
            {monthlyPlan ? `Pay for ${planName} every month by itself. Yearly plans are paid once a year, so autopay is for monthly billing only.` : "Choose a paid plan first, then you can set up autopay for it."}
          </p>
          <button
            className={btn("secondary", "sm")}
            disabled={busy || !monthlyPlan || !overview.payments.configured || !overview.profile}
            onClick={() =>
              void run(async () => {
                const started = await startAutopaySetup(planId!);
                const result = await openCheckout(started.checkout);
                await verifyAutopaySetup({
                  razorpay_payment_id: result.razorpay_payment_id,
                  razorpay_subscription_id: result.razorpay_subscription_id!,
                  razorpay_signature: result.razorpay_signature,
                });
                return "Autopay is set up. Your payments will be taken automatically, and each one gets an invoice.";
              })
            }
          >
            Set up autopay
          </button>
        </div>
      )}
      {!on && monthlyPlan && !overview.profile && <p className="mt-2 text-[13px] text-fg-3">Add your billing details below first.</p>}
      {overview.subscription?.planId === "business" && <p className="mt-2 text-[13px] text-fg-3">A charge above {formatMinor(AUTOPAY_NOTE_ABOVE, "INR")} may need your approval each month: your bank decides that, not Scriwo.</p>}
      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </Section>
  );
}

// Plans & Billing: what the company is on, what it can buy, who the invoice is for, and every payment and invoice.
export function BillingPage({
  plan,
  numbersLimit,
  numbersUsed,
  ai,
  usage,
  subscription,
}: {
  plan?: PlanInfo;
  numbersLimit?: number | null;
  numbersUsed?: number;
  ai?: AiStatus;
  usage?: PlanUsage;
  subscription?: Subscription;
}) {
  const qc = useQueryClient();
  const tenant = getStoredTenantId();
  const overview = useQuery({ queryKey: ["billing", tenant], queryFn: fetchBilling });
  const [pay, setPay] = useState<PayTarget | null>(null),
    [editing, setEditing] = useState(false),
    [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null),
    [busy, setBusy] = useState(false);
  const o = overview.data;
  const refresh = async (message?: string) => {
    await Promise.all([qc.invalidateQueries({ queryKey: ["billing", tenant] }), qc.invalidateQueries({ queryKey: ["capabilities", tenant] })]);
    if (message) setNotice({ tone: "success", text: message });
  };
  const planId = subscription?.planId ?? plan?.id ?? null;

  const change = (fn: () => Promise<string>) => async () => {
    setBusy(true);
    setNotice(null);
    try {
      await refresh(await fn());
    } catch (e: any) {
      setNotice({ tone: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };
  const TIERS = ["starter", "growth", "business"];
  const smaller = planId && TIERS.includes(planId) ? TIERS.filter((p) => TIERS.indexOf(p) < TIERS.indexOf(planId)) : [];

  return (
    <div className="space-y-4">
      {notice && (
        <div role={notice.tone === "error" ? "alert" : "status"}>
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      )}
      <PlanCard plan={plan} numbersLimit={numbersLimit} numbersUsed={numbersUsed} ai={ai} subscription={subscription} usage={usage} />
      {overview.error && <Notice tone="error">{(overview.error as Error).message}</Notice>}
      {o && !o.payments.configured && (
        <div className="rounded-2xl bg-surface-2 px-4 py-3 text-[14px] text-fg-2" role="note">
          Online payment is not switched on yet. Message the Scriwo team: they send you an invoice and record your payment, and you can see it here.
        </div>
      )}
      {o?.payments.mode === "test" && o.payments.configured && (
        <div className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-[14px]" role="note">
          Payments are in test mode: no real money moves.
        </div>
      )}
      <PlanCompare
        currentPlanId={planId}
        renderAction={(p, i, currency) =>
          currency === "INR" ? (
            <button className={`${btn(p.id === planId ? "secondary" : "primary", "sm")} w-full`} disabled={!o?.payments.configured} onClick={() => setPay({ planId: p.id, planName: p.name, interval: i })} aria-label={`Pay for ${p.name}, ${interval(i)}`}>
              {p.id === planId ? "Renew" : "Choose"} {p.name}
            </button>
          ) : null
        }
      />

      {o && <AutopayPanel overview={o} planId={planId} planName={plan?.name ?? ""} onChanged={refresh} />}

      {o && subscription && subscription.status !== "free" && subscription.status !== "legacy" && (
        <Section title="Change or end your plan" hint="Nothing to pay. It starts on the day your current period ends, and nothing you have is deleted.">
          {subscription.scheduledPlan ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14.5px] text-fg">
                {subscription.scheduledPlan.id === "free" ? `Your plan ends on ${formatDate(subscription.periodEnd)}.` : `Your plan moves to ${subscription.scheduledPlan.name} on ${formatDate(subscription.periodEnd)}.`}
              </p>
              <button className={btn("secondary", "sm")} disabled={busy} onClick={change(async () => (await keepBillingPlan(), "Your plan stays as it is."))}>
                Keep my plan
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {smaller.map((p) => (
                <button key={p} className={btn("secondary", "sm")} disabled={busy} onClick={change(async () => (await scheduleBillingChange(p), `Your plan moves to ${p[0].toUpperCase()}${p.slice(1)} when this period ends.`))}>
                  Move to {p[0].toUpperCase() + p.slice(1)} at the end of the period
                </button>
              ))}
              <button
                className={`${btn("ghost", "sm")} !text-danger`}
                disabled={busy}
                onClick={() => {
                  if (confirm("End your subscription when this period finishes? Your company moves to the Free plan: one WhatsApp number and one person. Conversations are kept.")) void change(async () => (await scheduleBillingChange("free"), "Your subscription will end when this period finishes."))();
                }}
              >
                End my subscription
              </button>
            </div>
          )}
        </Section>
      )}

      <Section title="Billing details" hint="Who the invoice is made out to. The state decides whether the 18% GST is shown as CGST and SGST or as IGST.">
        {o ? <BillingProfileForm key={o.profile ? "saved" : "empty"} profile={o.profile} states={o.states} /> : <p className="text-[14px] text-fg-3">Loading…</p>}
      </Section>

      <Section title="Invoices" hint="A GST invoice for every payment, whether you paid here or the Scriwo team recorded it.">
        {o?.invoices.length === 0 && <p className="text-[14px] text-fg-3">No invoices yet.</p>}
        <ul className="divide-y divide-line">
          {o?.invoices.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium text-fg">{i.number}</p>
                <p className="text-[13px] text-fg-2">
                  {i.plan}, {interval(i.interval)} · {formatDate(i.periodStart)} to {formatDate(i.periodEnd)} · issued {formatDate(i.issueDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="num text-[14.5px]">{formatMinor(i.totalMinor, "INR")}</span>
                <button
                  className={btn("secondary", "sm")}
                  aria-label={`Download invoice ${i.number}`}
                  onClick={() => void downloadInvoice(i.id, i.number).catch((e) => setNotice({ tone: "error", text: e.message }))}
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Payments" hint="Every attempt to pay online, and how it ended.">
        {o?.orders.length === 0 && <p className="text-[14px] text-fg-3">No online payments yet.</p>}
        <ul className="divide-y divide-line">
          {o?.orders.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[14.5px] text-fg">
                  {p.plan}, {interval(p.interval)}
                  {p.source === "autopay" ? " (autopay)" : ""}
                </p>
                <p className="text-[13px] text-fg-2">
                  {formatDate(p.createdAt.slice(0, 10))}
                  {p.failureReason && p.status !== "paid" ? ` · ${p.failureReason}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={ORDER_PILL[p.status].tone}>{ORDER_PILL[p.status].label}</Pill>
                <span className="num text-[14.5px]">{formatMinor(p.totalMinor, "INR")}</span>
                {(p.status === "failed" || p.status === "expired") && o?.payments.configured && (
                  <button className={btn("ghost", "sm")} onClick={() => setPay({ planId: p.planId, planName: p.plan, interval: p.interval })}>
                    <RefreshCw className="w-4 h-4" /> Try again
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <PaySheet
        target={pay}
        profile={o?.profile ?? null}
        paymentsOn={Boolean(o?.payments.configured)}
        onClose={() => setPay(null)}
        onNeedProfile={() => {
          setPay(null);
          setEditing(true);
        }}
        onPaid={(order, status) => {
          setPay(null);
          setNotice({
            tone: "success",
            text:
              status === "paid"
                ? `Payment received, thank you. Your ${order.plan} plan runs until ${formatDate(order.periodEnd)}. The invoice is below.`
                : "Payment received, activating. This can take a minute: your plan and invoice appear here as soon as the payment is confirmed.",
          });
          void refresh();
        }}
      />
      <Sheet open={editing} onClose={() => setEditing(false)} title="Billing details" subtitle="Needed for the GST invoice.">
        {o && <BillingProfileForm key={o.profile ? "saved" : "empty"} profile={o.profile} states={o.states} onSaved={() => setEditing(false)} />}
      </Sheet>
    </div>
  );
}
