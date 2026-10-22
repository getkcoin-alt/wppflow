import type { Metadata } from "next";
import Link from "next/link";
import { Container, Crumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How Scriwo handles the information you share through this website.",
  alternates: { canonical: "/privacy" },
};

// Plain-language notice for the public website. Review with a lawyer before relying on it
// for UAE PDPL and India DPDP Act obligations.
export default function PrivacyPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }]} />
      <Container className="prose-scriwo max-w-3xl pt-10">
        <h1 className="mb-2 text-4xl">Privacy notice</h1>
        <p className="text-sm text-fg-3">Last updated 22 October 2026</p>
        <h2 className="mb-3 mt-10 text-xl">What this covers</h2>
        <p>This notice covers the public Scriwo website. Data inside the Scriwo app is handled under the agreement with your company.</p>
        <h2 className="mb-3 mt-10 text-xl">What we collect</h2>
        <p>When you send the contact form, we receive the details you type: your name, email, and optionally phone, company, country, team size, what you are interested in and your message, plus the page you came from. We do not set advertising cookies. Your light or dark theme choice is stored only in your own browser.</p>
        <h2 className="mb-3 mt-10 text-xl">Why we use it</h2>
        <p>Only to reply to you, prepare a quote and set up your company if you decide to use Scriwo. We do not sell your details or add you to a mailing list.</p>
        <h2 className="mb-3 mt-10 text-xl">Where it goes</h2>
        <p>Enquiries are stored on Scriwo&apos;s servers. A notification email is sent to our team through our email provider. The website is hosted on Vercel.</p>
        <h2 className="mb-3 mt-10 text-xl">How long we keep it</h2>
        <p>As long as needed to handle your enquiry and any resulting customer relationship, then deleted.</p>
        <h2 className="mb-3 mt-10 text-xl">Your choices</h2>
        <p>You can ask to see, correct or delete your details at any time. Use the <Link href="/contact?interest=general" className="underline">contact form</Link> and say what you need.</p>
      </Container>
    </>
  );
}
