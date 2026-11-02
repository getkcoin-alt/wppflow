// Scriwo Homes: Scriwo for property agencies, at homes.scriwo.com. It is the same product with the real-estate layer switched on
// and a property pipeline. Keep this to what is built and tested (docs/website-claims-audit.md, "Scriwo Real Estate"). Not
// built, so not here: calendar sync, automatic WhatsApp confirmations, Property Finder or Bayut import, Arabic screens.

export const HOMES = {
  appUrl: "https://homes.scriwo.com",
  eyebrow: "Scriwo Homes · For property agencies",
  title: "Every property enquiry captured, assigned, followed up and tracked",
  intro:
    "Scriwo Homes is the WhatsApp revenue system for property agencies. Buyers and renters are qualified on WhatsApp, every lead has an owner and a next step, and managers see which enquiries nobody has answered. We are onboarding our first agencies now.",
};

export const HOMES_LOST_LEAD = [
  "A buyer messages: \"2-bedroom in Dubai Marina, budget AED 1.8 million.\"",
  "The agent who got it is busy. Another agent does not know the lead exists.",
  "The buyer messages another agency. Nobody follows up.",
];

export const HOMES_FLOW = [
  { title: "Captured", body: "Riwo welcomes the buyer and asks your questions: buy, rent or sell, area, type and bedrooms, budget, timeline. The answers are kept, word for word." },
  { title: "Assigned", body: "A lead is opened in your property pipeline and given to a consultant by your assignment rule. They get a summary of what the buyer asked for." },
  { title: "Matched", body: "Listings that are available and fit the budget, area and bedrooms are suggested by rule, each with why it fits and what to check. Not by AI guesswork." },
  { title: "Booked", body: "Viewings that cannot clash for the agent, the property or the client, with a reminder, a follow-up and a calendar file." },
  { title: "Watched", body: "Revenue-leak alerts tell managers about enquiries that went unanswered, so nothing quietly disappears." },
];

export const HOMES_RULES = [
  { title: "The AI never invents a property fact", body: "Riwo cannot state a price, availability or a return. Pricing and proposals go to a person with a formal message. Anything about a listing comes only from approved, current agency data, and the server rejects a figure the AI made up." },
  { title: "Every automated message is on record", body: "What started it, which rule allowed it, which model was involved and the exact words, in a record that cannot be edited. Customers are told when a reply is automated and can ask for a person." },
  { title: "Your data is yours", body: "Export your contacts, conversations, assignments and pipeline at any time." },
];

export const HOMES_STEPS = [
  ["Create your workspace", "Sign up at homes.scriwo.com with Google or your email. It opens on your property hub with the property pipeline already set up."],
  ["Link your agents' numbers", "Each consultant scans a QR code, the way WhatsApp Web works. No new number."],
  ["Switch on the property assistant", "Add a few sentences about your agency, or let Riwo read your website. Check the questions. Turn it on."],
  ["Try everything for 14 days", "The trial includes the Growth plan. No card needed. We help your first agencies set up personally."],
];

export const HOMES_FAQS = [
  { q: "Is this a different product from Scriwo?", a: "No. Scriwo Homes is Scriwo with the real-estate layer switched on and a property pipeline set up for you, on its own address. Everything in the main product is in it." },
  { q: "What happens after the 14-day trial?", a: "Your workspace stays. Seven days after the trial ends, the paid features switch off and you have what the Free plan has, with nothing deleted. Choose a plan to switch them back on." },
  { q: "Does it connect to Property Finder, Bayut or my calendar?", a: "Not yet. Listings are added in Scriwo, and viewings produce a calendar file you can open anywhere. We will tell you when an integration is ready." },
  { q: "Is it the official WhatsApp Business API?", a: "No. Scriwo works with the WhatsApp numbers your agents already use, linked by scanning a QR code. It is independent and not affiliated with WhatsApp or Meta, and WhatsApp can restrict a number that behaves badly, so broadcasts go only to people who opted in." },
  { q: "Which languages does it work in?", a: "Riwo replies in the language the customer writes in, including Arabic and English, and listings are matched across Arabic and English. The screens are in English." },
];
