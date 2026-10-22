import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, FaqList, CtaBand, Crumbs, SectionTitle, CheckList } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { faqPage } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Free WhatsApp CRM for UAE and India — 1 Number, No Per-Message Fees",
  description: "Scriwo is a free WhatsApp CRM for one account with one number: live shared inbox, contacts, notes and keyword replies. Upgrade to a team plan from AED 299 / ₹2,499 when you add staff.",
  alternates: { canonical: "/free-whatsapp-crm" },
};

const FAQS = [
  { q: "Is Scriwo really free?", a: "Yes. One account with one WhatsApp number is free, with no per-message fees and no card required. Our onboarding team sets it up for you." },
  { q: "What do I get on the free plan?", a: "The same inbox the paid plans use: live messages, chat history, contacts, private notes, keyword automations and CSV import and export, for one linked number." },
  { q: "When do I need a paid plan?", a: "When more than one person or number answers WhatsApp for your business. Team plans start at AED 299 or ₹2,499 a month for three numbers and add assignment across staff and owner oversight." },
  { q: "Is it the WhatsApp Business API?", a: "No. Scriwo links your existing WhatsApp or WhatsApp Business number as a linked device, like WhatsApp Web. That is why there are no per-message fees. Scriwo is independent and not affiliated with WhatsApp or Meta." },
  { q: "Does it work in the UAE and India?", a: "Yes. Scriwo is built for businesses in the UAE and India, with paid plans billed in AED or INR." },
];

export default function FreeCrmPage() {
  return (
    <>
      <JsonLd data={faqPage(FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Free WhatsApp CRM", path: "/free-whatsapp-crm" }]} />
      <PageHero
        eyebrow="Free WhatsApp CRM"
        title="A free WhatsApp CRM for your business number"
        intro="Scriwo is free for one account with one WhatsApp number, for businesses in the UAE and India. No per-message fees, no card, set up for you by our onboarding team."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contact?interest=free&plan=Free" className="btn-primary" {...trackAttrs("plan_choose", { plan: "free", place: "free-crm" })}>Get the free plan</Link>
          <Link href="/pricing" className="btn-ghost">See team plans</Link>
        </div>
      </PageHero>
      <Container className="grid gap-6 md:grid-cols-2">
        <section className="card p-8">
          <h2 className="text-2xl">Included free</h2>
          <div className="mt-6">
            <CheckList items={[
              "One account with one linked WhatsApp number",
              "Live inbox on desktop and phone, with full chat history",
              "Contacts with notes, plus CSV import and export",
              "Keyword automations for timings, location and price lists",
              "Desktop alerts and an alert when the phone goes offline",
              "No per-message fees",
            ]} />
          </div>
        </section>
        <section className="card p-8">
          <h2 className="text-2xl">When your team grows</h2>
          <p className="mt-4 text-fg-2">Add staff and numbers on a team plan, from AED 299 or ₹2,499 a month for three numbers. Each person links their own number, the owner sees every chat, and chats can be assigned and resolved.</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li><Link href="/features/whatsapp-team-inbox" className="text-brand hover:underline">Shared WhatsApp team inbox</Link></li>
            <li><Link href="/blog/whatsapp-business-multiple-users" className="text-brand hover:underline">WhatsApp Business with multiple users</Link></li>
            <li><Link href="/compare/scriwo-vs-whatsapp-business-app" className="text-brand hover:underline">Scriwo vs the WhatsApp Business app</Link></li>
          </ul>
        </section>
      </Container>
      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="Free WhatsApp CRM FAQ" />
        <div className="mt-8"><FaqList faqs={FAQS} /></div>
      </Container>
      <CtaBand title="Start free with one number" body="Tell us your business name and WhatsApp number. Our onboarding team sets you up and sends your login link." />
    </>
  );
}
