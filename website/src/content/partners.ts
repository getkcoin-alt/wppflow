// White-label and reseller partnerships. This is an offer made through a conversation, not a self-serve feature: partners and
// their clients are set up by the Scriwo team (see docs/white-label-foundation.md in the repository). Keep the wording to what
// is true: nothing here promises a screen, a domain or a price that does not exist yet.

export const PARTNERS = {
  eyebrow: "Partners · White-label",
  title: "Offer WhatsApp CRM to your clients, under your own name",
  intro:
    "Agencies, IT resellers and software companies use Scriwo to give their clients a shared WhatsApp inbox, an AI sales assistant and a pipeline, without building any of it. Tell us about your clients and we will set up a white-label partnership with you.",
};

export const PARTNER_OFFER = [
  { title: "A shared WhatsApp inbox", body: "Every client's team links its own numbers, assigns, notes and resolves chats together. No training needed.", href: "/features/whatsapp-team-inbox" },
  { title: "AI that qualifies and hands over", body: "Riwo asks your client's questions, answers short ones, and sends pricing and proposals to a person with the requirements ready.", href: "/features/ai-sales-assistant" },
  { title: "A pipeline and reports", body: "Leads follow the chat, follow-ups remind the right person, and owners see reply times.", href: "/features/whatsapp-sales-pipeline" },
  { title: "API and webhooks", body: "Connect a client's CRM, ERP or website with scoped keys and signed webhooks (Business plan and above).", href: "/features/whatsapp-api-and-webhooks" },
];

export const PARTNER_STEPS = [
  ["Tell us about your clients", "Who they are, how many, which industry and country, and what you want to sell them."],
  ["We agree the scope together", "Plans, pricing, and what you want under your own name. We tell you plainly what is available today and what we would build."],
  ["Start with a pilot", "We set up one to three client companies for you, with numbers, teams and the AI switched on as you choose."],
  ["Grow", "You bring clients; we run the platform, keep it updated and look after the WhatsApp infrastructure."],
] as const;

export const PARTNER_TOPICS = [
  "Your name on the sign-in page and in emails",
  "Your logo and colours",
  "Your own web address for your clients",
  "Separate pricing and invoicing for your clients",
  "A view across all of your clients",
  "Industry layers for specific clients",
];

export const PARTNER_FAQS = [
  { q: "What is included in a white-label partnership?", a: "The whole product: shared inbox, the AI assistant, the sales assistant, the pipeline, reports and the API, on the plans your clients need. What is branded, how it is priced and how clients are billed is agreed with our team for each partner." },
  { q: "Can my clients use my brand and my domain?", a: "That is part of the conversation. Partner setups are arranged with our team today, and we say exactly what we can do now and what we would build for you before you commit. Tell us what you need on the form." },
  { q: "Is each client's data kept separate?", a: "Yes. Every client is its own company, with its own conversations, contacts, numbers and team. One company can never read another's data." },
  { q: "Who sets up my clients?", a: "Our team creates each client's company, chooses the plan and switches on what you agreed. The client's owner then sets their own password from a single-use link." },
  { q: "Do my clients need the official WhatsApp Business API?", a: "No. Scriwo works with the WhatsApp numbers your clients already use, linked by scanning a QR code, like WhatsApp Web. It is independent and not affiliated with WhatsApp or Meta." },
  { q: "How much does it cost to become a partner?", a: "There is no fee to start the conversation. Partner pricing depends on the number of clients and what you want branded, and is agreed with us." },
];
