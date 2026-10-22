import type { Metadata } from "next";
import { Container, PageHero, LinkCard, CtaBand, Crumbs } from "@/components/ui";
import { FEATURES } from "@/content/features";

export const metadata: Metadata = {
  title: "Features — Shared WhatsApp Inbox, Assignment, Notes, Broadcasts",
  description: "Every Scriwo feature: a live shared WhatsApp inbox, chat assignment, private notes, @mentions, broadcasts to opted-in contacts, automations, roles, API and webhooks.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Features", path: "/features" }]} />
      <PageHero eyebrow="Features" title="Everything your team needs to run WhatsApp together" intro="Scriwo brings every teammate's WhatsApp into one live inbox with clear ownership, private context and the controls an owner needs." />
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <LinkCard key={f.slug} href={`/features/${f.slug}`} title={f.name} body={f.summary} icon={<f.icon className="h-5 w-5" aria-hidden="true" />} />
          ))}
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
