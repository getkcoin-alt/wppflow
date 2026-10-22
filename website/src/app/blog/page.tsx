import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Crumbs, CtaBand } from "@/components/ui";
import { POSTS } from "@/content/blog";

export const metadata: Metadata = {
  title: "Guides — Running WhatsApp as a Team in the UAE and India",
  description: "Practical guides on WhatsApp for sales and support teams: setup, response times, broadcasts that protect your number, and industry playbooks.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/blog" }]} />
      <PageHero eyebrow="Guides" title="Run WhatsApp like a well-managed team" intro="Playbooks from teams across the UAE and India. No fluff, just what works." />
      <Container className="grid gap-5 md:grid-cols-2">
        {POSTS.map((p) => (
          <article key={p.slug} className="card p-7">
            <p className="text-xs text-fg-3"><time dateTime={p.published}>{new Date(p.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time> · {p.readingMinutes} min read</p>
            <h2 className="mt-3 text-xl"><Link href={`/blog/${p.slug}`} className="hover:text-brand">{p.title}</Link></h2>
            <p className="mt-3 text-sm leading-relaxed text-fg-2">{p.description}</p>
          </article>
        ))}
      </Container>
      <CtaBand />
    </>
  );
}
