import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { Container, PageHero, FaqList, CtaBand, Crumbs, SectionTitle } from "@/components/ui";
import { PricingGrid } from "@/components/PricingGrid";
import { JsonLd } from "@/components/JsonLd";
import { PAYMENTS_LIVE } from "@/content/plans";
import { faqPage } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Pricing — WhatsApp Team Inbox from AED 299 / ₹2,499 a month",
  description: "Scriwo plans for teams in the UAE and India: Starter from AED 299 or ₹2,499 a month for 3 WhatsApp numbers, with no per-message fees. Growth, Business and Enterprise plans for larger teams.",
  alternates: { canonical: "/pricing" },
};

const FAQS = [
  { q: "How do I buy a plan?", a: "Online checkout is coming soon. Until then, choose a plan and send the form, or message sales on WhatsApp at +91 91191 12999. We set up your company and send an invoice in AED or INR." },
  { q: "Are there per-message fees?", a: "No. Scriwo works with the WhatsApp numbers your team already uses, so there are no per-conversation charges on top of your plan. API-based platforms usually bill WhatsApp's message fees separately." },
  { q: "Do prices include tax?", a: "No. UAE prices exclude 5% VAT and Indian prices exclude 18% GST, which are added to the invoice." },
  { q: "What counts as a number?", a: "Each WhatsApp number linked to your company. Every teammate usually links their own." },
  { q: "Can I change plans later?", a: "Yes. Tell us and we will change your company's number limit." },
  { q: "Is there a setup fee?", a: "No. Setup and a walkthrough for your team are included in every plan." },
];


export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqPage(FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]} />
      <PageHero eyebrow="Pricing" title="Plans that grow with your team" intro="One price per company, set by how many WhatsApp numbers your team links. No per-seat surprises and no per-message fees." />
      <Container>
        {!PAYMENTS_LIVE && (
          <p className="mb-8 flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm text-fg-2 hairline">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            Online payment is being set up. Choose a plan and send the short form, or message us on WhatsApp: we reply within one business day with an invoice.
          </p>
        )}
        <PricingGrid />
      </Container>
      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="Pricing FAQ" />
        <div className="mt-8"><FaqList faqs={FAQS} /></div>
      </Container>
      <CtaBand title="Not sure which plan fits?" body="Tell us how many people answer WhatsApp and what you sell. We will recommend a plan honestly, even if it is the smallest one." />
    </>
  );
}
