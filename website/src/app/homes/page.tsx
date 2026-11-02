import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Container, Crumbs, CtaBand, FaqList, PageHero, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { HOMES, HOMES_FAQS, HOMES_FLOW, HOMES_LOST_LEAD, HOMES_RULES, HOMES_STEPS } from "@/content/homes";
import { faqPage } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Scriwo Homes — WhatsApp CRM for Property Agencies in Dubai and the UAE",
  description:
    "Qualify buyers and renters on WhatsApp, assign every lead, match listings, book viewings and see which enquiries nobody answered. Scriwo Homes for property agencies: 14-day free trial, no card needed.",
  alternates: { canonical: "/homes" },
};

export default function HomesPage() {
  return (
    <>
      <JsonLd data={faqPage(HOMES_FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Scriwo Homes", path: "/homes" }]} />
      <PageHero eyebrow={HOMES.eyebrow} title={HOMES.title} intro={HOMES.intro}>
        <a href={`${HOMES.appUrl}/?signup=1`} {...trackAttrs("demo_click", { place: "homes-hero" })} className="btn-primary">
          Start your 14-day trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <Link href="/contact?interest=demo" className="btn-ghost">Book a demo for your agency</Link>
      </PageHero>

      <Container className="mt-4 grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionTitle eyebrow="The problem" title="One conversation can be the commission" />
          <ol className="mt-8 space-y-4">
            {HOMES_LOST_LEAD.map((t, i) => (
              <li key={t} data-reveal className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface font-serif text-lg text-gold hairline">{i + 1}</span>
                <p className="pt-1.5 text-fg-2">{t}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="card p-8">
          <p className="eyebrow">With Scriwo Homes</p>
          <h2 className="mt-3 text-2xl">The same message, handled</h2>
          <ul className="mt-6 space-y-3 text-sm text-fg-2">
            {["Captured and qualified in minutes", "Opened as a lead with an owner", "Matched to listings that fit", "Followed up, or flagged to the manager"].map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="How an enquiry is handled" title="From first message to booked viewing" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HOMES_FLOW.map((f) => (
            <div key={f.title} className="card lift p-6">
              <h3 className="text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{f.body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24 grid gap-5 md:grid-cols-3">
        {HOMES_RULES.map((r) => (
          <div key={r.title} className="card lift p-6">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
            <h2 className="text-lg">{r.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{r.body}</p>
          </div>
        ))}
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Getting started" title="Live this afternoon" />
        <ol className="mt-8 grid gap-6 sm:grid-cols-2">
          {HOMES_STEPS.map(([t, b], i) => (
            <li key={t} data-reveal className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface font-serif text-lg text-gold hairline">{i + 1}</span>
              <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-fg-2">{b}</p></div>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="About Scriwo Homes" />
        <div className="mt-8"><FaqList faqs={HOMES_FAQS} /></div>
      </Container>
      <CtaBand cta={{ href: "/contact?interest=demo", label: "Book a demo for your agency" }} title="Stop losing property enquiries" body="Start the 14-day trial at homes.scriwo.com, or tell us about your agency and we will set it up with you." />
    </>
  );
}
