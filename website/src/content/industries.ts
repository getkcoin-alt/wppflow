export type Industry = {
  slug: string;
  name: string;
  keyword: string;
  title: string;
  intro: string;
  problems: string[];
  workflow: { title: string; body: string }[];
  tip: string;
  features: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "real-estate",
    name: "Real estate",
    keyword: "WhatsApp CRM for real estate",
    title: "WhatsApp CRM for real estate agencies in Dubai and India",
    intro:
      "Property enquiries arrive on WhatsApp at all hours, from portals, ads and referrals, and each agent works them on their own phone. Scriwo puts every agent's chats in front of the manager, so leads are followed up and never vanish when an agent moves on.",
    problems: [
      "Leads sit unanswered on an agent's phone while they are at a viewing.",
      "When an agent leaves, their client conversations leave with them.",
      "Managers cannot see which enquiries were followed up.",
    ],
    workflow: [
      { title: "Every agent links their number", body: "Agents keep using their own WhatsApp. The brokerage sees every conversation in one inbox." },
      { title: "Reassign while on a viewing", body: "If an agent is busy, the manager assigns the chat to someone free in one click." },
      { title: "Notes on each lead", body: "Budget, preferred area, viewing time: kept as a private note on the chat, never sent to the client." },
    ],
    tip: "In Dubai, buyers often compare three or four agencies in the same hour. Reply to a portal lead inside five minutes and you are usually the first, not the fourth.",
    features: ["multiple-whatsapp-numbers", "chat-assignment", "private-notes-and-mentions"],
  },
  {
    slug: "clinics-and-healthcare",
    name: "Clinics and healthcare",
    keyword: "WhatsApp for clinics",
    title: "WhatsApp for clinics, dental and aesthetic centres",
    intro:
      "Patients book, reschedule and ask questions on WhatsApp. Scriwo lets the front desk share the load, keeps clinical staff out of the noise, and shows the owner every conversation.",
    problems: [
      "One reception phone, five people trying to answer it.",
      "Appointment questions get lost between shifts.",
      "No record of who told the patient what.",
    ],
    workflow: [
      { title: "Shared front desk", body: "Reception staff work the same inbox from their own logins and see who is handling each patient." },
      { title: "Quick answers", body: "Saved replies for timings, location, prices and preparation instructions." },
      { title: "Audit trail", body: "Owners can see who replied and when." },
    ],
    tip: "Keep medical advice out of WhatsApp. Use it for bookings and logistics, and ask patients to discuss symptoms in person or on a call.",
    features: ["whatsapp-team-inbox", "whatsapp-automation", "security-and-roles"],
  },
  {
    slug: "education-and-coaching",
    name: "Education and coaching",
    keyword: "WhatsApp for coaching institutes",
    title: "WhatsApp for schools, coaching institutes and training centres",
    intro:
      "Admissions counsellors handle hundreds of parent and student enquiries in peak season. Scriwo gives each counsellor their own number in one shared view, so the admissions head can see every lead and every follow-up.",
    problems: ["Peak-season enquiry spikes.", "Counsellors working from personal phones.", "No view of which leads converted."],
    workflow: [
      { title: "Counsellor inboxes", body: "Each counsellor links their number; the admissions head sees all chats." },
      { title: "Broadcast to opted-in parents", body: "Batch timings, results and fee reminders to people who asked to hear from you." },
      { title: "CSV in and out", body: "Move enquiry lists between Scriwo and your spreadsheet." },
    ],
    tip: "In India, parents often message on behalf of students. Save both as contacts and note who the decision maker is.",
    features: ["multiple-whatsapp-numbers", "whatsapp-broadcast", "whatsapp-contacts-crm"],
  },
  {
    slug: "travel-agencies",
    name: "Travel agencies and tour operators",
    keyword: "WhatsApp CRM for travel agency",
    title: "WhatsApp CRM for travel agencies and tour operators",
    intro:
      "Travellers ask for quotes, change dates and need help mid-trip, all on WhatsApp. Scriwo lets sales, operations and drivers' coordinators share conversations without sharing phones.",
    problems: ["Quotes chased across several phones.", "Mid-trip issues land with whoever is awake.", "No handover between sales and operations."],
    workflow: [
      { title: "Sales to operations handover", body: "Assign the chat to operations once the trip is booked, with a private note of the itinerary." },
      { title: "@mention for help", body: "Pull in a colleague who knows the destination." },
      { title: "Seasonal broadcasts", body: "Tell opted-in past travellers about Diwali, Eid or winter packages." },
    ],
    tip: "Travellers from the UAE to India often plan around long weekends and Eid. Ask for travel dates in your first reply.",
    features: ["chat-assignment", "private-notes-and-mentions", "whatsapp-broadcast"],
  },
  {
    slug: "ecommerce-and-d2c",
    name: "E-commerce and D2C brands",
    keyword: "WhatsApp support for ecommerce",
    title: "WhatsApp customer support for e-commerce and D2C brands",
    intro:
      "Order status, returns, sizes and cash-on-delivery confirmations: customers expect answers on WhatsApp. Scriwo gives your support team a shared queue with clear ownership.",
    problems: ["Repeated 'where is my order' questions.", "Support split across several numbers.", "No way to see response times by agent."],
    workflow: [
      { title: "Automate the repeats", body: "Keyword replies for delivery times, return policy and size guides." },
      { title: "Assign and resolve", body: "Each ticket-like chat has an owner and is marked resolved when done." },
      { title: "API and webhooks", body: "Connect your store or order system with scoped API keys and signed webhooks." },
    ],
    tip: "Confirm cash-on-delivery orders on WhatsApp before dispatch. It is one of the simplest ways Indian D2C brands cut returns.",
    features: ["whatsapp-automation", "chat-assignment", "whatsapp-api-and-webhooks"],
  },
  {
    slug: "automobile-dealers",
    name: "Automobile dealers",
    keyword: "WhatsApp for car dealers",
    title: "WhatsApp for car dealers, showrooms and service centres",
    intro:
      "Test drive requests, service bookings and price negotiations happen on WhatsApp. Scriwo keeps every sales consultant's chats visible to the showroom manager.",
    problems: ["Consultants move between showrooms.", "Service reminders sent by hand.", "Leads not followed up after the test drive."],
    workflow: [
      { title: "Consultant numbers in one view", body: "The manager sees every customer chat across the showroom." },
      { title: "Notes for each buyer", body: "Model, finance needs and trade-in, kept as private notes." },
      { title: "Service reminders", body: "Broadcast reminders to opted-in owners." },
    ],
    tip: "Send the brochure and on-road price in the first reply. Buyers in both markets compare dealers before they visit.",
    features: ["multiple-whatsapp-numbers", "private-notes-and-mentions", "whatsapp-broadcast"],
  },
  {
    slug: "jewellery-and-retail",
    name: "Jewellery and retail",
    keyword: "WhatsApp for jewellery shops",
    title: "WhatsApp for jewellery stores and premium retail",
    intro:
      "Customers ask for designs, gold rates and custom orders on WhatsApp, often from the salesperson they met in store. Scriwo keeps those relationships with the business.",
    problems: ["Client relationships tied to one salesperson's phone.", "Custom orders tracked in personal chats.", "No visibility for the owner."],
    workflow: [
      { title: "Salesperson numbers, owner view", body: "Staff keep their personal touch; the owner sees every conversation." },
      { title: "Order notes", body: "Specifications and deadlines saved privately on the chat." },
      { title: "Festive campaigns", body: "Akshaya Tritiya, Diwali, Eid and wedding-season messages to opted-in clients." },
    ],
    tip: "Gold-rate questions spike on festival mornings. A keyword reply with the day's rate saves hours.",
    features: ["multiple-whatsapp-numbers", "whatsapp-automation", "whatsapp-broadcast"],
  },
  {
    slug: "insurance-and-finance",
    name: "Insurance and financial services",
    keyword: "WhatsApp CRM for insurance agents",
    title: "WhatsApp CRM for insurance and financial advisers",
    intro:
      "Renewals, documents and claims updates go back and forth on WhatsApp. Scriwo gives the agency oversight, an audit log and clean handovers.",
    problems: ["Renewals missed when an adviser is away.", "No oversight of what was promised to clients.", "Sensitive conversations on unmanaged phones."],
    workflow: [
      { title: "Audit log", body: "Who did what, and when, for every important action." },
      { title: "Roles", body: "Advisers see their own clients and anything assigned to them; managers see all." },
      { title: "Reassign renewals", body: "Cover for an adviser who is on leave in one click." },
    ],
    tip: "Never ask for card numbers or passwords on WhatsApp. Send a secure link from your own system instead.",
    features: ["security-and-roles", "chat-assignment", "multiple-whatsapp-numbers"],
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
