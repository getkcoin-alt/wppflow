// Scriwo Homes: Scriwo's AI CRM as an industry edition for property agencies, at homes.scriwo.com. It is the same product with the
// real-estate layer switched on and a property pipeline set up. Keep this to what is built and tested (docs/website-claims-audit.md,
// "Scriwo Homes"). Not built, so not here: calendar sync, automatic WhatsApp confirmations, Property Finder or Bayut import, Arabic
// screens. Never promise "100%" or a guarantee about data or outcomes: say what the product does and what the customer is responsible for.

export const HOMES = {
  appUrl: "https://homes.scriwo.com",
  eyebrow: "Scriwo Homes · AI CRM for real estate",
  title: "The AI CRM built for property agencies",
  intro:
    "Scriwo's AI CRM, now as an industry edition for real estate. Buyers and renters are qualified on WhatsApp, every lead has an owner and a next step, listings are matched by rule, viewings are booked, and managers see the enquiries nobody answered. The same price as Scriwo, with more for property.",
};

export const HOMES_OFFER = {
  trial: "14 days free, then you choose",
  trialBody: "Sign up first, and your workspace starts on the Growth plan for 14 days with no card. Choose a plan inside the app when you are ready. After the trial it keeps working on the Free plan until you do; nothing is deleted.",
  same: "Same price, more for real estate",
  sameBody: "Scriwo Homes costs the same as Scriwo. The property layer, the property pipeline and the property assistant come with the Growth plan and above at no extra price.",
};

export const HOMES_LOST_LEAD = [
  "A buyer messages: \"2-bedroom in Dubai Marina, budget AED 1.8 million.\"",
  "The agent who got it is busy. Another agent does not know the lead exists.",
  "The buyer messages another agency. Nobody follows up.",
];

// What an agency gets, in the order a lead travels
export const HOMES_PROS = [
  { title: "Qualified before an agent types a word", body: "Riwo welcomes every new enquiry and asks your questions: buy, rent or sell, area, type and bedrooms, budget, timeline. The answers are kept exactly as the buyer said them." },
  { title: "A lead with an owner, instantly", body: "The enquiry opens in your property pipeline and is given to a consultant by your assignment rule, with a summary of what the buyer asked for." },
  { title: "Listings matched by rule, not by guesswork", body: "Only available listings that fit the budget, area, type and bedrooms are suggested. Each match says why it fits and what to check, and how many were left out and why. Arabic and English areas match each other." },
  { title: "Viewings that cannot clash", body: "A viewing is refused if the agent, the property or the client is already booked. It creates a reminder, a follow-up and a calendar file, and the time stays right across daylight-saving changes." },
  { title: "Managers see what slipped", body: "Six revenue-leak alerts find enquiries that went unanswered, leads that stalled and viewings with no follow-up. One alert per leak, and fixed leaks close themselves." },
  { title: "Honest numbers", body: "Open pipeline is labelled as what leads are marked at. Only deals you mark won are counted as revenue. Nothing is shown as revenue that is not." },
  { title: "Every automated message on record", body: "Which rule sent it, what started it, which AI model was involved and the exact words, in a record that cannot be edited. Customers are told when a reply is automated and can ask for a person." },
  { title: "Live in an afternoon", body: "Your workspace opens on the property dashboard with the pipeline ready. Each consultant links their own WhatsApp number by scanning a QR code, the way WhatsApp Web works." },
];

// What Riwo deliberately does not do, and why that is the point
export const HOMES_WONT = [
  { title: "Riwo does not decide the budget", body: "It asks the buyer, and records what they said. Whether a budget is realistic is a consultant's judgement." },
  { title: "Riwo does not close the deal", body: "It qualifies, prepares and hands over. The moment a buyer asks for prices, options or a proposal, your formal message goes out and a consultant takes the conversation." },
  { title: "Riwo does not state a price, availability or a return", body: "Those come only from your agency's verified data and your agents. The server rejects any figure the AI invents." },
  { title: "Riwo does not pretend to be a person", body: "Every automated message says so, and a buyer who writes \"human\" reaches your team at once." },
];

// What the agency can rely on, and what it is responsible for
export const HOMES_DATA = [
  "Each agency is its own company: its conversations, contacts, listings and leads cannot be read by any other.",
  "Access is by role and enforced on the server, so a consultant sees only their own chats and the ones assigned to them.",
  "Export everything at any time: contacts, conversations, who each chat is assigned to, the pipeline and its history, and the automated-message record.",
  "The automated-message record is tamper-evident: an edit or a missing row is detected when you check it.",
  "Passwords are never emailed, and API keys and webhooks are scoped and signed.",
];
export const HOMES_DATA_NOTE =
  "Once an export leaves Scriwo, protecting that copy is up to you: where you save it, who can open it and when you delete it. No software can promise perfection, so we show you exactly what we do and let you take your data away whenever you like.";

export const HOMES_STEPS = [
  ["Start your free trial", "Sign up first. Choose real estate, and your workspace opens on the property dashboard with the property pipeline already set up."],
  ["Link your agents' numbers", "Each consultant scans a QR code, the way WhatsApp Web works. No new number."],
  ["Switch on the property assistant", "Add a few sentences about your agency, or let Riwo read your website. Check the questions. Turn it on."],
  ["Choose your plan", "You have 14 days of the Growth plan, free. Choose a plan inside the app when you are ready."],
];

export const HOMES_FAQS = [
  { q: "Is this a different product from Scriwo?", a: "No. Scriwo Homes is Scriwo's AI CRM with the real-estate layer switched on and a property pipeline set up for you, on its own address. Everything in the main product is in it, at the same price." },
  { q: "How does the free trial work?", a: "You sign up first, with no card. Your workspace starts on the Growth plan for 14 days, and you choose a plan inside the app when you are ready." },
  { q: "What happens after the trial?", a: "Your workspace stays. Seven days after the trial ends, the paid features switch off and you have what the Free plan has, with nothing deleted. Choose a plan to switch them back on." },
  { q: "Does it cost more than Scriwo?", a: "No. The real-estate layer, the property pipeline and the property assistant come with the Growth plan and above at no extra price." },
  { q: "Does it connect to Property Finder, Bayut or my calendar?", a: "Not yet. Listings are added in Scriwo, and viewings produce a calendar file you can open anywhere. We will tell you when an integration is ready." },
  { q: "Is it the official WhatsApp Business API?", a: "No. Scriwo works with the WhatsApp numbers your agents already use, linked by scanning a QR code. It is independent and not affiliated with WhatsApp or Meta, and WhatsApp can restrict a number that behaves badly, so broadcasts go only to people who opted in." },
  { q: "Which languages does it work in?", a: "Riwo replies in the language the customer writes in, including Arabic and English, and listings are matched across Arabic and English. The screens are in English." },
];
