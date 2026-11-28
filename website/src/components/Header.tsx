"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { trackAttrs } from "@/lib/analytics";
import { TRIAL_LABEL, trialUrl } from "@/lib/signup";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/homes", label: "Scriwo Homes" },
  { href: "/riwo", label: "Riwo AI" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/developers", label: "Developers" },
  { href: "/white-label", label: "White-label" },
  { href: "/blog", label: "Guides" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-page items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Scriwo home">
          <Logo size={34} />
        </Link>
        <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center xl:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full px-2 py-2 text-[13px] text-fg-2 hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 xl:ml-0">
          <ThemeToggle />
          <a href={trialUrl()} {...trackAttrs("trial_click", { place: "header" })} className="btn-primary hidden !py-2 text-sm sm:inline-flex">{TRIAL_LABEL}</a>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2 xl:hidden"
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
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-line px-4 pb-6 pt-2 xl:hidden">
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
