import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Gift, ShieldCheck, UserCheck } from "lucide-react";
import { Container, Crumbs, CtaBand, FaqList, PageHero, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { HOMES, HOMES_DATA, HOMES_DATA_NOTE, HOMES_FAQS, HOMES_LOST_LEAD, HOMES_OFFER, HOMES_PROS, HOMES_STEPS, HOMES_WONT } from "@/content/homes";
import { faqPage } from "@/lib/jsonld";
import { trialUrl } from "@/lib/signup";
import { trackAttrs } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Scriwo Homes — WhatsApp CRM for Property Agencies in Dubai and the UAE",
  description:
    "Scriwo's AI CRM for property agencies: qualify buyers and renters on WhatsApp, assign every lead, match listings, book viewings and see which enquiries nobody answered. The same price as Scriwo, with a 14-day free trial and no card.",
  alternates: { canonical: "/homes" },
};

export default function HomesPage() {
  return (
    <>
      <JsonLd data={faqPage(HOMES_FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Scriwo Homes", path: "/homes" }]} />
      <PageHero eyebrow={HOMES.eyebrow} title={HOMES.title} intro={HOMES.intro}>
        <a href={`${HOMES.appUrl}/?signup=1`} {...trackAttrs("demo_click", { place: "homes-hero" })} className="btn-primary">
          Start your 14-day free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <Link href="/contact?interest=demo" className="btn-ghost">Book a demo for your agency</Link>
      </PageHero>

      <Container className="mt-4">
        <div data-reveal className="grid gap-5 md:grid-cols-2">
          <div className="card lift p-7">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold"><Gift className="h-5 w-5" aria-hidden="true" /></div>
            <h2 className="text-xl">{HOMES_OFFER.trial}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{HOMES_OFFER.trialBody}</p>
          </div>
          <div className="card lift p-7">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><Check className="h-5 w-5" aria-hidden="true" /></div>
            <h2 className="text-xl">{HOMES_OFFER.same}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{HOMES_OFFER.sameBody}</p>
            <Link href="/pricing" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">See the plans <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </Container>

      <Container className="mt-20 grid gap-12 lg:grid-cols-[1fr_1fr]">
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
        <SectionTitle eyebrow="What your agency gets" title="From first message to booked viewing" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOMES_PROS.map((f) => (
            <div key={f.title} className="card lift p-6">
              <h3 className="text-lg leading-snug">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{f.body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="What Riwo will not do" title="The AI that knows where its job ends" intro="Other tools let a bot improvise with your clients. Riwo is deliberately limited, because in property one wrong number or promise costs a commission." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {HOMES_WONT.map((r) => (
            <div key={r.title} className="card lift p-6">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold"><UserCheck className="h-5 w-5" aria-hidden="true" /></div>
              <h3 className="text-lg">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{r.body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionTitle eyebrow="Your data" title="Your agency's data stays your agency's" />
          <ul className="mt-8 space-y-3 text-fg-2">
            {HOMES_DATA.map((t) => (
              <li key={t} className="flex gap-3 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="card self-start p-8">
          <p className="eyebrow">Be honest with yourself</p>
          <h2 className="mt-3 text-2xl">After you export, it is yours to protect</h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-2">{HOMES_DATA_NOTE}</p>
        </div>
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
      <CtaBand cta={{ href: `${HOMES.appUrl}/?signup=1`, label: "Start your 14-day free trial" }} title="Stop losing property enquiries" body="Start your 14-day free trial, or tell us about your agency and we will set it up with you." />
    </>
  );
}
