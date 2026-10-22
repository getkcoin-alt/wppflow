import type { Metadata } from "next";
import { Container, PageHero, LinkCard, CtaBand, Crumbs } from "@/components/ui";
import { INDUSTRIES } from "@/content/industries";

export const metadata: Metadata = {
  title: "WhatsApp CRM by Industry — Real Estate, Clinics, Education, Retail",
  description: "How real estate brokerages, clinics, coaching institutes, travel agencies, showrooms and retailers in the UAE and India run WhatsApp as a team with Scriwo.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }]} />
      <PageHero eyebrow="Industries" title="WhatsApp, the way your industry sells" intro="Every industry uses WhatsApp differently. Here is how teams like yours set up Scriwo." />
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((i) => <LinkCard key={i.slug} href={`/industries/${i.slug}`} title={i.name} body={i.intro} />)}
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
