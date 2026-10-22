export type Post = {
  slug: string;
  title: string;
  description: string;
  keyword: string;
  published: string;
  updated?: string;
  readingMinutes: number;
  /** One-paragraph direct answer at the top: what answer engines quote. */
  answer: string;
  sections: { heading: string; body: string[]; list?: string[] }[];
  related: string[];
};

export const POSTS: Post[] = [
  {
    slug: "how-to-manage-whatsapp-for-a-sales-team",
    title: "How to manage WhatsApp for a sales team (without sharing one phone)",
    description: "A practical setup for UAE and Indian sales teams: one login per person, owner visibility, assignment and handovers.",
    keyword: "manage WhatsApp for sales team",
    published: "2026-10-22",
    readingMinutes: 6,
    answer:
      "Give every salesperson their own login and let them link their own WhatsApp number to a shared inbox. The manager sees every chat, assigns leads to whoever is free, and the team leaves private notes on each conversation. Leads stop disappearing when someone is busy, on leave, or leaves the company.",
    sections: [
      {
        heading: "Why the shared office phone stops working",
        body: [
          "Most teams start with one phone on the front desk, or one number logged into WhatsApp Web on several computers. It is free and it works for a while.",
          "Then two people reply to the same customer with different prices, a lead waits overnight because everyone thought someone else had it, and nobody can say who promised what.",
        ],
      },
      {
        heading: "The setup that scales",
        body: ["The pattern we see working across brokerages in Dubai and institutes in Pune is the same:"],
        list: [
          "One login per person. Nobody shares passwords or passes phones around.",
          "Each salesperson links the number customers already know, by scanning a QR code.",
          "The owner or manager sees every conversation from every number in one inbox.",
          "Every chat has an owner. Reassign it in one click when someone is at a viewing or on leave.",
          "Context lives on the chat as private notes, not in a separate WhatsApp group.",
        ],
      },
      {
        heading: "Measure what matters",
        body: [
          "Track two things weekly: how quickly the first reply goes out, and how many chats are still unassigned at the end of the day. If both are falling, the system is working.",
        ],
      },
      {
        heading: "When someone leaves",
        body: [
          "Remove their number from the company. In Scriwo, that unlinks it from the phone and deletes its saved login, while the conversations stay with the business.",
        ],
      },
    ],
    related: ["chat-assignment", "multiple-whatsapp-numbers"],
  },
  {
    slug: "avoid-whatsapp-number-ban-broadcasts",
    title: "How to send WhatsApp broadcasts without getting your number banned",
    description: "Opt-in, pacing and content rules that keep business numbers healthy in India and the UAE.",
    keyword: "WhatsApp number banned broadcast",
    published: "2026-10-22",
    readingMinutes: 5,
    answer:
      "Message only people who opted in, send in small paced batches rather than all at once, keep each message relevant and personal, and stop immediately if many people block or report you. No tool can guarantee a number will never be restricted, but these habits make it far less likely.",
    sections: [
      {
        heading: "Why numbers get restricted",
        body: [
          "WhatsApp watches for behaviour that looks like spam: many messages to people who never saved your number, identical text sent at machine speed, and recipients who block or report you.",
        ],
      },
      {
        heading: "Five rules we build into Scriwo",
        body: [],
        list: [
          "Opt-in only. Scriwo sends broadcasts only to contacts marked as opted in.",
          "Pacing. Messages leave with delays between them, the way a person would send them.",
          "Relevance. Segment by what people asked about. A Diwali offer to last year's Diwali buyers, not to everyone.",
          "An easy way out. Tell people how to stop receiving messages, and honour it.",
          "Warm numbers. A new number should talk to customers normally for a while before it sends any campaign.",
        ],
      },
      {
        heading: "If a number is restricted",
        body: [
          "Stop all campaigns from it, follow WhatsApp's in-app review steps, and keep serving existing conversations from other teammates' numbers in the shared inbox.",
        ],
      },
    ],
    related: ["whatsapp-broadcast", "whatsapp-contacts-crm"],
  },
  {
    slug: "whatsapp-crm-for-real-estate-dubai",
    title: "WhatsApp CRM for real estate agents in Dubai: a practical playbook",
    description: "How Dubai brokerages respond to portal leads faster, hand over between agents and keep client history when agents move on.",
    keyword: "WhatsApp CRM real estate Dubai",
    published: "2026-10-22",
    readingMinutes: 7,
    answer:
      "Dubai brokerages win more portal leads by replying first on WhatsApp. Link every agent's number to a shared inbox, let the manager reassign leads when agents are at viewings, keep budget and area as private notes on each chat, and keep the history with the brokerage when an agent leaves.",
    sections: [
      {
        heading: "Speed wins in Dubai property",
        body: [
          "A buyer who enquires on a portal usually contacts several agencies at once. The first useful WhatsApp reply, with floor plans and a viewing slot, often wins the conversation.",
        ],
      },
      {
        heading: "The brokerage playbook",
        body: [],
        list: [
          "Every agent links their own number; the sales manager sees all chats.",
          "New portal leads are assigned within minutes. If the agent is at a viewing, reassign.",
          "Save budget, preferred community, bedrooms and move-in date as a private note.",
          "Use saved replies for brochures, payment plans and location pins.",
          "When an agent leaves, remove their number. Client conversations stay with the brokerage.",
        ],
      },
      {
        heading: "Off-plan launches",
        body: [
          "For launches, broadcast only to contacts who asked for off-plan updates, and pace the messages. Then work the replies as a team in the shared inbox.",
        ],
      },
    ],
    related: ["multiple-whatsapp-numbers", "chat-assignment", "private-notes-and-mentions"],
  },
  {
    slug: "whatsapp-response-time-benchmarks",
    title: "WhatsApp response time: what customers in the UAE and India expect",
    description: "Why first-reply time matters on WhatsApp, how to measure it and how teams bring it down.",
    keyword: "WhatsApp response time",
    published: "2026-10-22",
    readingMinutes: 4,
    answer:
      "On WhatsApp, customers expect a reply within minutes during business hours, not hours. Teams cut first-reply time by sharing one inbox across staff, assigning every new chat immediately, using saved replies for common questions and getting alerts when a linked phone goes offline.",
    sections: [
      {
        heading: "Why minutes matter",
        body: [
          "WhatsApp feels like a conversation, so people treat silence as a 'no'. A buyer who waits an hour has usually already spoken to someone else.",
        ],
      },
      {
        heading: "How to bring it down",
        body: [],
        list: [
          "Put every number in one shared inbox so no message waits on one busy phone.",
          "Assign new chats immediately, with a named owner.",
          "Use keyword automations for timings, location and price lists.",
          "Turn on desktop notifications and offline alerts.",
          "Cover evenings and weekends with a simple rota. Customers in the Gulf often message after work.",
        ],
      },
    ],
    related: ["whatsapp-team-inbox", "whatsapp-automation", "team-notifications"],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
