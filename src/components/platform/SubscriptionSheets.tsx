import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Field, Notice } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import { listPayments, type PlanChoice, type SubscriptionPayment } from "../../services/api";
import { addCycle, defaultPeriodStart, formatDate } from "../../utils/subscription";
import type { Company } from "./types";

type Cycle = "monthly" | "annual";
export interface PaymentForm {
  plan: string;
  cycle: Cycle;
  periodStart: string;
  periodEnd: string;
  amount?: number;
  currency?: "AED" | "INR";
  reference?: string;
  sessionsLimit?: number;
}

const money = (p: SubscriptionPayment) =>
  p.amount === null ? "no amount" : `${p.currency ?? ""} ${p.amount.toLocaleString()}`.trim();

// What the platform admin fills in when a company has paid: the plan, the period it covers, and what was received.
// The renewal date follows the cycle until it is typed by hand.
export function PaymentSheet({
  company,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  company: Company | null;
  plans: PlanChoice[] | undefined;
  busy: boolean;
  onClose: () => void;
  onSubmit: (company: Company, data: PaymentForm) => void;
}) {
  const [plan, setPlan] = useState(""),
    [cycle, setCycle] = useState<Cycle>("monthly"),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [amount, setAmount] = useState(""),
    [currency, setCurrency] = useState<"AED" | "INR">("AED"),
    [reference, setReference] = useState(""),
    [limit, setLimit] = useState("");
  const endTyped = useRef(false);
  const id = company?.id;
  useEffect(() => {
    if (!company) return;
    const sub = company.subscription;
    const nextCycle = sub?.cycle ?? "monthly";
    const nextStart = defaultPeriodStart(sub?.periodEnd ?? null);
    endTyped.current = false;
    setPlan(sub?.scheduledPlan?.id ?? company.planId ?? "");
    setCycle(nextCycle);
    setStart(nextStart);
    setEnd(addCycle(nextStart, nextCycle));
    setAmount("");
    setCurrency("AED");
    setReference("");
    setLimit(String(company.sessionsLimit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const recompute = (nextStart: string, nextCycle: Cycle) => {
    if (!endTyped.current && /^\d{4}-\d{2}-\d{2}$/.test(nextStart)) setEnd(addCycle(nextStart, nextCycle));
  };
  const history = useQuery({
    queryKey: ["payments", id],
    queryFn: () => listPayments(id as string),
    enabled: Boolean(id),
  });
  const paid = plans?.filter((p) => p.id !== "free") ?? [];
  const moving = Boolean(company && plan && plan !== company.planId);
  return (
    <Sheet
      open={!!company}
      onClose={onClose}
      title={`Record a payment for ${company?.name ?? ""}`}
      subtitle="The period this payment covers gives the company its renewal date. Nothing is switched off for a late payment."
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          <button form="payment-form" disabled={busy} className={btn("primary")}>
            Record payment
          </button>
        </>
      }
    >
      <form
        id="payment-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!company) return;
          onSubmit(company, {
            plan,
            cycle,
            periodStart: start,
            periodEnd: end,
            ...(amount.trim() ? { amount: Number(amount), currency } : {}),
            ...(reference.trim() ? { reference: reference.trim() } : {}),
            ...(plan === "enterprise" ? { sessionsLimit: Number(limit) } : {}),
          });
        }}
      >
        <Field label="Plan" hint={moving ? "The company moves to this plan now." : "The plan this payment is for."}>
          <select aria-label="Plan" required value={plan} onChange={(e) => setPlan(e.target.value)} className={selectCls}>
            <option value="" disabled>
              Choose a plan…
            </option>
            {paid.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        {plan === "enterprise" && (
          <Field label="WhatsApp number limit" hint="Enterprise has no standard limit: enter the number agreed.">
            <input aria-label="WhatsApp number limit" type="number" min={1} max={500} required value={limit} onChange={(e) => setLimit(e.target.value)} className={inputCls} />
          </Field>
        )}
        <Field label="Billing">
          <select
            aria-label="Billing"
            value={cycle}
            onChange={(e) => {
              const next = e.target.value as Cycle;
              setCycle(next);
              recompute(start, next);
            }}
            className={selectCls}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Yearly</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Period starts">
            <input
              aria-label="Period starts"
              type="date"
              required
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                recompute(e.target.value, cycle);
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Renews on" hint="The next payment is due on this day.">
            <input
              aria-label="Renews on"
              type="date"
              required
              value={end}
              onChange={(e) => {
                endTyped.current = true;
                setEnd(e.target.value);
              }}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_6.5rem] gap-3">
          <Field label="Amount received" hint="Optional.">
            <input aria-label="Amount received" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Currency">
            <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as "AED" | "INR")} className={selectCls}>
              <option value="AED">AED</option>
              <option value="INR">INR</option>
            </select>
          </Field>
        </div>
        <Field label="Invoice or payment reference" hint="Optional. Helps find the payment later.">
          <input aria-label="Invoice or payment reference" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} />
        </Field>
      </form>
      <div className="mt-6">
        <h3 className="text-[13.5px] font-semibold text-fg">Payments recorded</h3>
        {history.error && <Notice tone="error">{(history.error as Error).message}</Notice>}
        {history.data?.length === 0 && <p className="mt-1.5 text-[13.5px] text-fg-3">None yet.</p>}
        <ul className="mt-2 space-y-1.5 text-[13.5px]">
          {history.data?.slice(0, 5).map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-x-3 text-fg-2">
              <span>
                {p.plan}, {formatDate(p.periodStart)} to {formatDate(p.periodEnd)}
                {p.reference ? ` · ${p.reference}` : ""}
              </span>
              <span className="num text-fg">{money(p)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

// "When the period ends, move to a smaller plan, or to Free." Nothing changes until that day.
export function ScheduleSheet({
  company,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  company: Company | null;
  plans: PlanChoice[] | undefined;
  busy: boolean;
  onClose: () => void;
  onSubmit: (company: Company, plan: string) => void;
}) {
  const [plan, setPlan] = useState("");
  useEffect(() => setPlan(""), [company?.id]);
  const order = plans?.map((p) => p.id) ?? [];
  const here = company?.planId ? order.indexOf(company.planId) : -1;
  const smaller = plans?.filter((p) => p.id !== "enterprise" && order.indexOf(p.id) < here) ?? [];
  const sub = company?.subscription;
  return (
    <Sheet
      open={!!company}
      onClose={onClose}
      title={`Change ${company?.name ?? ""} at the end of the period`}
      subtitle={sub?.periodEnd ? `The current period ends on ${formatDate(sub.periodEnd)}. Until then nothing changes.` : undefined}
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          <button form="schedule-form" disabled={busy || !plan} className={btn("primary")}>
            Schedule the change
          </button>
        </>
      }
    >
      <form
        id="schedule-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (company && plan) onSubmit(company, plan);
        }}
      >
        <Field
          label="Then move to"
          hint={plan === "free" ? "The company's subscription ends. It keeps its conversations, one number and one person." : "A bigger plan takes effect straight away: use Change plan for that."}
        >
          <select aria-label="Then move to" required value={plan} onChange={(e) => setPlan(e.target.value)} className={selectCls}>
            <option value="" disabled>
              Choose…
            </option>
            {smaller.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === "free" ? "Free (cancel the subscription)" : p.name}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-[13.5px] text-fg-3">
          Recording a payment before that day for another plan replaces this. Nothing the company already has is deleted.
        </p>
      </form>
    </Sheet>
  );
}
