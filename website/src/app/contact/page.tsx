import type { Metadata } from "next";
import { Clock, Globe2, MessageCircle, ShieldCheck } from "lucide-react";
import { Container, Crumbs } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { JsonLd } from "@/components/JsonLd";
import { absolute, SITE, whatsappHref } from "@/lib/site";
import { trackAttrs } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Contact Scriwo — Book a Demo or Start a Plan",
  description: "Talk to Scriwo about a shared WhatsApp inbox for your team in the UAE or India. Book a demo, ask for pricing or start a plan. A real person replies within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", url: absolute("/contact"), about: { "@id": absolute("/#organization") } }} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <section className="hero-glow">
        <Container className="grid gap-12 pb-8 pt-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Let&apos;s get your team on Scriwo</h1>
            <p className="mt-6 text-lg text-fg-2">Book a demo, ask for a quote or start a plan. Online checkout is coming soon; until then, this form is the fastest way to get started.</p>
            <a href={whatsappHref("Hi Scriwo, I would like a demo for my team.")} target="_blank" rel="noopener" {...trackAttrs("whatsapp_click", { place: "contact-page" })} className="btn-ghost mt-8">
              <MessageCircle className="h-4 w-4 text-brand" aria-hidden="true" /> WhatsApp sales: {SITE.whatsappDisplay}
            </a>
            <ul className="mt-10 space-y-5">
              <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><span className="text-fg-2">A real person replies within one business day.</span></li>
              <li className="flex gap-3"><Globe2 className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><span className="text-fg-2">We work UAE and India business hours.</span></li>
              <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><span className="text-fg-2">We use your details only to reply. No mailing list.</span></li>
            </ul>
          </div>
          <ContactForm />
        </Container>
      </section>
    </>
  );
}
