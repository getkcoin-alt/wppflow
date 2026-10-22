import type { Metadata } from "next";
import { Container, PageHero, LinkCard, Crumbs, CtaBand } from "@/components/ui";
import { COMPARISONS } from "@/content/compare";

export const metadata: Metadata = {
  title: "Compare Scriwo — Wati, Interakt & AiSensy Alternative, WhatsApp Business App",
  description: "Honest comparisons: Scriwo vs the WhatsApp Business app, vs sharing one office phone, and vs WhatsApp Business API platforms.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }]} />
      <PageHero eyebrow="Compare" title="Is Scriwo the right fit?" intro="Straight answers about when Scriwo is the better choice, and when it is not." />
      <Container className="grid gap-5 md:grid-cols-3">
        {COMPARISONS.map((c) => <LinkCard key={c.slug} href={`/compare/${c.slug}`} title={c.title} body={c.intro} />)}
      </Container>
      <CtaBand />
    </>
  );
}
