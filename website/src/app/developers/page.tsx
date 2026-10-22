import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Crumbs, CtaBand } from "@/components/ui";

export const metadata: Metadata = {
  title: "Developers — WhatsApp API, Webhooks and SDK Samples",
  description: "Connect Scriwo to your CRM, ERP or website with scoped API keys and signed webhooks. Test requests in the built-in API tester and copy SDK samples.",
  alternates: { canonical: "/developers" },
};

const sample = `// Verify a Scriwo webhook before trusting it (Node.js / Express)
import crypto from "node:crypto";

// rawBody: the exact request body text, before JSON parsing.
export function isFromScriwo(rawBody, headers, secret) {
  const timestamp = headers["x-scriwo-timestamp"];
  const given = String(headers["x-scriwo-signature"] || "");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest("hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
  return fresh && given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}`;

export default function DevelopersPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }]} />
      <PageHero eyebrow="Developers" title="An open platform, inside the product" intro="API keys, webhooks, an API tester and SDK samples all live in Scriwo. No separate developer portal, no waiting for access.">
        <Link href="/contact?interest=demo" className="btn-primary">Get access</Link>
      </PageHero>
      <Container className="grid gap-5 md:grid-cols-3">
        {[
          ["Scoped API keys", "Create a key per integration with only the access it needs. Revoke one without breaking the others."],
          ["Signed webhooks", "Receive events as they happen. Every delivery is signed so you can verify it came from Scriwo."],
          ["API tester and SDKs", "Try any request from inside the product, then copy working samples into your code."],
        ].map(([t, b]) => (
          <div key={t} className="card p-6"><h2 className="text-lg">{t}</h2><p className="mt-2 text-sm text-fg-2">{b}</p></div>
        ))}
      </Container>
      <Container className="mt-16">
        <h2 className="text-2xl">Verifying a webhook</h2>
        <p className="mt-3 max-w-2xl text-fg-2">Each delivery carries X-Scriwo-Timestamp and X-Scriwo-Signature headers. The signature is an HMAC-SHA256 of the timestamp, a dot, and the raw body, using your webhook secret:</p>
        <pre className="mt-6 overflow-x-auto rounded-3xl bg-[#0a0b0c] p-6 text-[13px] leading-relaxed text-[#e8e8ea]"><code>{sample}</code></pre>
      </Container>
      <CtaBand title="Building an integration?" body="Tell us what you want to connect. We will make sure your plan includes API access and help you get started." />
    </>
  );
}
