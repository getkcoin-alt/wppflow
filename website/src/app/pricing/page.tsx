import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { Container, PageHero, CheckList, FaqList, CtaBand, Crumbs, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { PLANS, PAYMENTS_LIVE } from "@/content/plans";
import { faqPage } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Pricing — WhatsApp Team Inbox Plans in AED and INR",
  description: "Scriwo plans for teams of every size in the UAE and India, billed in AED or INR. Choose a plan and our team will set up your company the same day.",
  alternates: { canonical: "/pricing" },
};

const FAQS = [
  { q: "How do I buy a plan?", a: "Online checkout is coming soon. Until then, choose a plan and send the form. We will confirm the price for your team size and send an invoice in AED or INR." },
  { q: "What counts as a number?", a: "Each WhatsApp number linked to your company. Every teammate usually links their own." },
  { q: "Can I change plans later?", a: "Yes. Tell us and we will change your company's number limit." },
  { q: "Is there a setup fee?", a: "Tell us about your team and we will include any onboarding in your quote up front, with no surprises." },
];

const money = (n: number, cur: "AED" | "INR") => new Intl.NumberFormat(cur === "AED" ? "en-AE" : "en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqPage(FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]} />
      <PageHero eyebrow="Pricing" title="Plans that grow with your team" intro="Pick the plan that matches how many WhatsApp numbers your team uses. Billed in AED or INR." />
      <Container>
        {!PAYMENTS_LIVE && (
          <p className="mb-8 flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm text-fg-2 hairline">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            Online payment is being set up. Choose a plan and send the short form: we reply within one business day with your price and an invoice.
          </p>
        )}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <section key={p.id} aria-labelledby={`plan-${p.id}`} className={`card flex flex-col p-6 ${p.highlight ? "ring-2 ring-gold/60" : ""}`}>
              {p.highlight && <span className="mb-3 self-start rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">Most popular</span>}
              <h2 id={`plan-${p.id}`} className="text-xl">{p.name}</h2>
              <p className="mt-1 text-sm text-fg-2">{p.for}</p>
              <p className="mt-6 text-2xl font-semibold">
                {p.price.AED && p.price.INR ? (
                  <>{money(p.price.AED, "AED")}<span className="text-sm font-normal text-fg-3"> / month · {money(p.price.INR, "INR")}</span></>
                ) : (
                  "Price on request"
                )}
              </p>
              <p className="mt-1 text-sm font-medium text-brand">{p.numbers}</p>
              <div className="mt-6 flex-1 text-sm"><CheckList items={p.includes} /></div>
              <Link href={`/contact?interest=${p.id}&plan=${encodeURIComponent(p.name)}`} className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-8 w-full`}>
                {p.id === "enterprise" ? "Talk to sales" : `Choose ${p.name}`}
              </Link>
            </section>
          ))}
        </div>
      </Container>
      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="Pricing FAQ" />
        <div className="mt-8"><FaqList faqs={FAQS} /></div>
      </Container>
      <CtaBand title="Not sure which plan fits?" body="Tell us how many people answer WhatsApp and what you sell. We will recommend a plan honestly, even if it is the smallest one." />
    </>
  );
}
