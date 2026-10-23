import { SITE, absolute } from "./site";
import type { Faq } from "@/content/faqs";
import { PLANS } from "@/content/plans";
import { LEGAL } from "./legal";

export const organization = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": absolute("/#organization"),
  name: SITE.name,
  url: SITE.url,
  logo: absolute("/brand/scriwo-mark-512.png"),
  image: absolute("/brand/riwo-chats.webp"),
  description: SITE.description,
  parentOrganization: { "@type": "Organization", name: LEGAL.legalName, url: LEGAL.companySite },
  ...(LEGAL.supportEmail ? { email: LEGAL.supportEmail } : {}),
  ...(LEGAL.registeredAddress ? { address: { "@type": "PostalAddress", streetAddress: "488, Pandit Plaza, Sector-9, Savina", addressLocality: "Udaipur", addressRegion: "Rajasthan", postalCode: "313001", addressCountry: "IN" } } : {}),
  legalName: LEGAL.legalName,
  ...(LEGAL.cin ? { identifier: [{ "@type": "PropertyValue", propertyID: "CIN", value: LEGAL.cin }, { "@type": "PropertyValue", propertyID: "GSTIN", value: LEGAL.gstin }] } : {}),
  areaServed: [
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "India" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    url: absolute("/contact"),
    telephone: "+91-9119112999",
    availableLanguage: ["English"],
    areaServed: ["AE", "IN"],
  },
});

export const website = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absolute("/#website"),
  name: SITE.name,
  url: SITE.url,
  publisher: { "@id": absolute("/#organization") },
  inLanguage: "en",
});

export const softwareApplication = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Customer relationship management",
  operatingSystem: "Web browser",
  url: SITE.url,
  description: SITE.description,
  publisher: { "@id": absolute("/#organization") },
  offers: (["AED", "INR"] as const).map((cur) => {
    const prices = PLANS.map((p) => p.price[cur]).filter((n): n is number => n !== null);
    return {
      "@type": "AggregateOffer",
      priceCurrency: cur,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      url: absolute("/pricing"),
    };
  }),
  featureList: [
    "Shared WhatsApp inbox", "Chat assignment", "Private notes", "@mentions", "Broadcasts to opted-in contacts",
    "Keyword automations", "Audit log", "Scoped API keys", "Signed webhooks", "CSV import and export",
  ],
});

export const faqPage = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.path) })),
});

export const howTo = (name: string, steps: string[]) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name,
  step: steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
});

export const speakable = (path: string, selectors: string[]) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: absolute(path),
  speakable: { "@type": "SpeakableSpecification", cssSelector: selectors },
});
