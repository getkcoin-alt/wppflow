export type Plan = {
  id: "free" | "starter" | "growth" | "business" | "enterprise";
  name: string;
  for: string;
  numbers: string;
  highlight?: boolean;
  /** Monthly price before tax. null means a custom quote. */
  price: { AED: number | null; INR: number | null };
  includes: string[];
};

// Online payments are not live yet: every plan, free or paid, is set up by the onboarding team
// through the contact form, at the prices below.
export const PAYMENTS_LIVE = false;

// Prices exclude tax: 5% VAT in the UAE, 18% GST in India.
// Set against the market in October 2026: API inbox platforms list roughly ₹2,500–18,500 or
// AED 180–440 a month before per-message fees, and linked-number team inboxes charge about
// USD 20–60 per seat. Scriwo charges per company with a number limit and no per-message fees.
export const TAX_NOTE = { AED: "Prices exclude 5% VAT.", INR: "Prices exclude 18% GST." } as const;

export const PLANS: Plan[] = [
  {
    id: "free", name: "Free", for: "One person getting started", numbers: "1 number",
    price: { AED: 0, INR: 0 },
    includes: ["One WhatsApp number on one account", "Live inbox with chat history", "Private notes", "Contacts with CSV import and export", "Dark and light themes"],
  },
  {
    id: "starter", name: "Starter", for: "Small teams getting organised", numbers: "Up to 3 numbers",
    price: { AED: 299, INR: 2499 },
    includes: ["Shared live inbox", "Assign and resolve", "Private notes and @mentions", "Contacts with CSV import and export", "Dark and light themes"],
  },
  {
    id: "growth", name: "Growth", for: "Sales and support teams", numbers: "Up to 10 numbers", highlight: true,
    price: { AED: 799, INR: 6999 },
    includes: ["Everything in Starter", "Riwo, the AI reply assistant", "Broadcasts to opted-in contacts", "Keyword automations and saved replies", "Desktop and offline alerts", "Audit log"],
  },
  {
    id: "business", name: "Business", for: "Multi-branch companies", numbers: "Up to 25 numbers",
    price: { AED: 1699, INR: 14999 },
    includes: ["Everything in Growth", "Scoped API keys", "Signed webhooks", "API tester and SDK samples", "Onboarding call for your team"],
  },
  {
    id: "enterprise", name: "Enterprise", for: "Large teams and custom needs", numbers: "Custom number limit",
    price: { AED: null, INR: null },
    includes: ["Everything in Business", "Custom number limit", "Dedicated onboarding", "Help connecting your systems"],
  },
];
