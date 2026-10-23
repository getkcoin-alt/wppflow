import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, List } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Shipping and Delivery Policy",
  description: "Scriwo is software delivered online. Nothing is shipped: accounts are activated by email, usually within one working day of sign-up or payment.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  const L = LEGAL;
  return (
    <LegalPage
      title="Shipping and delivery policy"
      path="/shipping-policy"
      intro={<>Scriwo is a software service sold by {L.legalName} and delivered entirely online. No physical goods are shipped, and there are no shipping charges.</>}
    >
      <H2>How Scriwo is delivered</H2>
      <List items={[
        "After you sign up or pay, our onboarding team sets up your company account.",
        "The account owner receives an email with a single-use link to set a password and sign in at app.scriwo.com.",
        "Staff are invited from inside the app and link their WhatsApp numbers by scanning a QR code.",
      ]} />

      <H2>Delivery time</H2>
      <p>Accounts are usually activated within one working day of sign-up or payment, and always within 3 working days. Plan upgrades take effect as soon as payment is confirmed. If you have not received your sign-in email within that time, check your spam folder and then contact us.</p>

      <H2>Where we deliver</H2>
      <p>Scriwo is available online to businesses in India, the United Arab Emirates and other countries where we can lawfully provide it.</p>

      <H2>Problems with delivery</H2>
      <p>If your account is not activated or a paid feature is missing after payment, <Link href="/contact?interest=general" className="underline">contact us</Link>{L.supportEmail ? <> or email <a href={`mailto:${L.supportEmail}`} className="underline">{L.supportEmail}</a></> : null} with your payment reference and we will fix it or refund you under our <Link href="/refund-policy" className="underline">refund policy</Link>.</p>
    </LegalPage>
  );
}
