// Riwo, the AI assistant inside the Scriwo inbox. Keep this in step with the app
// (src/components/user/Riwo.tsx and src/services/ai.ts in the dashboard).

export const RIWO = {
  name: "Riwo",
  oneLine: "Riwo is the AI assistant inside the Scriwo inbox. It drafts replies, polishes what you wrote, translates and sums up long chats, and a person always reads and sends the message.",
  plan: "Growth plan and above",
};

export const RIWO_ACTIONS = [
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
  "Open any chat in the inbox.",
  "Tap Ask Riwo next to the message box and choose what you need.",
  "Riwo puts its draft in the message box. Read it, change anything you like.",
  "Press send yourself. Riwo never sends anything to a customer on its own.",
];

export const RIWO_FAQS = [
  { q: "What is Riwo?", a: RIWO.oneLine },
  { q: "Does Riwo send messages by itself?", a: "No. Riwo only writes a draft into the message box. A person on your team reads it, edits it if needed and presses send." },
  { q: "Which languages does Riwo understand?", a: "Riwo replies in the language and script the customer used most recently, including English, Arabic, Hindi, Hinglish, Urdu and Tamil, and it can translate your reply into 15 languages." },
  { q: "Which plans include Riwo?", a: "Riwo is included in the Growth, Business and Enterprise plans. Company owners can switch it off, and each company has a daily allowance." },
  { q: "Is our chat data safe with Riwo?", a: "Riwo only sees the chat you ask it about, only when you ask. Customer messages are treated as data, never as instructions, so a message cannot trick Riwo into doing something else." },
];
