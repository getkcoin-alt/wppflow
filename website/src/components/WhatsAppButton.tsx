import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { SITE, whatsappHref } from "@/lib/site";
import { trackAttrs } from "@/lib/analytics";

// Floating "chat with sales" button. Uses WhatsApp when a sales number is configured, else the contact form.
export function WhatsAppButton() {
  const href = SITE.whatsappNumber
    ? whatsappHref()
    : "/contact";
  const label = SITE.whatsappNumber ? "Chat with sales on WhatsApp" : "Contact sales";
  return (
    <Link
      href={href}
      aria-label={label}
      {...(SITE.whatsappNumber ? trackAttrs("whatsapp_click", { place: "floating" }) : trackAttrs("demo_click", { place: "floating" }))}
      className="fixed bottom-5 right-5 z-40 hidden h-14 w-14 place-items-center rounded-full bg-brand-solid text-white shadow-pop transition-transform hover:scale-105 sm:grid"
      {...(SITE.whatsappNumber ? { target: "_blank", rel: "noopener" } : {})}
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </Link>
  );
}

// Mobile-only bottom bar so the main action is always one thumb away.
export function MobileCta() {
  return (
    <div className="glass fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line p-3 sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <a href={SITE.whatsappNumber ? whatsappHref() : "/pricing"} {...(SITE.whatsappNumber ? trackAttrs("whatsapp_click", { place: "mobile-bar" }) : {})} className="btn-ghost flex-1 !py-2.5 text-sm" {...(SITE.whatsappNumber ? { target: "_blank", rel: "noopener" } : {})}>
        {SITE.whatsappNumber ? "WhatsApp" : "Plans"}
      </a>
      <Link href="/contact?interest=demo" {...trackAttrs("demo_click", { place: "mobile-bar" })} className="btn-primary flex-[2] !py-2.5 text-sm">Book a demo</Link>
    </div>
  );
}
