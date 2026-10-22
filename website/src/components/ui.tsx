import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { JsonLd } from "./JsonLd";
import { breadcrumbs } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";
import type { Faq } from "@/content/faqs";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-page px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro: ReactNode; children?: ReactNode }) {
  return (
    <section className="hero-glow">
      <Container className="pb-12 pt-14 sm:pt-20">
        <p className="eyebrow rise">{eyebrow}</p>
        <h1 className="rise-2 mt-4 max-w-3xl text-4xl leading-[1.08] sm:text-5xl md:text-6xl">{title}</h1>
        <div data-speakable className="rise-3 mt-6 max-w-2xl text-lg leading-relaxed text-fg-2">{intro}</div>
        {children && <div className="rise-3 mt-8 flex flex-wrap gap-3">{children}</div>}
      </Container>
    </section>
  );
}

export function Crumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbs(items)} />
      <Container>
        <nav aria-label="Breadcrumb" className="pt-6 text-sm text-fg-3">
          <ol className="flex flex-wrap items-center gap-1.5">
            {items.map((it, i) => (
              <li key={it.path} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">/</span>}
                {i === items.length - 1 ? (
                  <span aria-current="page" className="text-fg-2">{it.name}</span>
                ) : (
                  <Link href={it.path} className="hover:text-fg">{it.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </Container>
    </>
  );
}

export function SectionTitle({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-fg-2">{intro}</p>}
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i} className="flex gap-3 text-fg-2">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-line rounded-3xl bg-surface hairline">
      {faqs.map((f) => (
        <details key={f.q} className="group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
            {f.q}
            <span aria-hidden="true" className="text-xl text-fg-3 transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 leading-relaxed text-fg-2">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title = "See Scriwo with your own team", body = "Tell us how many people answer WhatsApp at your company. We will set you up and walk your team through it." }: { title?: string; body?: string }) {
  return (
    <Container className="mt-24">
      <div className="relative overflow-hidden rounded-4xl bg-[#0a0b0c] px-6 py-14 text-white sm:px-14">
        <div aria-hidden="true" className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(50% 80% at 85% 0%, rgba(210,176,106,.28), transparent 70%), radial-gradient(40% 70% at 0% 100%, rgba(15,107,85,.45), transparent 70%)" }} />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-white/75">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: "cta-band" })} className="btn bg-white text-[#0a0b0c] hover:bg-white/90">
              Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="btn border border-white/20 text-white hover:bg-white/10">See plans</Link>
          </div>
        </div>
      </div>
    </Container>
  );
}

export function LinkCard({ href, title, body, icon }: { href: string; title: string; body: string; icon?: ReactNode }) {
  return (
    <Link href={href} className="card group block p-6 transition-transform duration-300 hover:-translate-y-0.5">
      {icon && <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">{icon}</div>}
      <h3 className="text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-2">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
        Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
