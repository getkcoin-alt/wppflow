import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Crumbs, CtaBand, LinkCard } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import Link from "next/link";
import { POSTS, postBySlug, guidesFor } from "@/content/blog";
import { industryBySlug } from "@/content/industries";
import { GuideLinks } from "@/components/GuideLinks";
import { featureBySlug } from "@/content/features";
import { absolute } from "@/lib/site";
import { speakable } from "@/lib/jsonld";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = postBySlug((await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", publishedTime: p.published, modifiedTime: p.updated || p.published },
  };
}

export default async function PostPage({ params }: Props) {
  const p = postBySlug((await params).slug);
  if (!p) notFound();
  const path = `/blog/${p.slug}`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.title,
            description: p.description,
            datePublished: p.published,
            dateModified: p.updated || p.published,
            author: { "@type": "Organization", name: "Scriwo team", url: absolute("/about") },
            publisher: { "@id": absolute("/#organization") },
            mainEntityOfPage: absolute(path),
            isPartOf: { "@id": absolute("/#website") },
            image: absolute("/opengraph-image"),
            inLanguage: "en",
            keywords: p.keyword,
            about: { "@type": "SoftwareApplication", name: "Scriwo", applicationCategory: "BusinessApplication" },
            ...(p.country ? { contentLocation: { "@type": "Country", name: p.country === "UAE" ? "United Arab Emirates" : "India" } } : {}),
          },
          speakable(path, ["[data-speakable]"]),
        ]}
      />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/blog" }, { name: p.title, path }]} />
      <article>
        <Container className="max-w-3xl pt-10">
          <p className="eyebrow">{p.keyword}</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{p.title}</h1>
          <p className="mt-4 text-sm text-fg-3">
            By the Scriwo team · <time dateTime={p.published}>{new Date(p.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time> · {p.readingMinutes} min read
          </p>
          <div className="mt-10 rounded-3xl bg-surface p-6 hairline">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">The short answer</p>
            <p data-speakable className="mt-3 text-lg leading-relaxed">{p.answer}</p>
          </div>
          <div className="prose-scriwo mt-12">
            {p.sections.map((s) => (
              <section key={s.heading} className="mt-10">
                <h2 className="mb-4 text-2xl">{s.heading}</h2>
                {s.body.map((b) => <p key={b}>{b}</p>)}
                {s.list && <ul className="list-disc space-y-2 pl-6">{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
              </section>
            ))}
          </div>
        </Container>
      </article>
      <Container className="mt-16 max-w-3xl">
        <h2 className="text-xl">Features mentioned in this guide</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {p.related.map((s) => featureBySlug(s)).filter((f) => !!f).map((f) => <LinkCard key={f.slug} href={`/features/${f.slug}`} title={f.name} body={f.summary} />)}
        </div>
      </Container>
      {(p.industries?.length || p.country) && (
        <Container className="mt-10 max-w-3xl">
          <ul className="flex flex-wrap gap-2.5 text-sm">
            {p.industries?.map((s) => industryBySlug(s)).filter((i) => !!i).map((i) => (
              <li key={i.slug}><Link href={`/industries/${i.slug}`} className="inline-block rounded-full bg-surface px-4 py-2 hairline hover:bg-surface-2">WhatsApp for {i.name.toLowerCase()}</Link></li>
            ))}
            {p.country && <li><Link href="/whatsapp-crm" className="inline-block rounded-full bg-surface px-4 py-2 hairline hover:bg-surface-2">WhatsApp CRM in {p.country === "UAE" ? "the UAE" : "India"}</Link></li>}
          </ul>
        </Container>
      )}
      <GuideLinks
        title="Keep reading"
        posts={[...(p.industries ?? []).flatMap((s) => guidesFor({ industry: s, exclude: p.slug })), ...guidesFor({ country: p.country, exclude: p.slug }), ...POSTS.filter((o) => o.slug !== p.slug)].filter((o, n, all) => all.findIndex((q) => q.slug === o.slug) === n)}
      />
      <CtaBand />
    </>
  );
}
