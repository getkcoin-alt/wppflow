"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckList } from "./ui";
import { AED_PAYMENT_NOTE, yearlyOf, type Interval } from "@/content/plans";
import { taxNote, type Catalogue } from "@/lib/catalogue";
import type { CheckoutOptions } from "@/lib/checkout";
import { currencyForZone, formatMoney, type Currency } from "@/lib/money";
import { trackAttrs } from "@/lib/analytics";

const KEY = "scriwo_currency";

export function PricingGrid({ catalogue, checkout = null }: { catalogue: Catalogue; checkout?: CheckoutOptions | null }) {
  const { plans, yearlyMonths } = catalogue;
  // plans that can be bought online, in rupees
  const buyable = new Set(checkout?.enabled ? checkout.plans.map((p) => p.id) : []);
  const [cur, setCur] = useState<Currency>("AED");
  const [interval, setInterval] = useState<Interval>("monthly");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    setCur(saved === "AED" || saved === "INR" ? saved : currencyForZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
  }, []);

  const choose = (c: Currency) => {
    setCur(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {}
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
        <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-full bg-surface p-1 hairline">
          {(["monthly", "yearly"] as const).map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={interval === i}
              onClick={() => setInterval(i)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${interval === i ? "bg-brand-solid text-white" : "text-fg-2 hover:text-fg"}`}
            >
              {i === "monthly" ? "Monthly" : yearlyMonths && yearlyMonths < 12 ? `Yearly · ${Math.round((12 - yearlyMonths) * 10) / 10} months free` : "Yearly"}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Currency" className="inline-flex rounded-full bg-surface p-1 hairline">
          {(["AED", "INR"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cur === c}
              onClick={() => choose(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${cur === c ? "bg-brand-solid text-white" : "text-fg-2 hover:text-fg"}`}
            >
              {c === "AED" ? "UAE · AED" : "India · ₹ INR"}
            </button>
          ))}
        </div>
        </div>
        <p className="text-sm text-fg-3">Paid plans are paid in advance, for a month or for a year. {taxNote(catalogue, cur)} No per-message fees. <Link href="/refund-policy" className="underline">Cancel anytime</Link>.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {plans.map((p) => {
          const monthly = p.price[cur];
          const price = monthly === 0 ? 0 : interval === "yearly" ? yearlyOf(p, cur) : monthly;
          return (
            <section key={p.id} aria-labelledby={`plan-${p.id}`} className={`card flex flex-col p-6 ${p.highlight ? "ring-2 ring-gold/60" : ""}`}>
              {p.highlight && <span className="mb-3 self-start rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">Most popular</span>}
              <h2 id={`plan-${p.id}`} className="text-xl">{p.name}</h2>
              <p className="mt-1 text-sm text-fg-2">{p.for}</p>
              <p className="mt-6">
                {price === 0 ? (
                  <>
                    <span className="text-4xl font-semibold tracking-tight">Free</span>
                  </>
                ) : price ? (
                  <>
                    <span className="text-4xl font-semibold tracking-tight">{formatMoney(price, cur)}</span>
                    <span className="text-sm text-fg-3"> / {interval === "yearly" ? "year" : "month"}{cur === "INR" && p.taxMode === "inclusive" ? ", GST included" : ""}</span>
                  </>
                ) : (
                  <span className="text-3xl font-semibold tracking-tight">Custom</span>
                )}
              </p>
              {price && interval === "yearly" && monthly && monthly * 12 > price ? (
                <p className="mt-1 text-sm text-fg-3">That is {formatMoney(Math.round(price / 12), cur)} a month. You save {formatMoney(monthly * 12 - price, cur)}.</p>
              ) : null}
              <p className="mt-1 text-sm font-medium text-brand">{p.numbers}</p>
              <div className="mt-6 flex-1 text-sm"><CheckList items={p.includes} /></div>
              {/* In rupees a paid plan can be bought here and now; in dirhams, or for Free and Enterprise, the team sets it up. */}
              {cur === "INR" && buyable.has(p.id) ? (
                <Link
                  href={`/checkout?plan=${p.id}&interval=${interval === "yearly" ? "yearly" : "monthly"}`}
                  {...trackAttrs("plan_choose", { plan: p.id, currency: cur, interval, checkout: "yes" })}
                  className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-8 w-full`}
                >
                  Buy {p.name}
                </Link>
              ) : (
                <Link
                  href={`/contact?interest=${p.id}&plan=${encodeURIComponent(`${p.name} (${cur}, ${interval})`)}`}
                  {...trackAttrs("plan_choose", { plan: p.id, currency: cur, interval })}
                  className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-8 w-full`}
                >
                  {p.id === "enterprise" ? "Talk to sales" : p.id === "free" ? "Get started free" : `Choose ${p.name}`}
                </Link>
              )}
            </section>
          );
        })}
      </div>
      {cur === "AED" && (
        <p className="mt-6 text-sm text-fg-3" data-testid="aed-note">
          {AED_PAYMENT_NOTE}
        </p>
      )}
      {cur === "INR" && buyable.size > 0 && (
        <p className="mt-6 text-sm text-fg-3" data-testid="inr-note">
          Buy online in rupees by card, UPI or net banking: your workspace is created as soon as the payment is confirmed, and your GST invoice is in the app.
        </p>
      )}
    </>
  );
}
