import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, CtaBand, Crumbs } from "@/components/ui";
import { CITIES } from "@/content/cities";

export const metadata: Metadata = {
  title: "WhatsApp CRM in the UAE and India — Dubai, Abu Dhabi, Mumbai, Delhi, Bengaluru",
  description: "Scriwo serves teams across the UAE and India. Find the WhatsApp CRM guide for your city: Dubai, Abu Dhabi, Sharjah, Mumbai, Delhi NCR, Bengaluru, Hyderabad and more.",
  alternates: { canonical: "/whatsapp-crm" },
};

export default function LocationsPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Locations", path: "/whatsapp-crm" }]} />
      <PageHero eyebrow="Locations" title="WhatsApp CRM for teams across the UAE and India" intro="Scriwo is a cloud product, so it works anywhere. These guides cover how teams in each city use WhatsApp, and how Scriwo fits." />
      <Container className="grid gap-6 md:grid-cols-2">
        {(["UAE", "India"] as const).map((country) => (
          <section key={country} className="card p-8">
            <h2 className="text-2xl">{country === "UAE" ? "United Arab Emirates" : "India"}</h2>
            <ul className="mt-6 space-y-3">
              {CITIES.filter((c) => c.country === country).map((c) => (
                <li key={c.slug}>
                  <Link href={`/whatsapp-crm/${c.slug}`} className="group flex items-baseline justify-between gap-4">
                    <span className="font-medium group-hover:text-brand">WhatsApp CRM {c.name}</span>
                    <span className="text-right text-xs text-fg-3">{c.hubs.slice(0, 2).join(", ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
      <CtaBand />
    </>
  );
}
