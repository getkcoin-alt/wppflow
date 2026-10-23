import Link from "next/link";
import { CheckCircle2, MessageCircle, Sparkle } from "lucide-react";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { HtmlLang } from "@/components/HtmlLang";
import type { Locale } from "@/content/locales";
import { absolute, whatsappHref } from "@/lib/site";
import { trackAttrs } from "@/lib/analytics";

/** The Arabic and Hindi landing pages: one design, content from content/locales.ts. */
export function LocalizedLanding({ t }: { t: Locale }) {
  return (
    <div lang={t.lang} dir={t.dir}>
      <HtmlLang lang={t.hreflang} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", url: absolute(t.path), name: t.title, description: t.description, inLanguage: t.hreflang, isPartOf: { "@id": absolute("/#website") }, about: { "@id": absolute("/#organization") } },
          { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: t.hreflang, mainEntity: t.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />
      <section className="hero-glow overflow-hidden">
        <Container className="grid items-center gap-12 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow rise">{t.eyebrow}</p>
              <Link href="/" hrefLang="en" lang="en" className="text-sm text-fg-3 underline hover:text-fg">{t.english}</Link>
            </div>
            <h1 className="rise-2 mt-5 text-[2.4rem] leading-[1.2] sm:text-[3.1rem]">
              {t.h1[0]} <span className="gold-text">{t.h1[1]}</span>
            </h1>
            <p data-speakable className="rise-3 mt-6 max-w-xl text-lg leading-relaxed text-fg-2">{t.intro}</p>
            <div className="rise-3 mt-8 flex flex-wrap gap-3">
              <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: `home-${t.lang}` })} className="btn-primary">{t.primary}</Link>
              <a href={whatsappHref(t.whatsappText)} target="_blank" rel="noopener" {...trackAttrs("whatsapp_click", { place: `home-${t.lang}` })} className="btn-ghost">
                <MessageCircle className="h-4 w-4 text-brand" aria-hidden="true" /> {t.whatsapp}
              </a>
            </div>
            <p className="rise-3 mt-6 text-sm text-fg-3">{t.appNote}</p>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div aria-hidden="true" className="absolute inset-8 rounded-full bg-gold/25 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element -- illustration */}
            <img src="/brand/riwo-chats.webp" alt="" width={800} height={800} className="float relative w-full rounded-4xl shadow-pop" />
          </div>
        </Container>
      </section>

      <Container className="mt-12">
        <h2 data-reveal className="text-3xl">{t.featuresTitle}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((f) => (
            <div key={f.title} className="card lift p-6">
              <h3 className="text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{f.body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-20 grid gap-6 lg:grid-cols-2">
        <div className="card p-8">
          <h2 className="flex items-center gap-2 text-2xl"><Sparkle className="h-5 w-5 text-gold" aria-hidden="true" />{t.riwoTitle}</h2>
          <p className="mt-4 leading-relaxed text-fg-2">{t.riwoBody}</p>
          <Link href="/riwo" hrefLang="en" className="mt-5 inline-block text-sm text-brand underline">Riwo</Link>
        </div>
        <div className="card p-8">
          <h2 className="text-2xl">{t.pricingTitle}</h2>
          <ul className="mt-5 space-y-3">
            {t.pricing.map((p) => (
              <li key={p} className="flex gap-2.5 text-fg-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />{p}</li>
            ))}
          </ul>
          <Link href="/pricing" hrefLang="en" className="mt-5 inline-block text-sm text-brand underline">Pricing</Link>
        </div>
      </Container>

      <Container className="mt-20">
        <h2 data-reveal className="text-3xl">{t.faqTitle}</h2>
        <div className="mt-8 divide-y divide-line rounded-3xl bg-surface hairline">
          {t.faqs.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start font-medium">
                {f.q}
                <span aria-hidden="true" className="text-xl text-fg-3 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-fg-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>

      <Container className="mt-20">
        <div data-reveal className="flex flex-col items-start gap-5 rounded-4xl bg-[#1e2227] px-6 py-12 text-white sm:px-12">
          <p className="text-2xl font-semibold">{t.h1[0]} {t.h1[1]}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: `cta-${t.lang}` })} className="btn bg-white text-[#1e2227] hover:bg-white/90">{t.primary}</Link>
            <a href={whatsappHref(t.whatsappText)} target="_blank" rel="noopener" {...trackAttrs("whatsapp_click", { place: `cta-${t.lang}` })} className="btn border border-white/20 text-white hover:bg-white/10">{t.whatsapp}</a>
          </div>
        </div>
      </Container>
    </div>
  );
}
