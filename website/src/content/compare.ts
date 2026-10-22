export type Comparison = {
  slug: string;
  title: string;
  keyword: string;
  intro: string;
  them: string;
  rows: { label: string; scriwo: string; them: string }[];
  verdict: string;
};

// Only compare against things we can describe accurately. Named-competitor pages need
// facts checked against each competitor's current public pricing and docs first.
export const COMPARISONS: Comparison[] = [
  {
    slug: "scriwo-vs-whatsapp-business-app",
    title: "Scriwo vs the WhatsApp Business app",
    keyword: "WhatsApp Business app for teams",
    them: "WhatsApp Business app",
    intro:
      "The WhatsApp Business app is excellent for one person. Once several staff handle customers, you need ownership, oversight and handovers. That is what Scriwo adds, on top of the numbers you already use.",
    rows: [
      { label: "Built for", scriwo: "Companies with staff", them: "One business owner" },
      { label: "Each staff member on their own login", scriwo: "Yes", them: "No, people share a phone or device" },
      { label: "Owner sees every staff number", scriwo: "Yes, in one inbox", them: "No" },
      { label: "Assign and resolve chats", scriwo: "Yes", them: "No" },
      { label: "Private notes on a chat", scriwo: "Yes, never sent to the customer", them: "No" },
      { label: "@mention teammates", scriwo: "Yes", them: "No" },
      { label: "Audit log", scriwo: "Yes", them: "No" },
      { label: "API keys and webhooks", scriwo: "Yes", them: "No" },
      { label: "Price", scriwo: "Free for 1 number; teams from AED 299 / ₹2,499 a month", them: "Free" },
    ],
    verdict: "Use the WhatsApp Business app on its own if one person answers every message. Add Scriwo when a team does.",
  },
  {
    slug: "scriwo-vs-sharing-one-phone",
    title: "Scriwo vs sharing one office phone",
    keyword: "multiple users one WhatsApp",
    them: "A shared office phone",
    intro:
      "Many teams in Dubai and India pass one phone around the office, or log it into WhatsApp Web on several computers. It works until two people reply to the same customer, or nobody does.",
    rows: [
      { label: "Who replied to the customer", scriwo: "Shown on every message", them: "Unknown" },
      { label: "Who owns this chat now", scriwo: "Assigned to a named person", them: "Whoever picks up the phone" },
      { label: "Staff leaves the company", scriwo: "Remove the number, history stays", them: "Change the phone's PIN and hope" },
      { label: "Internal discussion", scriwo: "Private notes and @mentions on the chat", them: "A separate group, out of context" },
      { label: "Phone goes offline", scriwo: "Alert to the team", them: "Noticed when a customer complains" },
    ],
    verdict: "A shared phone is free but costs you leads you never see. Scriwo gives every person their own login and gives the owner the whole picture.",
  },
  {
    slug: "scriwo-vs-whatsapp-api-platforms",
    title: "Scriwo vs WhatsApp Business API platforms",
    keyword: "WhatsApp API alternative",
    them: "WhatsApp Business API platforms",
    intro:
      "WhatsApp Business API platforms are built for high-volume, template-based messaging from one official number. Scriwo is built for teams who talk to customers from the numbers they already use. They solve different problems.",
    rows: [
      { label: "Numbers", scriwo: "Each staff member's existing number", them: "Usually one or a few official numbers" },
      { label: "Setup", scriwo: "Scan a QR code", them: "Business verification and number registration" },
      { label: "Messaging customers first", scriwo: "Normal WhatsApp conversations; broadcasts to opted-in contacts with delays", them: "Approved message templates, billed per conversation" },
      { label: "Best for", scriwo: "Relationship selling and support by named staff", them: "Large automated notifications and marketing" },
      { label: "Green tick / official badge", scriwo: "No", them: "Possible, subject to approval" },
    ],
    verdict: "If you need thousands of automated notifications a day from one official number, use an API platform. If your people sell and support customers on their own WhatsApp, Scriwo fits better.",
  },
];

export const comparisonBySlug = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
