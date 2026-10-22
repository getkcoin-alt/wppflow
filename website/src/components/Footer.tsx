import Link from "next/link";
import { Logo } from "./Logo";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { COMPARISONS } from "@/content/compare";

const col = "space-y-2.5 text-sm";
const link = "text-fg-2 hover:text-fg";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[13px] font-medium tracking-[0.34em]">SCRIWO</span>
          </div>
          <p className="mt-4 text-sm text-fg-2">The shared WhatsApp inbox for teams in the UAE and India.</p>
          <Link href="/contact" className="btn-primary mt-6 !py-2 text-sm">Contact sales</Link>
        </div>
        <FooterCol title="Product" items={[...FEATURES.slice(0, 6).map((f) => ({ href: `/features/${f.slug}`, label: f.name })), { href: "/pricing", label: "Pricing" }, { href: "/security", label: "Security" }, { href: "/developers", label: "API and webhooks" }]} />
        <FooterCol title="Industries" items={INDUSTRIES.map((i) => ({ href: `/industries/${i.slug}`, label: i.name }))} />
        <FooterCol
          title="Locations"
          items={[
            ...CITIES.filter((c) => c.country === "UAE").map((c) => ({ href: `/whatsapp-crm/${c.slug}`, label: `WhatsApp CRM ${c.name}` })),
            ...CITIES.filter((c) => c.country === "India").slice(0, 5).map((c) => ({ href: `/whatsapp-crm/${c.slug}`, label: `WhatsApp CRM ${c.name}` })),
            { href: "/whatsapp-crm", label: "All locations" },
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            { href: "/about", label: "About" },
            { href: "/blog", label: "Guides" },
            { href: "/free-whatsapp-crm", label: "Free WhatsApp CRM" },
            ...COMPARISONS.map((c) => ({ href: `/compare/${c.slug}`, label: `Scriwo vs ${c.them}` })),
            { href: "/contact", label: "Contact" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-4 py-6 text-xs text-fg-3 sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Scriwo. Conversations, thoughtfully handled.</p>
          <p>Scriwo is an independent product and is not affiliated with WhatsApp or Meta. WhatsApp is a trademark of its owner.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-fg-3">{title}</h2>
      <ul className={col}>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className={link}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
