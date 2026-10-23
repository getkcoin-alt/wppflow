import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, List } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: `The terms for using Scriwo, a product of ${LEGAL.legalName}: accounts, plans, billing in AED and INR, cancellation, acceptable use and liability.`,
  alternates: { canonical: "/terms" },
};

// Written to be read by customers and payment gateway reviewers. Have a lawyer review before relying on it.
export default function TermsPage() {
  const L = LEGAL;
  return (
    <LegalPage
      title="Terms and conditions"
      path="/terms"
      intro={<>These terms are an agreement between you and {L.legalName} (&quot;{L.shortName}&quot;, &quot;we&quot;, &quot;us&quot;), which owns and operates Scriwo, the website at {SITE.url} and the app at {SITE.appUrl}. By creating an account, using Scriwo or paying for a plan, you agree to these terms on behalf of yourself and the business you represent.</>}
    >
      <H2>1. The service</H2>
      <p>Scriwo is software as a service: a shared inbox and CRM that lets a business&apos;s staff work on the WhatsApp numbers they link to it. It is delivered online only. Nothing physical is shipped.</p>
      <p>Scriwo is an independent product. It is not affiliated with, endorsed by or sponsored by WhatsApp or Meta, and it is not the WhatsApp Business API. Numbers are linked as linked devices, in the same way as WhatsApp Web.</p>

      <H2>2. Eligibility and accounts</H2>
      <List items={[
        "Scriwo is for businesses. You must be at least 18 and able to enter a binding contract for your business.",
        "Accounts are set up by our onboarding team. The account owner receives a single-use link to set a password, then invites staff.",
        "You are responsible for everything done under your company's account, for keeping passwords private and for removing staff who should no longer have access.",
        "The information you give us, including billing and tax details, must be accurate and kept up to date.",
      ]} />

      <H2>3. Plans, prices and billing</H2>
      <List items={[
        <>Plans and prices are listed on the <Link href="/pricing" className="underline">pricing page</Link>. The Free plan covers one account with one WhatsApp number at no charge.</>,
        "Paid plans are charged in Indian rupees (INR) for customers in India and in UAE dirhams (AED) for customers in the UAE and elsewhere, for a monthly or annual billing period, paid in advance.",
        "Prices exclude taxes. In India, 18% GST is added; for customers outside India, applicable taxes are added as required by law. Your invoice shows the tax charged.",
        "Payments are processed by our payment partners (payment gateways and banks). We do not see or store your full card details.",
        "A subscription continues for the same billing period until cancelled. Where you have authorised automatic renewal, the plan renews at the end of each period at the then-current price. Otherwise we send an invoice or payment link before each period.",
        "We may change prices for future billing periods. We will tell you at least 30 days before a change affects you.",
        "If a payment fails or is overdue, we may suspend paid features after notice until it is paid.",
      ]} />

      <H2>4. Cancellation and refunds</H2>
      <p>You can cancel at any time, and the plan stays active until the end of the period you have paid for. Paid periods are not refundable, except as set out in our <Link href="/refund-policy" className="underline">refund and cancellation policy</Link>, which forms part of these terms.</p>

      <H2>5. Acceptable use</H2>
      <p>You must use Scriwo lawfully and in line with WhatsApp&apos;s own terms and policies. In particular, you must not:</p>
      <List items={[
        "message people who have not agreed to hear from you, send spam, or use Scriwo for bulk unsolicited marketing;",
        "send content that is unlawful, fraudulent, abusive, defamatory, infringing or harmful, or that promotes illegal goods or services;",
        "link a WhatsApp number you are not authorised to use, or monitor anyone's conversations without the authority and notice the law requires;",
        "try to break, overload, reverse engineer or get around the security or limits of Scriwo, or resell it without our written agreement.",
      ]} />
      <p>WhatsApp may restrict or ban a number for reasons outside our control. Scriwo reduces risk with opt-in checks and delays between broadcast messages, but we cannot guarantee a number will not be restricted.</p>

      <H2>6. Your data</H2>
      <p>You own the messages, contacts and other data your business puts into Scriwo (&quot;customer data&quot;). We process customer data only to provide and support the service, as described in our <Link href="/privacy" className="underline">privacy policy</Link>. You are responsible for having a lawful basis to process the personal data of your customers and staff, including under India&apos;s Digital Personal Data Protection Act 2023 and the UAE&apos;s Personal Data Protection Law.</p>
      <p>You can export your contacts at any time. After your account closes, we delete customer data within 90 days unless the law requires us to keep it longer.</p>

      <H2>7. Our intellectual property</H2>
      <p>Scriwo, its software, design and brand belong to {L.shortName}. We give you a limited, non-exclusive, non-transferable right to use Scriwo for your business while your account is active. Feedback you give us may be used to improve Scriwo.</p>

      <H2>8. Availability and support</H2>
      <p>We work to keep Scriwo available and to fix problems quickly, but the service is provided &quot;as is&quot; and &quot;as available&quot;. It depends on WhatsApp, the internet and your linked phones staying online, which we do not control. Support is available by email, WhatsApp and the contact form during our support hours.</p>

      <H2>9. Limitation of liability</H2>
      <p>To the extent the law allows, {L.shortName} is not liable for indirect or consequential losses, lost profits, lost data or business interruption, or for actions taken by WhatsApp or Meta. Our total liability for any claim relating to Scriwo is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</p>

      <H2>10. Indemnity</H2>
      <p>You will compensate {L.shortName} for claims, losses and costs arising from your breach of these terms or from the messages and data you send through Scriwo.</p>

      <H2>11. Suspension and termination</H2>
      <p>You may close your account at any time. We may suspend or close an account that breaches these terms, puts other users or the service at risk, or is not paid, and will give notice where we reasonably can.</p>

      <H2>12. Changes to these terms</H2>
      <p>We may update these terms. The date at the top shows the latest version, and we will tell account owners about material changes before they take effect. Continuing to use Scriwo after that means you accept the updated terms.</p>

      <H2>13. Governing law</H2>
      <p>These terms are governed by the laws of India{L.jurisdiction ? <>, and the courts at {L.jurisdiction} have exclusive jurisdiction</> : null}. Before going to court, both sides will try in good faith to settle any dispute by talking to each other for at least 30 days.</p>
    </LegalPage>
  );
}
