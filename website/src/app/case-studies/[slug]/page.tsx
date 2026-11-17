import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Crumbs, CtaBand } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CASE_STUDIES, caseStudyBySlug } from "@/content/caseStudies";
import { LEGAL } from "@/lib/legal";
import { absolute } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => CASE_STUDIES.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = caseStudyBySlug((await params).slug);
  if (!c) return {};
  return { title: `${c.title} | Case Study`, description: c.summary.slice(0, 158), alternates: { canonical: `/case-studies/${c.slug}` } };
}

export default async function CaseStudyPage({ params }: Props) {
  const c = caseStudyBySlug((await params).slug);
  if (!c) notFound();
  const path = `/case-studies/${c.slug}`;
  const others = CASE_STUDIES.filter((o) => o.slug !== c.slug && o.kind === c.kind).slice(0, 3);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: c.title, description: c.summary, url: absolute(path), author: { "@type": "Organization", name: LEGAL.legalName, url: LEGAL.companySite }, publisher: { "@id": absolute("/#organization") }, isBasedOn: c.source, about: c.industry }} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Case studies", path: "/case-studies" }, { name: c.title, path }]} />
      <article>
        <Container className="max-w-4xl pt-10">
          <p className="eyebrow">{c.kind} · {c.projectType}</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{c.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-2">{c.summary}</p>
          <p className="mt-3 text-sm text-fg-3">{c.location} · {c.industry} · Delivered by {LEGAL.legalName}</p>
          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {c.metrics.map((m) => (
              <div key={m.label} className="card p-5 text-center">
                <dd className="font-display text-3xl font-bold text-gold">{m.value}</dd>
                <dt className="mt-1 text-sm text-fg-2">{m.label}</dt>
              </div>
            ))}
          </dl>
          <div className="prose-scriwo mt-12">
            {[["The client", c.client], ["The challenge", c.challenge], ["What was delivered", c.work], ["The results", c.results]].map(([h, t]) => (
              <section key={h} className="mt-10">
                <h2 className="mb-4 text-2xl">{h}</h2>
                <p>{t}</p>
              </section>
            ))}
          </div>
          <p className="mt-10 text-sm text-fg-3">Source: <a href={c.source} className="underline" rel="noopener">Scriza case study</a>. Results are as published by {LEGAL.legalName}.</p>
        </Container>
      </article>
      {others.length > 0 && (
        <Container className="mt-16 max-w-4xl">
          <h2 className="text-xl">More case studies</h2>
          <ul className="mt-4 space-y-2">
            {others.map((o) => <li key={o.slug}><Link href={`/case-studies/${o.slug}`} className="text-brand hover:underline">{o.title}</Link></li>)}
          </ul>
        </Container>
      )}
      <CtaBand />
    </>
  );
}
