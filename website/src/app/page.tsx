import Link from "next/link";
import { ArrowRight, ShieldCheck, Gauge, Users, Sparkles, KeyRound, RotateCcw } from "lucide-react";
import { Container, SectionTitle, FaqList, CtaBand, LinkCard, CheckList } from "@/components/ui";
import { InboxMock } from "@/components/InboxMock";
import { JsonLd } from "@/components/JsonLd";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { GENERAL_FAQS } from "@/content/faqs";
import { faqPage, softwareApplication, speakable } from "@/lib/jsonld";
import { SITE } from "@/lib/site";

const PILLARS = [
  { icon: Users, title: "Built for companies with staff", body: "A platform admin creates your company, the owner sets a password from a single-use link, and invites the team. Each person links their own number. Owners see everything; staff see their own chats plus any assigned to them. The server enforces it." },
  { icon: Gauge, title: "Feels like WhatsApp itself", body: "Messages appear live with no refresh, gaps are caught up automatically, and a chat loads its history when you open it. When something fails, Scriwo tells you why." },
  { icon: Sparkles, title: "Real teamwork", body: "Assign and resolve chats, leave private notes the customer never sees, and @mention teammates. In-app and desktop alerts, plus an alert when a phone goes offline." },
  { icon: ShieldCheck, title: "Safe by default", body: "Roles, per-company number limits, suspend, an audit log, scoped API keys and signed webhooks. Passwords are never emailed, only single-use links." },
  { icon: KeyRound, title: "Numbers look after themselves", body: "Removing a number unlinks it from the phone and deletes its saved login. Leftover browsers are cleaned up automatically." },
  { icon: RotateCcw, title: "Engineering discipline", body: `${SITE.facts.backendSuites} backend test suites and ${SITE.facts.frontendTests} frontend tests. Deploys check health and roll back on their own, and the database is backed up before any change.` },
];

export default function Home() {
  return (
    <>
      <JsonLd data={[softwareApplication(), faqPage(GENERAL_FAQS), speakable("/", ["[data-speakable]"])]} />

      <section className="hero-glow overflow-hidden">
        <Container className="grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow rise">For teams in the UAE and India</p>
            <h1 className="rise-2 mt-5 text-[2.75rem] leading-[1.04] sm:text-6xl lg:text-[4.25rem]">
              Every WhatsApp chat your team has, <span className="font-serif font-normal italic gold-text">in one calm place.</span>
            </h1>
            <p data-speakable className="rise-3 mt-6 max-w-xl text-lg leading-relaxed text-fg-2">
              Scriwo is the shared WhatsApp inbox and CRM for companies with staff. Each teammate links their own number, owners see every conversation, and the team assigns, notes and resolves chats together.
            </p>
            <div className="rise-3 mt-8 flex flex-wrap gap-3">
              <Link href="/contact?interest=demo" className="btn-primary">
                Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/pricing" className="btn-ghost">See plans</Link>
            </div>
            <ul className="rise-3 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-3">
              <li>Works with the numbers you already use</li>
              <li>No training needed</li>
              <li>AED and INR billing</li>
            </ul>
          </div>
          <InboxMock />
        </Container>
      </section>

      <Container className="mt-8">
        <SectionTitle eyebrow="Why teams switch" title="WhatsApp, finally organised for a whole company" intro="The WhatsApp Business app is built for one person. Scriwo is built for the moment a second, fifth or fiftieth person starts answering customers." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><Icon className="h-5 w-5" aria-hidden="true" /></div>
              <h3 className="text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="How it works" title="Live in an afternoon" />
            <ol className="mt-8 space-y-6">
              {[
                ["Tell us about your team", "Send the contact form. We create your company with the number limit you need."],
                ["The owner sets a password", "A single-use link arrives by email. No password is ever emailed."],
                ["Invite staff", "Each teammate gets their own login and links their own WhatsApp by scanning a QR code."],
                ["Work together", "Assign, note, @mention and resolve. Owners see everything from day one."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface font-serif text-lg text-gold hairline">{i + 1}</span>
                  <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-fg-2">{b}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-8">
            <p className="eyebrow">Growth tools</p>
            <h3 className="mt-3 text-2xl">Reach customers without risking your number</h3>
            <div className="mt-6">
              <CheckList items={[
                "Broadcasts only to contacts who opted in",
                "Delays between messages to protect your number",
                "Keyword automations for repeat questions",
                "Saved replies for the whole team",
                "CSV import and export",
                "API tester, SDK samples, keys and webhooks inside the product",
              ]} />
            </div>
          </div>
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Features" title="Everything a WhatsApp team needs, nothing it does not" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.slice(0, 9).map((f) => (
            <LinkCard key={f.slug} href={`/features/${f.slug}`} title={f.name} body={f.summary} icon={<f.icon className="h-5 w-5" aria-hidden="true" />} />
          ))}
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Industries" title="Made for how your business sells on WhatsApp" />
        <div className="mt-8 flex flex-wrap gap-2.5">
          {INDUSTRIES.map((i) => (
            <Link key={i.slug} href={`/industries/${i.slug}`} className="rounded-full bg-surface px-4 py-2 text-sm hairline hover:bg-surface-2">{i.name}</Link>
          ))}
        </div>
      </Container>

      <Container className="mt-24">
        <div className="grid gap-6 md:grid-cols-2">
          {(["UAE", "India"] as const).map((country) => (
            <div key={country} className="card p-8">
              <p className="eyebrow">{country === "UAE" ? "United Arab Emirates" : "India"}</p>
              <h3 className="mt-3 text-2xl">WhatsApp CRM across {country === "UAE" ? "the Emirates" : "India"}</h3>
              <ul className="mt-6 grid grid-cols-2 gap-2 text-sm">
                {CITIES.filter((c) => c.country === country).map((c) => (
                  <li key={c.slug}><Link href={`/whatsapp-crm/${c.slug}`} className="text-fg-2 hover:text-brand">{c.name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="What people ask before they start" />
        <div className="mt-10"><FaqList faqs={GENERAL_FAQS} /></div>
      </Container>

      <CtaBand />
    </>
  );
}
