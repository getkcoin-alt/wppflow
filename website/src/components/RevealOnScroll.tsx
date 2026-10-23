"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Inline in <head>: hide revealable blocks before first paint, but only when motion is welcome and
// the observer exists. If this component never runs (script error, very old browser), the class is
// removed after a few seconds so nothing stays hidden.
export const revealScript = `(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;var d=document.documentElement;d.classList.add('reveal-ready');setTimeout(function(){if(!window.__scriwoReveal)d.classList.remove('reveal-ready')},4000)}catch(e){}})()`;

const SELECTOR = "[data-reveal], main .card:not(.no-reveal)";

/** Fades blocks up as they scroll into view, with a small stagger between siblings. */
export function RevealOnScroll() {
  const pathname = usePathname();
  useEffect(() => {
    (window as unknown as { __scriwoReveal?: boolean }).__scriwoReveal = true;
    if (!document.documentElement.classList.contains("reveal-ready")) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add("in");
          io.unobserve(el);
          // Drop the stagger once revealed so hover effects respond instantly.
          setTimeout(() => el.style.removeProperty("--reveal-delay"), 1000);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.classList.contains("in")) return;
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
      el.style.setProperty("--reveal-delay", `${(siblings.indexOf(el) % 6) * 70}ms`);
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
