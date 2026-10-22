import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, PageHero, SectionTitle, FaqList, CtaBand, Crumbs, LinkCard } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { FEATURES, featureBySlug } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { faqPage, howTo, speakable } from "@/lib/jsonld";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => FEATURES.map((f) => ({ slug: f.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = featureBySlug((await params).slug);
  if (!f) return {};
  return { title: f.title, description: f.summary, alternates: { canonical: `/features/${f.slug}` } };
}

export default async function FeaturePage({ params }: Props) {
  const f = featureBySlug((await params).slug);
  if (!f) notFound();
  const path = `/features/${f.slug}`;
  const industries = INDUSTRIES.filter((i) => i.features.includes(f.slug));
  // The next three features in the list, so every feature page links to a different set.
  const at = FEATURES.indexOf(f);
  const others = [1, 2, 3].map((n) => FEATURES[(at + n) % FEATURES.length]);
  return (
    <>
      <JsonLd data={[faqPage(f.faqs), howTo(`How to use ${f.name.toLowerCase()} in Scriwo`, f.howTo), speakable(path, ["[data-speakable]"])]} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Features", path: "/features" }, { name: f.name, path }]} />
      <PageHero eyebrow={f.keyword} title={f.title} intro={f.summary}>
        <Link href="/contact?interest=demo" className="btn-primary">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <Link href="/pricing" className="btn-ghost">See plans</Link>
      </PageHero>
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {f.points.map((p) => (
            <div key={p.title} className="card p-6">
              <h2 className="text-lg">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
      <Container className="mt-20 grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="How to" title={`Set up ${f.name.toLowerCase()}`} />
          <ol className="mt-8 space-y-4">
            {f.howTo.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface font-serif text-gold hairline">{i + 1}</span>
                <p className="pt-1 text-fg-2">{s}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionTitle eyebrow="FAQ" title="Common questions" />
          <div className="mt-8"><FaqList faqs={f.faqs} /></div>
        </div>
      </Container>
      {industries.length > 0 && (
        <Container className="mt-20">
          <h2 className="text-2xl">Popular with</h2>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {industries.map((i) => (
              <Link key={i.slug} href={`/industries/${i.slug}`} className="rounded-full bg-surface px-4 py-2 text-sm hairline hover:bg-surface-2">{i.name}</Link>
            ))}
          </div>
        </Container>
      )}
      <Container className="mt-20">
        <h2 className="text-2xl">Related features</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {others.map((o) => <LinkCard key={o.slug} href={`/features/${o.slug}`} title={o.name} body={o.summary} />)}
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
