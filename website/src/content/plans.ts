export type Plan = {
  id: "starter" | "growth" | "business" | "enterprise";
  name: string;
  for: string;
  numbers: string;
  highlight?: boolean;
  /** Monthly price. Leave null until pricing is published; the page then says "Price on request". */
  price: { AED: number | null; INR: number | null };
  includes: string[];
};

// Online payments are not live yet: every plan is started through the contact form.
export const PAYMENTS_LIVE = false;

export const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", for: "Small teams getting organised", numbers: "Up to 3 numbers",
    price: { AED: null, INR: null },
    includes: ["Shared live inbox", "Assign and resolve", "Private notes and @mentions", "Contacts with CSV import and export", "Dark and light themes"],
  },
  {
    id: "growth", name: "Growth", for: "Sales and support teams", numbers: "Up to 10 numbers", highlight: true,
    price: { AED: null, INR: null },
    includes: ["Everything in Starter", "Broadcasts to opted-in contacts", "Keyword automations and saved replies", "Desktop and offline alerts", "Audit log"],
  },
  {
    id: "business", name: "Business", for: "Multi-branch companies", numbers: "Up to 25 numbers",
    price: { AED: null, INR: null },
    includes: ["Everything in Growth", "Scoped API keys", "Signed webhooks", "API tester and SDK samples", "Onboarding call for your team"],
  },
  {
    id: "enterprise", name: "Enterprise", for: "Large teams and custom needs", numbers: "Custom number limit",
    price: { AED: null, INR: null },
    includes: ["Everything in Business", "Custom number limit", "Dedicated onboarding", "Help connecting your systems"],
  },
];
