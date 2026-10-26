import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { Container, PageHero, FaqList, CtaBand, Crumbs, SectionTitle } from "@/components/ui";
import { PricingGrid } from "@/components/PricingGrid";
import { JsonLd } from "@/components/JsonLd";
import { PAYMENTS_LIVE } from "@/content/plans";
import { cheapestPaid, getCatalogue, taxAnswer } from "@/lib/catalogue";
import { formatMoney } from "@/lib/money";
import { faqPage } from "@/lib/jsonld";

// The prices come from the product and are looked at again every five minutes.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const cat = await getCatalogue();
  const plain = (s: string) => s.replace(/\s/g, " ");
  const aed = plain(formatMoney(cheapestPaid(cat, "AED") ?? 299, "AED")),
    inr = plain(formatMoney(cheapestPaid(cat, "INR") ?? 2499, "INR"));
  return {
    title: `Pricing — Free for One WhatsApp Number, Teams from ${aed} / ${inr}`,
    description: `Scriwo is free for one account with one WhatsApp number. Team plans in the UAE and India start at ${aed} or ${inr} a month, with no per-message fees, set up by our onboarding team.`,
    alternates: { canonical: "/pricing" },
  };
}

const faqs = (taxAnswer: string) => [
  { q: "Is there a free plan?", a: "Yes. One account with one WhatsApp number is free. Choose Free and our onboarding team will set it up for you." },
  { q: "How do I buy a plan?", a: "Plans are set up by our onboarding team at the prices on this page. Choose a plan and send the form, or message sales on WhatsApp at +91 91191 12999. We set up your company and send an invoice in AED or INR." },
  { q: "Are there per-message fees?", a: "No. Scriwo works with the WhatsApp numbers your team already uses, so there are no per-conversation charges on top of your plan. API-based platforms usually bill WhatsApp's message fees separately." },
  { q: "Do prices include tax?", a: taxAnswer },
  { q: "What counts as a number?", a: "Each WhatsApp number linked to your company. Every teammate usually links their own." },
  { q: "Is there a discount for paying yearly?", a: "Yes. Pay for a year in advance and you pay for ten months: two months free. Switch the price list above to Yearly to see each plan's yearly price." },
  { q: "Can I pay online?", a: "Online payment is being added for India first. For the UAE, online payment in AED is coming soon; until then our team sends you an AED invoice." },
  { q: "Can I change plans later?", a: "Yes. Tell us and we will change your company's number limit." },
  { q: "Is there a setup fee?", a: "No. Setup and a walkthrough for your team are included in every plan." },
];

export default async function PricingPage() {
  const catalogue = await getCatalogue();
  const FAQS = faqs(taxAnswer(catalogue));
  return (
    <>
      <JsonLd data={faqPage(FAQS)} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]} />
      <PageHero eyebrow="Pricing" title="Plans that grow with your team" intro="Free for one WhatsApp number. Team plans are one price per company, set by how many numbers you link, with no per-message fees." />
      <Container>
        {!PAYMENTS_LIVE && (
          <p className="mb-8 flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm text-fg-2 hairline">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            Every account, free or paid, is set up by our onboarding team at the prices shown. Choose a plan and send the short form, or message us on WhatsApp, and we reply within one business day.
          </p>
        )}
        <PricingGrid catalogue={catalogue} />
      </Container>
      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="Pricing FAQ" />
        <div className="mt-8"><FaqList faqs={FAQS} /></div>
      </Container>
      <CtaBand title="Not sure which plan fits?" body="Tell us how many people answer WhatsApp and what you sell. We will recommend a plan honestly, even if it is the smallest one." />
    </>
  );
}
