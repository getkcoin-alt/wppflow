const trim = (v: string) => v.replace(/\/+$/, "");

export const SITE = {
  name: "Scriwo",
  url: trim(process.env.NEXT_PUBLIC_SITE_URL || "https://www.scriwo.com"),
  appUrl: trim(process.env.NEXT_PUBLIC_APP_URL || "https://app.scriwo.com"),
  // Sales WhatsApp, digits only. NEXT_PUBLIC_WHATSAPP_NUMBER overrides it.
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919119112999").replace(/\D/g, ""),
  whatsappDisplay: "+91 91191 12999",
  tagline: "The shared WhatsApp inbox for teams",
  description:
    "Scriwo is a shared WhatsApp inbox and CRM for companies with staff in the UAE and India. Every teammate links their own number, owners see every chat, and the team assigns, notes and resolves conversations together.",
  markets: ["United Arab Emirates", "India"],
  // Product facts quoted on the site. Keep them true: update when the numbers change.
  facts: { backendSuites: 30, frontendTests: 146 },
} as const;

export const absolute = (path = "/") => `${SITE.url}${path === "/" ? "" : path}`;

export const whatsappHref = (text = "Hi Scriwo, I would like to know more.") =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;

export const contactHref = (params: Record<string, string> = {}) => {
  const q = new URLSearchParams(params).toString();
  return `/contact${q ? `?${q}` : ""}`;
};
