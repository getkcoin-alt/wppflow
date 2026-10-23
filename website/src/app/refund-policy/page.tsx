import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, List } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy",
  description: `Cancel a Scriwo plan at any time. How cancellation, refunds for duplicate or failed payments and plan changes work for customers in India and the UAE.`,
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  const L = LEGAL;
  return (
    <LegalPage
      title="Refund and cancellation policy"
      path="/refund-policy"
      intro={<>This policy applies to Scriwo plans sold by {L.legalName}. Scriwo is a subscription software service delivered online, and you can cancel at any time.</>}
    >
      <H2>Free plan</H2>
      <p>The Free plan (one account with one WhatsApp number) costs nothing, so there is nothing to refund. You can close it at any time.</p>

      <H2>Cancelling a paid plan</H2>
      <List items={[
        <>You can cancel a monthly or annual plan at any time by emailing us{L.supportEmail ? <> at <a href={`mailto:${L.supportEmail}`} className="underline">{L.supportEmail}</a></> : null}, messaging us on WhatsApp at {L.phone}, or using the <Link href="/contact?interest=general" className="underline">contact form</Link>.</>,
        "Cancellation stops the next renewal. Your plan stays active until the end of the period you have already paid for, and you will not be charged again.",
        "We confirm every cancellation by email within one working day.",
        "Before your access ends, you can export your contacts. Customer data is deleted within 90 days after the account closes.",
      ]} />

      <H2>Refunds</H2>
      <p>Because you can try Scriwo on the Free plan before paying and cancel at any time, payments for a billing period that has started are not refunded, including for partly used months or years. We do refund in these cases:</p>
      <List items={[
        "Duplicate payment: you were charged twice for the same invoice.",
        "Failed transaction: money left your account but the payment did not reach us or the plan was not activated.",
        "Charged after cancelling: you were billed for a period that started after we confirmed your cancellation.",
        "Our failure: we could not provide the service you paid for because of a fault on our side that we could not fix within 7 days.",
      ]} />
      <p>To request a refund, contact us within 30 days of the payment with your invoice number or payment reference. Approved refunds are issued to the original payment method within 5 to 7 working days. Your bank or card issuer may take longer to show the credit. For UAE and international customers, the amount refunded is the AED amount charged; we are not responsible for exchange-rate differences applied by your bank.</p>

      <H2>Changing plans</H2>
      <p>Upgrades take effect straight away, and you pay the difference for the rest of the current period. Downgrades take effect from the next billing period. Downgrading does not create a refund for the current period.</p>

      <H2>Taxes</H2>
      <p>Where a refund is made, the GST or VAT charged on it is refunded too, and a credit note is issued.</p>
    </LegalPage>
  );
}
