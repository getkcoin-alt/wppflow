"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckList } from "./ui";
import { PLANS, TAX_NOTE } from "@/content/plans";
import { currencyForZone, formatMoney, type Currency } from "@/lib/money";

const KEY = "scriwo_currency";

export function PricingGrid() {
  const [cur, setCur] = useState<Currency>("AED");

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
        <p className="text-sm text-fg-3">Paid plans billed monthly. {TAX_NOTE[cur]} No per-message fees.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLANS.map((p) => {
          const price = p.price[cur];
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
                    <span className="text-sm text-fg-3"> / month</span>
                  </>
                ) : (
                  <span className="text-3xl font-semibold tracking-tight">Custom</span>
                )}
              </p>
              <p className="mt-1 text-sm font-medium text-brand">{p.numbers}</p>
              <div className="mt-6 flex-1 text-sm"><CheckList items={p.includes} /></div>
              <Link
                href={`/contact?interest=${p.id}&plan=${encodeURIComponent(`${p.name} (${cur})`)}`}
                className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-8 w-full`}
              >
                {p.id === "enterprise" ? "Talk to sales" : p.id === "free" ? "Get started free" : `Choose ${p.name}`}
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
