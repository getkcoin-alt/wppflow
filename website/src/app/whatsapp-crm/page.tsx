import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, CtaBand, Crumbs, FaqList, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CITIES } from "@/content/cities";
import { faqPage, speakable } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "WhatsApp CRM UAE & India — Dubai, Abu Dhabi, Mumbai, Delhi, Bengaluru",
  description: "What a WhatsApp CRM is and how teams in the UAE and India use one. Scriwo is free for one number, with team plans from AED 299 / ₹2,499 and no per-message fees. Guides for Dubai, Mumbai, Delhi and more.",
  alternates: { canonical: "/whatsapp-crm" },
};

const FAQS = [
  { q: "What is a WhatsApp CRM?", a: "A WhatsApp CRM keeps your business's WhatsApp conversations, contacts and follow-ups in one place for a team. Instead of chats sitting on separate phones, everyone works from a shared inbox where chats are assigned, notes are kept and the owner can see every conversation." },
  { q: "What is the best WhatsApp CRM in the UAE?", a: "It depends on how you use WhatsApp. For automated campaigns from one official number, an API platform fits. For teams in Dubai, Abu Dhabi and Sharjah whose staff talk to customers on their own numbers, Scriwo gives one inbox, per-person logins and owner visibility, priced in AED with no per-message fees." },
  { q: "What is the best WhatsApp CRM in India?", a: "For Indian sales and support teams that work from their own WhatsApp numbers, Scriwo is free for one number and team plans start at ₹2,499 a month for three numbers, with no per-message fees. If you need the official API for OTPs or bulk template campaigns, choose an API platform." },
  { q: "Can multiple users use one WhatsApp Business number?", a: "The WhatsApp Business app allows the main phone plus four linked devices, all seeing the same chats. Scriwo takes a different approach: each staff member links their own number and the owner sees every chat in one inbox, with assignment and private notes." },
  { q: "Is there a free WhatsApp CRM?", a: "Yes. Scriwo is free for one account with one WhatsApp number, set up by our onboarding team." },
];

export default function LocationsPage() {
  return (
    <>
      <JsonLd data={[faqPage(FAQS), speakable("/whatsapp-crm", ["[data-speakable]"])]} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Locations", path: "/whatsapp-crm" }]} />
      <PageHero eyebrow="WhatsApp CRM UAE and India" title="WhatsApp CRM for teams across the UAE and India" intro="Scriwo is a cloud product, so it works anywhere. These guides cover how teams in each city use WhatsApp, and how Scriwo fits." />
      <Container className="mb-12">
        <div className="rounded-3xl bg-note p-6 sm:p-8">
          <h2 className="text-xl">What is a WhatsApp CRM?</h2>
          <p data-speakable className="mt-3 text-fg-2">
            A WhatsApp CRM puts your business&apos;s WhatsApp chats, contacts and follow-ups in one shared inbox for the whole team. Scriwo does this for the numbers your staff already use: each person links their own number, chats are assigned and resolved, notes stay private, and the owner sees every conversation. It is{" "}
            <Link href="/free-whatsapp-crm" className="text-brand hover:underline">free for one number</Link>, with team plans from AED 299 or ₹2,499 a month and no per-message fees.
          </p>
        </div>
      </Container>
      <Container className="grid gap-6 md:grid-cols-2">
        {(["UAE", "India"] as const).map((country) => (
          <section key={country} className="card p-8">
            <h2 className="text-2xl">{country === "UAE" ? "United Arab Emirates" : "India"}</h2>
            <ul className="mt-6 space-y-3">
              {CITIES.filter((c) => c.country === country).map((c) => (
                <li key={c.slug}>
                  <Link href={`/whatsapp-crm/${c.slug}`} className="group flex items-baseline justify-between gap-4">
                    <span className="font-medium group-hover:text-brand">WhatsApp CRM {c.name}</span>
                    <span className="text-right text-xs text-fg-3">{c.hubs.slice(0, 2).join(", ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="WhatsApp CRM in the UAE and India: FAQ" />
        <div className="mt-8"><FaqList faqs={FAQS} /></div>
      </Container>
      <CtaBand />
    </>
  );
}
