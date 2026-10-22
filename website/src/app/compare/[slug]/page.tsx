import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, PageHero, Crumbs, CtaBand } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { COMPARISONS, comparisonBySlug } from "@/content/compare";
import { speakable } from "@/lib/jsonld";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => COMPARISONS.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = comparisonBySlug((await params).slug);
  if (!c) return {};
  return { title: c.title, description: c.intro.slice(0, 158), alternates: { canonical: `/compare/${c.slug}` } };
}

export default async function ComparisonPage({ params }: Props) {
  const c = comparisonBySlug((await params).slug);
  if (!c) notFound();
  const path = `/compare/${c.slug}`;
  return (
    <>
      <JsonLd data={speakable(path, ["[data-speakable]"])} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }, { name: c.title, path }]} />
      <PageHero eyebrow={c.keyword} title={c.title} intro={c.intro} />
      <Container>
        <div className="overflow-x-auto rounded-3xl bg-surface hairline">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">{c.title}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="p-5 font-medium text-fg-3"> </th>
                <th scope="col" className="p-5 font-semibold text-brand">Scriwo</th>
                <th scope="col" className="p-5 font-semibold">{c.them}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {c.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="p-5 font-medium">{r.label}</th>
                  <td className="p-5 text-fg-2">{r.scriwo}</td>
                  <td className="p-5 text-fg-2">{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-10 rounded-3xl bg-note p-6 sm:p-8">
          <h2 className="text-xl">The honest verdict</h2>
          <p data-speakable className="mt-3 text-fg-2">{c.verdict}</p>
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
