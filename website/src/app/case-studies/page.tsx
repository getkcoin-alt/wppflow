import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Container, PageHero, Crumbs, CtaBand } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CASE_STUDIES } from "@/content/caseStudies";
import { LEGAL } from "@/lib/legal";
import { absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "Case Studies — Software and Growth Results by Scriza, the Team Behind Scriwo",
  description: "Real results from Scriza Private Limited, the company behind Scriwo: 10,000+ confirmed hospital appointments in the UAE, 4.87X ROAS for a Dubai real estate firm, HRMS, school ERP, fintech and more.",
  alternates: { canonical: "/case-studies" },
};

export default function CaseStudiesPage() {
  const groups = [
    { kind: "Growth marketing" as const, title: "Lead generation and growth" },
    { kind: "Software" as const, title: "Software and platforms" },
  ];
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Case studies", url: absolute("/case-studies"), about: { "@id": absolute("/#organization") }, hasPart: CASE_STUDIES.map((c) => ({ "@type": "Article", headline: c.title, url: absolute(`/case-studies/${c.slug}`) })) }} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Case studies", path: "/case-studies" }]} />
      <PageHero
        eyebrow="Case studies"
        title={<>Results delivered by the team <span className="gold-text">behind Scriwo.</span></>}
        intro={<>Scriwo is built by {LEGAL.legalName}. These are projects Scriza has delivered for hospitals, real estate firms, schools, fintechs, hotels and manufacturers in the UAE, India and beyond, as published on <a href="https://www.scriza.in/portfolio/case-studies" className="underline" rel="noopener">scriza.in</a>.</>}
      />
      {groups.map((g) => (
        <Container key={g.kind} className="mt-12">
          <h2 data-reveal className="text-2xl">{g.title}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CASE_STUDIES.filter((c) => c.kind === g.kind).map((c) => (
              <Link key={c.slug} href={`/case-studies/${c.slug}`} className="card lift group flex flex-col p-6">
                <p className="flex items-center gap-1.5 text-xs text-fg-3"><MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />{c.location} · {c.industry}</p>
                <h3 className="mt-3 text-lg leading-snug">{c.title}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-2">
                  {c.metrics.slice(0, 2).map((m) => (
                    <div key={m.label} className="rounded-xl bg-surface-2 px-3 py-2">
                      <dt className="sr-only">{m.label}</dt>
                      <dd className="font-display text-xl font-bold text-gold">{m.value}</dd>
                      <dd className="text-xs text-fg-3">{m.label}</dd>
                    </div>
                  ))}
                </dl>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-brand">Read the case study <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </Container>
      ))}
      <CtaBand />
    </>
  );
}
