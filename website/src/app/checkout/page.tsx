import type { Metadata } from "next";
import Link from "next/link";
import { Container, Crumbs, PageHero } from "@/components/ui";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCheckoutOptions } from "@/lib/catalogue";

// Checking out is for people who are about to pay, not for search results.
export const metadata: Metadata = {
  title: "Buy a Scriwo plan",
  description: "Choose a plan, pay securely in rupees and your Scriwo workspace is created as soon as the payment is confirmed.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};
export const revalidate = 60;

export default async function CheckoutPage() {
  const options = await getCheckoutOptions();
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }, { name: "Buy", path: "/checkout" }]} />
      <PageHero eyebrow="Checkout" title="Start your Scriwo workspace" intro="Pay securely in rupees. Your workspace is created as soon as the payment is confirmed, and we email you a link to choose your password." />
      <Container className="pb-24">
        {options?.enabled ? (
          <CheckoutForm options={options} />
        ) : (
          <div className="card mx-auto max-w-xl p-8 text-center">
            <h2 className="text-2xl">Online purchase is not available right now</h2>
            <p className="mt-3 text-fg-2">You have not been charged. Message our team and we will set up your workspace and send an invoice.</p>
            <Link href="/contact?interest=pricing" className="btn-primary mt-6">Contact the team</Link>
          </div>
        )}
      </Container>
    </>
  );
}
