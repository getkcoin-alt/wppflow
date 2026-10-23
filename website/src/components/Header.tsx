"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { trackAttrs } from "@/lib/analytics";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/riwo", label: "Riwo AI" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/developers", label: "Developers" },
  { href: "/blog", label: "Guides" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-page items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Scriwo home">
          <Logo size={34} />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm text-fg-2 hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: "header" })} className="btn-primary hidden !py-2 text-sm sm:inline-flex">
            Book a demo
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line px-4 pb-6 pt-2 md:hidden">
          {[...NAV, { href: "/contact", label: "Contact" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base hover:bg-surface-2">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
