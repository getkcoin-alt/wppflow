import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Container, PageHero, SectionTitle, CtaBand, Crumbs, FaqList, LinkCard } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CITIES, cityBySlug } from "@/content/cities";
import { industryBySlug } from "@/content/industries";
import { FEATURES } from "@/content/features";
import { absolute } from "@/lib/site";
import { faqPage, speakable } from "@/lib/jsonld";
import { PLANS, TAX_NOTE } from "@/content/plans";
import { formatMoney } from "@/lib/money";
import { trackAttrs } from "@/lib/analytics";

type Props = { params: Promise<{ city: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => CITIES.map((c) => ({ city: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = cityBySlug((await params).city);
  if (!c) return {};
  return {
    title: `WhatsApp CRM ${c.name} — Shared WhatsApp Inbox for Teams`,
    description: `Scriwo gives ${c.name} businesses a shared WhatsApp inbox: every staff number in one place, chat assignment, private notes and owner visibility. Billing in ${c.country === "UAE" ? "AED" : "INR"}.`,
    alternates: { canonical: `/whatsapp-crm/${c.slug}` },
    openGraph: { locale: c.country === "UAE" ? "en_AE" : "en_IN" },
  };
}

export default async function CityPage({ params }: Props) {
  const c = cityBySlug((await params).city);
  if (!c) notFound();
  const path = `/whatsapp-crm/${c.slug}`;
  const currency = c.country === "UAE" ? "AED" : "INR";
  // Cheapest paid plan; the free plan is mentioned separately.
  const from = formatMoney(PLANS.find((p) => (p.price[currency] ?? 0) > 0)?.price[currency] ?? 0, currency);
  const faqs = [
    { q: `Is there a WhatsApp CRM for teams in ${c.name}?`, a: `Yes. Scriwo is a shared WhatsApp inbox and CRM used by teams in ${c.name}. Each staff member links their own number, owners see every chat, and chats can be assigned, noted and resolved.` },
    { q: `How much does Scriwo cost in ${c.name}?`, a: `One account with one WhatsApp number is free. Team plans start at ${from} a month for up to 3 numbers, billed in ${currency} with no per-message fees. ${TAX_NOTE[currency]}` },
    { q: `Do I need an office in ${c.name} to use Scriwo?`, a: "No. Scriwo runs in the browser. Your team signs in from anywhere and links their WhatsApp by scanning a QR code." },
  ];
  const nearby = CITIES.filter((o) => o.country === c.country && o.slug !== c.slug).slice(0, 6);
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `WhatsApp CRM in ${c.name}`,
            serviceType: "Shared WhatsApp inbox and CRM software",
            provider: { "@id": absolute("/#organization") },
            areaServed: { "@type": "City", name: c.name, containedInPlace: { "@type": "Country", name: c.country === "UAE" ? "United Arab Emirates" : "India" }, geo: { "@type": "GeoCoordinates", latitude: c.geo.lat, longitude: c.geo.lng } },
            url: absolute(path),
          },
          faqPage(faqs),
          speakable(path, ["[data-speakable]"]),
        ]}
      />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Locations", path: "/whatsapp-crm" }, { name: c.name, path }]} />
      <PageHero eyebrow={c.region === c.name ? `${c.name} · ${c.country === "UAE" ? "United Arab Emirates" : "India"}` : `${c.name} · ${c.region}`} title={<>WhatsApp CRM for teams in {c.name}</>} intro={c.local}>
        <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: "whatsapp-crm" })} className="btn-primary">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <Link href="/pricing" className="btn-ghost">Free for 1 number · teams from {from}</Link>
      </PageHero>
      <Container className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-8">
          <h2 className="text-xl">Who uses WhatsApp as a team in {c.name}</h2>
          <ul className="mt-5 space-y-4">
            {c.industries.map((s) => industryBySlug(s)).filter((i) => !!i).map((i) => (
              <li key={i.slug}>
                <Link href={`/industries/${i.slug}`} className="font-medium hover:text-brand">{i.name}</Link>
                <p className="mt-1 text-sm text-fg-2">{i.problems[0]}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-8">
          <h2 className="text-xl">Business districts</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {c.hubs.map((h) => (
              <li key={h} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm"><MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />{h}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-fg-2">Scriwo is cloud software: no installation, no office visit. Your team can be live the same day.</p>
        </div>
      </Container>
      <Container className="mt-20">
        <SectionTitle eyebrow="What you get" title={`Built for ${c.name} teams that sell on WhatsApp`} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.slice(0, 6).map((f) => <LinkCard key={f.slug} href={`/features/${f.slug}`} title={f.name} body={f.summary} icon={<f.icon className="h-5 w-5" aria-hidden="true" />} />)}
        </div>
      </Container>
      <Container className="mt-20">
        <SectionTitle eyebrow="FAQ" title={`WhatsApp CRM in ${c.name}: questions`} />
        <div className="mt-8"><FaqList faqs={faqs} /></div>
      </Container>
      <Container className="mt-16">
        <h2 className="text-xl">Also in {c.country === "UAE" ? "the UAE" : "India"}</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {nearby.map((o) => <Link key={o.slug} href={`/whatsapp-crm/${o.slug}`} className="rounded-full bg-surface px-4 py-2 text-sm hairline hover:bg-surface-2">WhatsApp CRM {o.name}</Link>)}
        </div>
      </Container>
      <CtaBand title={`Bring your ${c.name} team's WhatsApp together`} />
    </>
  );
}
