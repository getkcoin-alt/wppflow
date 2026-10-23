import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Container, PageHero, SectionTitle, CtaBand, Crumbs, LinkCard } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { GuideLinks } from "@/components/GuideLinks";
import { guidesFor } from "@/content/blog";
import { INDUSTRIES, industryBySlug } from "@/content/industries";
import { featureBySlug } from "@/content/features";
import { CITIES } from "@/content/cities";
import { speakable } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => INDUSTRIES.map((i) => ({ slug: i.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = industryBySlug((await params).slug);
  if (!i) return {};
  return { title: i.title, description: i.intro.slice(0, 158), alternates: { canonical: `/industries/${i.slug}` } };
}

export default async function IndustryPage({ params }: Props) {
  const i = industryBySlug((await params).slug);
  if (!i) notFound();
  const path = `/industries/${i.slug}`;
  const cities = CITIES.filter((c) => c.industries.includes(i.slug));
  return (
    <>
      <JsonLd data={speakable(path, ["[data-speakable]"])} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: i.name, path }]} />
      <PageHero eyebrow={i.keyword} title={i.title} intro={i.intro}>
        <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: "industries" })} className="btn-primary">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </PageHero>
      <Container className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-8">
          <h2 className="text-xl">Sound familiar?</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-fg-2">
            {i.problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
          {i.workflow.map((w) => (
            <div key={w.title} className="card p-6">
              <h3 className="text-lg">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{w.body}</p>
            </div>
          ))}
        </div>
      </Container>
      <Container className="mt-12">
        <aside className="flex gap-4 rounded-3xl bg-note p-6">
          <Lightbulb className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
          <p><b>From the field:</b> {i.tip}</p>
        </aside>
      </Container>
      <Container className="mt-20">
        <SectionTitle eyebrow="Features they use most" title={`Scriwo for ${i.name.toLowerCase()}`} />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {i.features.map((slug) => featureBySlug(slug)).filter((f) => !!f).map((f) => (
            <LinkCard key={f.slug} href={`/features/${f.slug}`} title={f.name} body={f.summary} icon={<f.icon className="h-5 w-5" aria-hidden="true" />} />
          ))}
        </div>
      </Container>
      {cities.length > 0 && (
        <Container className="mt-16">
          <h2 className="text-2xl">Local guides for {i.name.toLowerCase()} teams</h2>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {cities.map((c) => (
              <Link key={c.slug} href={`/whatsapp-crm/${c.slug}`} className="rounded-full bg-surface px-4 py-2 text-sm hairline hover:bg-surface-2">{c.name}</Link>
            ))}
          </div>
        </Container>
      )}
      <GuideLinks title={`Guides for ${i.name.toLowerCase()} teams`} posts={guidesFor({ industry: i.slug })} />
      <CtaBand title={`Run ${i.name.toLowerCase()} WhatsApp as a team`} />
    </>
  );
}
