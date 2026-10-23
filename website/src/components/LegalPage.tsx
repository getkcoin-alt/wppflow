import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Crumbs } from "@/components/ui";
import { LEGAL, POLICY_LINKS, businessDetails } from "@/lib/legal";

/** Shared layout for the policy pages: title, date, body, and the business details gateways look for. */
export function LegalPage({ title, path, intro, children }: { title: string; path: string; intro: ReactNode; children: ReactNode }) {
  return (
    <>
      <Crumbs items={[{ name: "Home", path: "/" }, { name: title, path }]} />
      <Container className="prose-scriwo max-w-3xl pt-10">
        <h1 className="mb-2 text-4xl">{title}</h1>
        <p className="text-sm text-fg-3">Last updated {LEGAL.updated}</p>
        <p className="mt-8">{intro}</p>
        {children}
        <BusinessDetails />
        <nav aria-label="Policies" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm">
          {POLICY_LINKS.filter((l) => l.href !== path).map((l) => (
            <Link key={l.href} href={l.href} className="underline">{l.label}</Link>
          ))}
        </nav>
      </Container>
    </>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 mt-10 text-xl">{children}</h2>;
}

export function List({ items }: { items: ReactNode[] }) {
  return <ul className="mb-4 list-disc space-y-2 pl-6">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
}

export function BusinessDetails() {
  return (
    <section className="mt-10 rounded-2xl bg-surface p-6 hairline">
      <h2 className="mb-4 text-lg">Contact us</h2>
      <p className="!mb-4 text-sm">Scriwo is a product of {LEGAL.legalName}.</p>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
        {businessDetails().map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-3">{k}</dt>
            <dd className="text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
