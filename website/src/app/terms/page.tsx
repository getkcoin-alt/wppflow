import type { Metadata } from "next";
import Link from "next/link";
import { Container, Crumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the Scriwo website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }]} />
      <Container className="prose-scriwo max-w-3xl pt-10">
        <h1 className="mb-2 text-4xl">Terms</h1>
        <p className="text-sm text-fg-3">Last updated 22 October 2026</p>
        <p className="mt-8">This website describes the Scriwo product. Your use of the Scriwo app is governed by the agreement and invoice your company receives when it signs up.</p>
        <p>Scriwo is an independent product and is not affiliated with, endorsed by or sponsored by WhatsApp or Meta. You are responsible for using WhatsApp in line with WhatsApp&apos;s own terms, including only messaging people who want to hear from you.</p>
        <p>Questions? <Link href="/contact?interest=general" className="underline">Contact us</Link>.</p>
      </Container>
    </>
  );
}
