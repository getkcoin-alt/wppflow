import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Handshake, ShieldCheck, Sparkle } from "lucide-react";
import { Container, Crumbs, CtaBand, FaqList, LinkCard, PageHero, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { PARTNERS, PARTNER_FAQS, PARTNER_OFFER, PARTNER_STEPS, PARTNER_TOPICS } from "@/content/partners";
import { faqPage } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "White-label WhatsApp CRM — Partner With Scriwo",
  description:
    "Offer a shared WhatsApp inbox, an AI sales assistant and a sales pipeline to your own clients. Scriwo works with agencies, resellers and software companies on white-label partnerships in the UAE and India.",
  alternates: { canonical: "/white-label" },
};

export default function WhiteLabelPage() {
  return (
    <>
      <JsonLd data={faqPage(PARTNER_FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "White-label", path: "/white-label" }]} />
      <PageHero eyebrow={PARTNERS.eyebrow} title={PARTNERS.title} intro={PARTNERS.intro}>
        <Link href="/contact?interest=partner" {...trackAttrs("demo_click", { place: "white-label-hero" })} className="btn-primary">
          Talk to us about partnering <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/pricing" className="btn-ghost">See the plans</Link>
      </PageHero>

      <Container className="mt-4">
        <SectionTitle eyebrow="What you can offer" title="A complete WhatsApp sales product, ready to put in front of clients" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PARTNER_OFFER.map((o) => (
            <LinkCard key={o.title} href={o.href} title={o.title} body={o.body} icon={<Sparkle className="h-5 w-5" aria-hidden="true" />} />
          ))}
        </div>
      </Container>

      <Container className="mt-24 grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="How it works" title="From first call to first clients" />
          <ol className="mt-8 space-y-6">
            {PARTNER_STEPS.map(([t, b], i) => (
              <li key={t} data-reveal className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface font-serif text-lg text-gold hairline">{i + 1}</span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-fg-2">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="card p-8">
          <p className="eyebrow">Agreed with our team</p>
          <h2 className="mt-3 text-2xl">What partners usually ask for</h2>
          <ul className="mt-6 space-y-3 text-sm text-fg-2">
            {PARTNER_TOPICS.map((t) => (
              <li key={t} className="flex gap-3"><Handshake className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />{t}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-fg-3">
            Partnerships are set up with our team, not through a self-service screen. Some of these are built to order, so we tell you plainly what is available today and what we would build before you commit.
          </p>
        </div>
      </Container>

      <Container className="mt-24 grid gap-5 md:grid-cols-3">
        {[
          { icon: Building2, title: "Each client is its own company", body: "Conversations, contacts, numbers and teams are kept separate for every client." },
          { icon: ShieldCheck, title: "Safe by default", body: "Roles enforced by the server, an audit log, scoped API keys, signed webhooks, and passwords that are never emailed." },
          { icon: Sparkle, title: "AI that stays honest", body: "Automated replies say so, a customer can ask for a person, and pricing always goes to a human." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card lift p-6">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold"><Icon className="h-5 w-5" aria-hidden="true" /></div>
            <h2 className="text-lg">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{body}</p>
          </div>
        ))}
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="About white-label partnerships" />
        <div className="mt-8"><FaqList faqs={PARTNER_FAQS} /></div>
      </Container>
      <CtaBand cta={{ href: "/contact?interest=partner", label: "Become a partner" }} title="Partner with Scriwo" body="Tell us about your clients and what you want to offer them. We will reply with what is possible today and how a pilot would work." />
    </>
  );
}
