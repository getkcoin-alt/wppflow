"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckList } from "./ui";
import { AED_PAYMENT_NOTE, PLANS, TAX_NOTE, YEARLY_MONTHS, yearlyPrice, type Interval } from "@/content/plans";
import { currencyForZone, formatMoney, type Currency } from "@/lib/money";
import { trackAttrs } from "@/lib/analytics";

const KEY = "scriwo_currency";

export function PricingGrid() {
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
              {i === "monthly" ? "Monthly" : `Yearly · ${12 - YEARLY_MONTHS} months free`}
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
        <p className="text-sm text-fg-3">Paid plans are paid in advance, for a month or for a year. {TAX_NOTE[cur]} No per-message fees. <Link href="/refund-policy" className="underline">Cancel anytime</Link>.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLANS.map((p) => {
          const monthly = p.price[cur];
          const price = monthly && interval === "yearly" ? yearlyPrice(monthly) : monthly;
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
                    <span className="text-sm text-fg-3"> / {interval === "yearly" ? "year" : "month"}</span>
                  </>
                ) : (
                  <span className="text-3xl font-semibold tracking-tight">Custom</span>
                )}
              </p>
              {price && interval === "yearly" && monthly ? (
                <p className="mt-1 text-sm text-fg-3">That is {formatMoney(Math.round(price / 12), cur)} a month. You save {formatMoney(monthly * 12 - price, cur)}.</p>
              ) : null}
              <p className="mt-1 text-sm font-medium text-brand">{p.numbers}</p>
              <div className="mt-6 flex-1 text-sm"><CheckList items={p.includes} /></div>
              <Link
                href={`/contact?interest=${p.id}&plan=${encodeURIComponent(`${p.name} (${cur}, ${interval})`)}`}
                {...trackAttrs("plan_choose", { plan: p.id, currency: cur, interval })}
                className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-8 w-full`}
              >
                {p.id === "enterprise" ? "Talk to sales" : p.id === "free" ? "Get started free" : `Choose ${p.name}`}
              </Link>
            </section>
          );
        })}
      </div>
      {cur === "AED" && (
        <p className="mt-6 text-sm text-fg-3" data-testid="aed-note">
          {AED_PAYMENT_NOTE}
        </p>
      )}
    </>
  );
}
