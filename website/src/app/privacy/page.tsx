import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, List } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${LEGAL.legalName} collects, uses and protects personal data on the Scriwo website and app, under India's DPDP Act 2023 and the UAE PDPL.`,
  alternates: { canonical: "/privacy" },
};

// Plain-language policy. Review with a lawyer before relying on it for DPDP Act and UAE PDPL obligations.
export default function PrivacyPage() {
  const L = LEGAL;
  const contact = L.grievanceOfficer.email || L.supportEmail;
  return (
    <LegalPage
      title="Privacy policy"
      path="/privacy"
      intro={<>This policy explains how {L.legalName} (&quot;{L.shortName}&quot;, &quot;we&quot;) handles personal data on the Scriwo website, in the Scriwo app and when you pay for a plan. We follow India&apos;s Digital Personal Data Protection Act 2023 and the Information Technology Act 2000 and its rules, and the UAE&apos;s Federal Decree-Law No. 45 of 2021 on Personal Data Protection where it applies.</>}
    >
      <H2>1. What we collect</H2>
      <List items={[
        <><strong>Enquiries:</strong> what you type in the contact form (name, email, and optionally phone, company, country, team size, interest and message) and the page you came from.</>,
        <><strong>Account data:</strong> names, work emails, roles and sign-in activity of the owner and staff of a customer company.</>,
        <><strong>Customer data in the app:</strong> the WhatsApp messages, media, contacts, notes and opt-in records of the numbers a business links. We handle this on the business&apos;s behalf and only to provide Scriwo to it.</>,
        <><strong>Billing data:</strong> company name, billing address, GSTIN or tax number, plan and payment status. Card, UPI and bank details are entered on our payment partner&apos;s secure page; we do not receive or store full card numbers.</>,
        <><strong>Usage data:</strong> pages visited, clicks, device and browser type, and approximate location from IP address.</>,
      ]} />

      <H2>2. Why we use it</H2>
      <List items={[
        "To reply to enquiries, prepare quotes and set up accounts.",
        "To provide, secure and support the Scriwo service, including fraud prevention and audit logs.",
        "To bill you, collect payment and keep tax and accounting records.",
        "To understand how the website is used and improve it.",
        "To meet legal obligations and respond to lawful requests.",
      ]} />
      <p>We rely on your consent, on the performance of our contract with your business, and on our legal obligations. We do not sell personal data and we do not add you to a mailing list without asking.</p>

      <H2>3. Cookies and analytics</H2>
      <p>We measure visits with Vercel Web Analytics, which uses no cookies, and Microsoft Clarity with its cookies turned off. Google cookies (for analytics and for measuring our Google Ads) are set only if you click Accept on the cookie notice; if you decline, Google receives cookieless signals only and nothing is used for ad personalisation. Your theme choice is stored only in your browser. You can change your choice by clearing this site&apos;s data in your browser.</p>

      <H2>4. Who we share it with</H2>
      <p>Only with service providers that help us run Scriwo, under contracts that require them to protect it:</p>
      <List items={[
        "hosting and infrastructure providers for the website, app and database;",
        "our email provider, to send sign-in links and notifications;",
        "payment gateways and banks, to process payments;",
        "analytics providers (Vercel, Microsoft Clarity and Google), as described above;",
        "WhatsApp, which carries the messages your business sends and receives.",
      ]} />
      <p>We may disclose data where the law requires it, or to protect our users and the service.</p>

      <H2>5. Where it is stored</H2>
      <p>Data may be processed in India and in other countries where our providers operate. Where data leaves India or the UAE, we use providers with appropriate safeguards and transfer it only as the law permits.</p>

      <H2>6. How long we keep it</H2>
      <p>Enquiries are kept for as long as needed to handle them and any resulting customer relationship. Customer data in the app is deleted within 90 days after an account closes. Billing records are kept for as long as tax law requires, which in India is generally 8 years.</p>

      <H2>7. Security</H2>
      <p>Access is role-based and enforced on our servers, connections are encrypted, important actions are logged, passwords are never emailed, and backups are taken before changes. No system is perfectly secure; if a breach affects your personal data, we will tell you and the authorities as the law requires.</p>

      <H2>8. Your rights</H2>
      <p>You can ask to access, correct, update or delete your personal data, withdraw consent, or nominate someone to act for you. If you are a customer of a business that uses Scriwo, please contact that business first; we will help it respond. To make a request, {contact ? <>email <a href={`mailto:${contact}`} className="underline">{contact}</a> or </> : null}use the <Link href="/contact?interest=general" className="underline">contact form</Link>. We respond within 30 days.</p>

      <H2>9. Children</H2>
      <p>Scriwo is a business service and is not meant for anyone under 18. We do not knowingly collect children&apos;s data.</p>

      <H2>10. Grievance officer</H2>
      <p>
        If you have a concern about how your data is handled, contact our Grievance Officer
        {L.grievanceOfficer.name ? <>, {L.grievanceOfficer.name}</> : null}
        {contact ? <>{L.grievanceOfficer.name ? "," : ""} at <a href={`mailto:${contact}`} className="underline">{contact}</a></> : null}.
        We acknowledge complaints within 24 hours and aim to resolve them within 15 days. In India you may also complain to the Data Protection Board of India.
      </p>

      <H2>11. Changes</H2>
      <p>We may update this policy. The date at the top shows the latest version, and we will tell account owners about material changes.</p>
    </LegalPage>
  );
}
