import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Minus } from "lucide-react";
import { Pill, Segmented } from "../ui/Page";
import { fetchPublicPlans, type PublicPlan } from "../../services/api";
import { currencyForZone, formatMinor, type Currency } from "../../utils/money";

const GST = 18;
const priceOf = (plan: PublicPlan, interval: "monthly" | "annual", currency: Currency) =>
  plan.prices.find((p) => p.interval === interval && p.currency === currency)?.amountMinor ?? null;

// The plans for sale and what they cost, so an owner can compare before changing. The prices are the server's.
export function PlanCompare({
  currentPlanId,
  renderAction,
}: {
  currentPlanId?: string | null;
  /** What sits under a plan's price: a pay button, or nothing */
  renderAction?: (plan: PublicPlan, interval: "monthly" | "annual", currency: Currency) => React.ReactNode;
}) {
  const plans = useQuery({ queryKey: ["public-plans"], queryFn: fetchPublicPlans, staleTime: 60000 });
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      return currencyForZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      return "INR";
    }
  });
  if (plans.isPending || !plans.data) return plans.error ? <p className="text-[14px] text-danger">{(plans.error as Error).message}</p> : null;
  return (
    <section className="card p-6" aria-label="Plans and prices">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold">Plans and prices</h2>
          <p className="text-[13.5px] text-fg-2 mt-1">Pay for a month or a year in advance. A year costs ten months.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented
            label="Billing"
            value={interval}
            onChange={setInterval}
            items={[
              { key: "monthly", label: "Monthly" },
              { key: "annual", label: "Yearly" },
            ]}
          />
          <Segmented
            label="Currency"
            value={currency}
            onChange={setCurrency}
            items={[
              { key: "INR", label: "₹ INR" },
              { key: "AED", label: "AED" },
            ]}
          />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {plans.data.map((p) => {
          const amount = priceOf(p, interval, currency);
          const current = p.id === currentPlanId;
          return (
            <article key={p.id} aria-label={p.name} className={`rounded-2xl p-4 flex flex-col ${current ? "ring-2 ring-gold/60 bg-surface-2" : "bg-surface-2"}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-semibold">{p.name}</h3>
                {current && <Pill tone="gold">Your plan</Pill>}
              </div>
              <p className="mt-2 min-h-[2.6rem]">
                {p.id === "free" ? (
                  <span className="text-[22px] font-semibold">Free</span>
                ) : amount === null ? (
                  <span className="text-[18px] font-semibold">Custom</span>
                ) : (
                  <>
                    <span className="text-[22px] font-semibold num">{formatMinor(amount, currency)}</span>
                    <span className="text-[13px] text-fg-3"> / {interval === "annual" ? "year" : "month"}</span>
                  </>
                )}
                {amount !== null && p.taxMode === "exclusive" && currency === "INR" && <span className="block text-[12px] text-fg-3">plus {GST}% GST</span>}
                {amount !== null && currency === "AED" && <span className="block text-[12px] text-fg-3">plus VAT where it applies</span>}
              </p>
              <p className="mt-1 text-[13px] text-fg-2">
                {p.numbers === null ? "Number limit agreed with you" : p.numbers === 1 ? "1 WhatsApp number" : `Up to ${p.numbers} WhatsApp numbers`}
                {p.seats === 1 ? ", for one person" : ""}
              </p>
              <ul className="mt-3 space-y-1 text-[13px] flex-1">
                {p.features.map((f) => (
                  <li key={f.key} className={`flex items-center gap-2 ${f.included ? "text-fg" : "text-fg-3"}`}>
                    {f.included ? <Check className="w-3.5 h-3.5 text-ok shrink-0" aria-label="Included" /> : <Minus className="w-3.5 h-3.5 shrink-0" aria-label="Not included" />}
                    {f.label.replace(/^The /, "")}
                  </li>
                ))}
              </ul>
              {renderAction && amount !== null && <div className="mt-4">{renderAction(p, interval, currency)}</div>}
            </article>
          );
        })}
      </div>
      {currency === "AED" && (
        <p className="mt-4 text-[13px] text-fg-3" data-testid="aed-note">
          Online payment for the UAE is coming soon. Until then the Scriwo team invoices you in AED and records the payment.
        </p>
      )}
    </section>
  );
}
