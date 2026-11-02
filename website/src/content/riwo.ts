// Riwo, the AI assistant inside the Scriwo inbox. Keep this in step with the app
// (src/components/user/Riwo.tsx and src/services/ai.ts in the dashboard).

export const RIWO = {
  name: "Riwo",
  oneLine: "Riwo is the AI assistant inside the Scriwo inbox. It prepares replies before you open the chat, polishes what you wrote, translates and sums up long chats, asks new customers your questions, and hands pricing and proposals to a person. By default a person reads and sends every message; automatic sending is optional and limited to safe cases.",
  plan: "Growth plan and above",
};

export const RIWO_ACTIONS = [
  {
    title: "Prepare the reply for you",
    body: "On the Today screen Riwo has already read the chats that are waiting and drafted a reply, with a one-line summary and the customer's mood. Read it, tap send, or edit it first.",
    options: ["Summary", "Mood", "Ready reply", "Morning brief"],
  },
  {
    title: "Draft a reply",
    body: "Riwo reads the conversation and writes a first reply in the tone you pick: Friendly, Professional or Short.",
    options: ["Friendly", "Professional", "Short"],
  },
  {
    title: "Improve your draft",
    body: "Type a rough answer and let Riwo tidy it up without changing what you meant.",
    options: ["Fix it up", "Shorter", "Friendlier", "More formal"],
  },
  {
    title: "Translate",
    body: "Turn your reply into the customer's language before you send it. Names, numbers and links stay exactly as they are.",
    options: ["Arabic", "Hindi", "Urdu", "Malayalam", "Tamil", "Telugu", "Bengali", "Gujarati", "Marathi", "Punjabi", "Kannada", "Tagalog", "French", "Russian", "English"],
  },
  {
    title: "Summarise the chat",
    body: "Picking up a long conversation from a teammate? Riwo sums it up in under 100 words: who the customer is, what they want and what was promised.",
    options: ["Under 100 words"],
  },
] as const;

export const RIWO_STEPS = [
  "Open Today, or any chat in the inbox.",
  "Read the reply Riwo prepared, or tap Ask Riwo next to the message box and choose what you need.",
  "Change anything you like.",
  "Press send yourself. Riwo sends on its own only if an owner has switched on Autopilot or the Sales assistant, and only in the safe cases described below.",
];

// What Riwo can do without being asked each time. Every one is off until an owner turns it on.
export const RIWO_AUTOMATIC = [
  {
    title: "Autopilot",
    body: "Answers a customer with one of your own saved replies, word for word, when it fully answers the question, and clears the thank-yous. Never in groups, never when the customer sounds unhappy, never in a chat your team is handling. Every action is listed and can be undone.",
    href: "/features/riwo-autopilot",
  },
  {
    title: "Sales assistant",
    body: "Welcomes new customers, asks your discovery questions, keeps the answers, and when they ask for pricing or a proposal sends your formal message, hands the chat to an executive and adds the customer to your pipeline.",
    href: "/features/ai-sales-assistant",
  },
  {
    title: "Welcome people from abroad",
    body: "Greets a number from another country, asks where they found you, and lets Riwo answer short questions from text you wrote, until a teammate replies.",
    href: "/features/ai-sales-assistant",
  },
];

export const RIWO_FAQS = [
  { q: "What is Riwo?", a: RIWO.oneLine },
  { q: "Does Riwo send messages by itself?", a: "Not unless you ask it to. By default Riwo only writes a draft, and a person reads it, edits it and presses send. An owner can switch on Autopilot (it can only send your own saved replies, word for word, in safe cases) or a Sales assistant rule (it asks your questions and answers short questions from what you wrote about your business). Both are off until switched on, and pricing and proposals are always handed to a person." },
  { q: "Will customers know they are talking to an assistant?", a: "Yes. Everything Riwo sends ends with a short line saying it is an automated reply and that the customer can write \"human\" to reach a person. When they do, Riwo stops, your team is notified and the chat goes to the top of Today." },
  { q: "Can Riwo quote a price?", a: "No. A request for pricing, a quote or a proposal is recognised by a word list, in English, Arabic, Hindi and Hinglish, before the AI is asked. The customer gets your formal message that an executive is on it, and your team gets the requirements the customer shared. Riwo also cannot repeat a price, link or phone number that is not in text you wrote." },
  { q: "Can Riwo learn about my business from my website?", a: "Yes. In the Sales assistant, enter your website address and Riwo reads your public pages and drafts what it may say about your business, and suggests questions to ask. You read and edit it before it is used. Prices on the page are left out." },
  { q: "Which languages does Riwo understand?", a: "Riwo replies in the language and script the customer used most recently, including English, Arabic, Hindi, Hinglish, Urdu and Tamil, and it can translate your reply into 15 languages." },
  { q: "Which plans include Riwo?", a: "Riwo is included in the Growth, Business and Enterprise plans. Company owners can switch it off, and each company has a daily allowance." },
  { q: "Is our chat data safe with Riwo?", a: "Riwo sees a chat only to prepare or write a reply for it, or when a rule you switched on is talking to that customer. Customer messages are treated as data, never as instructions, so a message cannot trick Riwo into doing something else. Riwo runs on several AI services, and some free services may keep what they are sent. Owners can switch on Private mode to limit Riwo to services that do not keep messages, or switch Riwo off for the company." },
];
