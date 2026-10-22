import type { Metadata } from "next";
import { Container, PageHero, Crumbs, CtaBand, CheckList } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security — Roles, Audit Log, Signed Webhooks, No Emailed Passwords",
  description: "How Scriwo protects your team's WhatsApp: server-enforced roles, audit log, suspend, scoped API keys, signed webhooks, single-use links and tested, self-rolling-back deploys.",
  alternates: { canonical: "/security" },
};

const GROUPS = [
  { title: "Access", items: ["Owner, admin and staff roles, enforced on the server", "Staff see their own number's chats plus chats assigned to them", "Per-company limits on linked numbers", "Suspend a company or person instantly; live connections drop at once"] },
  { title: "Accounts", items: ["Passwords are never emailed; people choose them from single-use links that expire", "Short-lived access tokens kept in memory; refresh cookies are HttpOnly", "Sign-in attempts are rate limited"] },
  { title: "Integrations", items: ["Scoped API keys you can revoke one by one", "Signed webhooks so your server can verify every call", "Only owners and admins can create keys and webhooks"] },
  { title: "Numbers", items: ["Removing a number unlinks it from the phone and deletes its saved login", "Leftover browser processes are cleaned up automatically", "An alert when a linked phone goes offline"] },
  { title: "Reliability", items: [`${SITE.facts.backendSuites} backend test suites and ${SITE.facts.frontendTests} frontend tests run on every change`, "Deploys check health and roll back on their own", "The database is backed up before any change", "Every important action is written to an audit log"] },
];

export default function SecurityPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Security", path: "/security" }]} />
      <PageHero eyebrow="Security" title="Safe by default, not by configuration" intro="Customer conversations are some of the most sensitive data a business has. Scriwo is built so the safe choice is the default one." />
      <Container className="grid gap-5 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} className="card p-8">
            <h2 className="mb-5 text-xl">{g.title}</h2>
            <CheckList items={g.items} />
          </section>
        ))}
      </Container>
      <Container className="mt-10">
        <p className="text-sm text-fg-3">Scriwo connects to WhatsApp as a linked device, the same way WhatsApp Web does. It is independent and not affiliated with WhatsApp or Meta.</p>
      </Container>
      <CtaBand title="Have a security questionnaire?" body="Send it through the contact form and we will answer it properly." />
    </>
  );
}
