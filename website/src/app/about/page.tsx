import type { Metadata } from "next";
import { Container, PageHero, Crumbs, CtaBand } from "@/components/ui";
import { BusinessDetails } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "About Scriwo",
  description: "Scriwo is a shared WhatsApp inbox built for companies with staff in the UAE and India: calm, premium and safe by default.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <PageHero eyebrow="About" title="Conversations, thoughtfully handled" intro="In the UAE and India, business happens on WhatsApp. But WhatsApp was built for one person and one phone. Scriwo exists for everything that happens after a company hires its second salesperson." />
      <Container className="prose-scriwo max-w-3xl">
        <h2 className="mb-4 mt-4 text-2xl">What we believe</h2>
        <p>Staff should not have to change how they talk to customers. They keep their own number and their own way of working; the business gets visibility, ownership and continuity.</p>
        <p>Software for non-technical teams should need no training. If you can use WhatsApp, you can use Scriwo.</p>
        <p>Safety is a default, not a setting. Passwords are never emailed, access is enforced on the server, and every important action is logged.</p>
        <p>Engineering discipline is a feature. Every change is tested, deploys roll back on their own, and the database is backed up before anything changes.</p>
        <h2 className="mb-4 mt-10 text-2xl">Where we work</h2>
        <p>We focus on the United Arab Emirates and India, and the many businesses that operate between them.</p>
        <h2 className="mb-4 mt-10 text-2xl">Who we are</h2>
        <p>Scriwo is built and operated by {LEGAL.legalName}, a software company based in India (<a href={LEGAL.companySite} className="underline" rel="noopener">{LEGAL.companySite.replace("https://", "")}</a>). Customers in India are billed in INR and customers in the UAE in AED.</p>
        <BusinessDetails />
      </Container>
      <CtaBand />
    </>
  );
}
