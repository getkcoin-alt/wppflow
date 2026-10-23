import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkle, UserCheck } from "lucide-react";
import { Container, Crumbs, CtaBand, FaqList, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { RIWO, RIWO_ACTIONS, RIWO_FAQS, RIWO_STEPS } from "@/content/riwo";
import { faqPage, howTo, speakable } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Riwo — AI Reply Assistant for WhatsApp Teams",
  description: "Riwo is the AI assistant inside Scriwo's shared WhatsApp inbox. It drafts replies, improves your wording, translates into Arabic, Hindi and 13 more languages, and summarises long chats. A person always sends.",
  alternates: { canonical: "/riwo" },
};

export default function RiwoPage() {
  return (
    <>
      <JsonLd data={[faqPage(RIWO_FAQS), howTo("How to use Riwo in the Scriwo inbox", RIWO_STEPS), speakable("/riwo", ["[data-speakable]"])]} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Riwo AI assistant", path: "/riwo" }]} />
      <section className="hero-glow overflow-hidden">
        <Container className="grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow rise">Meet Riwo · {RIWO.plan}</p>
            <h1 className="rise-2 mt-5 text-[2.4rem] leading-[1.06] sm:text-[3.25rem]">
              The AI assistant that helps your team <span className="gold-text">reply like your best salesperson.</span>
            </h1>
            <p data-speakable className="rise-3 mt-6 max-w-xl text-lg leading-relaxed text-fg-2">{RIWO.oneLine}</p>
            <div className="rise-3 mt-8 flex flex-wrap gap-3">
              <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: "riwo-hero" })} className="btn-primary">
                See Riwo in a demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/pricing" className="btn-ghost">Plans with Riwo</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div aria-hidden="true" className="absolute inset-8 rounded-full bg-gold/25 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element -- illustration */}
            <img src="/brand/riwo-hold.webp" alt="Riwo, a friendly gold and pearl robot holding a chat bubble" width={800} height={800} className="float relative w-full rounded-4xl shadow-pop" />
          </div>
        </Container>
      </section>

      <Container className="mt-16">
        <SectionTitle eyebrow="What Riwo does" title="Four things, done well" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {RIWO_ACTIONS.map((a) => (
            <div key={a.title} className="card lift p-6">
              <h2 className="flex items-center gap-2 text-xl"><Sparkle className="h-5 w-5 text-gold" aria-hidden="true" />{a.title}</h2>
              <p className="mt-3 leading-relaxed text-fg-2">{a.body}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {a.options.map((o) => <li key={o} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-fg-2">{o}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24 grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="How to use it" title="Ask, check, send" />
          <ol className="mt-8 space-y-6">
            {RIWO_STEPS.map((s, i) => (
              <li key={s} data-reveal className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface font-display font-bold text-gold hairline">{i + 1}</span>
                <p className="pt-1.5 text-fg-2">{s}</p>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal className="relative mx-auto w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element -- illustration */}
          <img src="/brand/riwo-chats.webp" alt="Riwo handling several WhatsApp conversations at once" width={800} height={800} loading="lazy" className="float-slow w-full rounded-4xl shadow-pop" />
        </div>
      </Container>

      <Container className="mt-24 grid gap-5 md:grid-cols-3">
        {[
          { icon: UserCheck, title: "A person always sends", body: "Riwo writes into the message box and stops. Your teammate reads, edits and presses send." },
          { icon: ShieldCheck, title: "Safe with customer text", body: "Customer messages are treated as data, never as instructions, so a message cannot steer Riwo." },
          { icon: Sparkle, title: "In the customer's language", body: "Riwo answers in the language and script the customer used, from Arabic and Hindi to Hinglish and Tamil." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card lift p-6">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold"><Icon className="h-5 w-5" aria-hidden="true" /></div>
            <h2 className="text-lg">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{body}</p>
          </div>
        ))}
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="About Riwo" />
        <div className="mt-8"><FaqList faqs={RIWO_FAQS} /></div>
      </Container>
      <CtaBand title="Let Riwo help your team reply" body="Riwo comes with the Growth plan and above. Tell us about your team and we will show it working on your own chats." />
    </>
  );
}
