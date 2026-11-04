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
  sections: { heading: string; body: string[]; list?: string[]; links?: { label: string; href: string }[] }[];
  related: string[];
  /** Industry slugs and markets the guide speaks to, used to link it from those pages. */
  industries?: string[];
  country?: "UAE" | "India";
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
    industries: ["real-estate"],
    country: "UAE",
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
  {
    slug: "whatsapp-business-multiple-users",
    title: "WhatsApp Business with multiple users: the options for teams in 2026",
    description: "Can several staff use one WhatsApp Business number? The app's limits, the three real options for teams in the UAE and India, and what each costs.",
    keyword: "WhatsApp Business multiple users",
    published: "2026-10-22",
    readingMinutes: 6,
    answer:
      "The WhatsApp Business app lets one number run on the main phone plus up to four linked devices, but everyone shares the same chats with no assignment and no record of who replied. Teams have three options: share linked devices, move to a WhatsApp Business API platform that charges per message, or use a team inbox like Scriwo where each staff member links their own number and the owner sees every chat.",
    sections: [
      {
        heading: "What the WhatsApp Business app allows",
        body: [
          "One WhatsApp Business number can be open on the main phone and up to four linked devices, such as WhatsApp Web on office computers. It works for a two or three person shop.",
          "Past that, the gaps show. Every device sees every chat, nothing is assigned to anyone, replies are not tagged with who sent them, and linked devices log out if the main phone is not used for about 14 days.",
        ],
      },
      {
        heading: "Option 1: share the number on linked devices",
        body: ["Free and quick. Good for a small team at one desk."],
        list: [
          "Limited to five devices in total.",
          "Two people can answer the same customer at once.",
          "No way to tell who promised what, or who should follow up.",
          "When someone leaves, they can still have copies of every chat on their own devices.",
        ],
      },
      {
        heading: "Option 2: a WhatsApp Business API platform",
        body: [
          "Platforms such as Wati, Interakt and AiSensy put one official API number behind a team inbox, with templates, chatbots and campaigns.",
          "The trade-off is cost and setup: Meta's per-message charges apply on top of the platform fee, and the number goes through business verification. It suits high-volume notifications and marketing campaigns.",
        ],
      },
      {
        heading: "Option 3: a team inbox for the numbers you already use",
        body: [
          "This is how Scriwo works. Each staff member gets their own login and links their own WhatsApp number by scanning a QR code. The owner sees every conversation from every number in one inbox, and staff see only their own chats plus anything assigned to them.",
          "There are no per-message fees, chats can be assigned and resolved, notes stay private, and every reply shows who sent it. One account with one number is free; team plans start at AED 299 or ₹2,499 a month for three numbers.",
        ],
      },
      {
        heading: "Which one to choose",
        body: [],
        list: [
          "Two or three people at one desk: linked devices on the Business app are fine.",
          "Thousands of automated notifications a day: an API platform.",
          "A sales or support team where each person talks to their own customers: a team inbox like Scriwo.",
        ],
      },
    ],
    related: ["multiple-whatsapp-numbers", "whatsapp-team-inbox", "chat-assignment"],
  },
  {
    slug: "best-whatsapp-crm-uae-india",
    title: "How to choose the best WhatsApp CRM in the UAE and India",
    description: "A buyer's checklist for WhatsApp CRMs in Dubai, Abu Dhabi, Mumbai, Delhi and Bengaluru: connection type, message fees, team controls, data and price.",
    keyword: "best WhatsApp CRM UAE India",
    published: "2026-10-22",
    updated: "2026-11-04",
    readingMinutes: 6,
    answer:
      "The best WhatsApp CRM depends on how your team uses WhatsApp. If you send automated campaigns from one official number, pick an API platform and budget for Meta's per-message fees. If your staff sell and support customers from their own numbers, pick a team inbox like Scriwo with per-person logins, chat assignment, owner visibility and no per-message fees. Check the price in AED or INR, the free plan and how fast you can go live.",
    sections: [
      {
        heading: "Start with how your team uses WhatsApp",
        body: [
          "In Dubai real estate, Indian coaching institutes and retail across both countries, customers already have a salesperson's personal WhatsApp number. Replacing those numbers with one official sender changes how customers reach you.",
          "If most of your messages are order updates, OTPs or campaigns, an official API number is the right base. If most are conversations, keep the numbers and add a shared inbox on top.",
        ],
      },
      {
        heading: "The checklist",
        body: [],
        list: [
          "Connection: official API number, or your team's existing numbers linked by QR code?",
          "Message fees: are Meta's per-message charges billed on top of the plan?",
          "Team controls: one login per person, chat assignment, private notes, roles and an audit log.",
          "Owner visibility: can a manager see every staff number in one place?",
          "Offboarding: when someone leaves, can you remove their access and keep the history?",
          "Price in local currency: clear AED and INR pricing, VAT or GST shown separately.",
          "Free plan: can you try it with one number before you commit?",
          "Time to go live: minutes with a QR code, or days of verification?",
        ],
      },
      {
        heading: "Where Scriwo fits",
        body: [
          "Scriwo is a team inbox for the WhatsApp numbers your staff already use, built for companies in the UAE and India. It is free for one account with one number, and team plans start at AED 299 or ₹2,499 a month with no per-message fees.",
          "It is not the WhatsApp Business API, so it does not offer a green tick or approved template campaigns. If you need those, an API platform is the better fit.",
        ],
      },
      {
        heading: "Prove the workflow before choosing a plan",
        body: ["Test an enquiry from another number, a delivered human reply, a private note and a handover to a teammate using their own login. A connected phone alone does not prove that your team can handle customers together. Check what an agent can see separately from what an owner can see.", "For property agencies, test the qualification, listing and viewing workflow. For a dealership, confirm how your team will record vehicle requirements and requested test drives. Do not assume that a general inbox includes a portal feed or inventory integration."],
        links: [
          { label: "Run the WhatsApp CRM trial checklist", href: "/blog/test-whatsapp-crm-before-buying" },
          { label: "See current plans and limits", href: "/pricing" },
          { label: "Review access controls and security", href: "/security" },
          { label: "Explore the property-agency edition", href: "/homes" },
        ],
      },
    ],
    related: ["whatsapp-team-inbox", "whatsapp-contacts-crm", "security-and-roles"],
  },
  {
    slug: "whatsapp-customer-service-ramadan-uae",
    title: "WhatsApp customer service during Ramadan: a playbook for UAE teams",
    description: "How UAE businesses keep WhatsApp replies fast during Ramadan: shorter working hours, evening peaks, Eid offers and respectful broadcasts.",
    keyword: "WhatsApp customer service Ramadan UAE",
    published: "2026-10-23",
    readingMinutes: 5,
    answer:
      "During Ramadan, UAE working hours are shorter and customers message most after iftar and late into the evening. Keep WhatsApp replies fast by moving cover to the evening, assigning every new chat to a named person, using saved replies for timings and Eid offers, and only broadcasting to contacts who opted in.",
    sections: [
      {
        heading: "What changes in Ramadan",
        body: [
          "Office hours in the UAE are usually shortened during Ramadan, while customers shift their shopping, viewings and appointments to the evening. Messages pile up after iftar, exactly when a small team is off shift.",
        ],
      },
      {
        heading: "Set the team up before the month starts",
        body: [],
        list: [
          "Agree an evening rota so someone covers the hours after iftar.",
          "Put every number in one shared inbox so the person on shift sees every customer, not just their own.",
          "Assign each new chat to a named person, and hand over open chats at the end of each shift.",
          "Save replies for Ramadan timings, delivery cut-offs and Eid offers so everyone answers the same way.",
          "Turn on desktop alerts and the offline alert so a phone that dies does not go unnoticed.",
        ],
      },
      {
        heading: "Broadcasts with care",
        body: [
          "Ramadan and Eid greetings are welcome when they are short and sent only to customers who agreed to hear from you. Space messages out, avoid sending during iftar, and never buy or scrape lists: that is the fastest way to get a number restricted.",
        ],
      },
      {
        heading: "Let Riwo help with the volume",
        body: [
          "On busy evenings, Riwo can draft a first reply in Arabic or English for a teammate to check and send, and sum up a long chat when a customer comes back after a few days.",
        ],
      },
    ],
    related: ["whatsapp-team-inbox", "chat-assignment", "whatsapp-broadcast"],
    country: "UAE",
    industries: ["ecommerce-and-d2c", "jewellery-and-retail", "travel-agencies"],
  },
  {
    slug: "festive-season-whatsapp-broadcasts-india",
    title: "Diwali and festive season WhatsApp broadcasts: an opt-in playbook for Indian businesses",
    description: "Send Diwali, Navratri and wedding season offers on WhatsApp without risking your number: opt-in, timing, segmentation and follow-up.",
    keyword: "Diwali WhatsApp broadcast",
    published: "2026-10-23",
    readingMinutes: 5,
    answer:
      "Festive offers work on WhatsApp when they go only to customers who opted in, are split into small relevant groups, are spaced out with delays between messages, and every reply is picked up quickly by a named person. Blasting a bought list before Diwali is the quickest way to get a number restricted.",
    sections: [
      {
        heading: "Start with permission",
        body: [
          "Ask customers to opt in at the counter, on your website, or on the invoice, and record it. India's Digital Personal Data Protection Act 2023 expects clear consent and an easy way to withdraw it, and WhatsApp itself restricts numbers that people report as spam.",
        ],
      },
      {
        heading: "Plan the festive calendar",
        body: [],
        list: [
          "Navratri and Dussehra: early-bird offers and new arrivals.",
          "Dhanteras and Diwali: gold rates, gift sets, delivery cut-off dates.",
          "Wedding season: appointment slots, catalogues and payment plans.",
          "After the festival: thank-you messages and service reminders, not more discounts.",
        ],
      },
      {
        heading: "Send in small, relevant groups",
        body: [
          "Tag contacts by what they bought or asked about, and send each group one short, useful message. A jeweller's gold-coin buyers and bridal customers want different offers. Keep delays between messages so sending looks like a person, not a machine.",
        ],
      },
      {
        heading: "Be ready for the replies",
        body: [
          "A broadcast creates conversations. Make sure replies land in a shared inbox, get assigned straight away, and that saved replies cover price, stock and delivery questions. Riwo can draft answers in Hindi, Gujarati, Marathi, Tamil and more for staff to check and send.",
        ],
      },
    ],
    related: ["whatsapp-broadcast", "whatsapp-contacts-crm", "whatsapp-automation"],
    country: "India",
    industries: ["jewellery-and-retail", "ecommerce-and-d2c"],
  },
  {
    slug: "dpdp-act-whatsapp-marketing-consent-india",
    title: "India's DPDP Act and WhatsApp: what businesses should do about consent",
    description: "A plain-language checklist for Indian businesses that message customers on WhatsApp under the Digital Personal Data Protection Act 2023.",
    keyword: "DPDP Act WhatsApp consent",
    published: "2026-10-23",
    readingMinutes: 6,
    answer:
      "Under India's Digital Personal Data Protection Act 2023, businesses should collect customer phone numbers for a stated purpose, get clear consent before sending marketing messages, let people withdraw that consent as easily as they gave it, keep the data secure and delete it when it is no longer needed. This is general information, not legal advice.",
    sections: [
      {
        heading: "Why it matters for WhatsApp",
        body: [
          "A phone number and a chat history are personal data. If your staff message customers on WhatsApp, your business decides why and how that data is used, which makes it responsible under the Act.",
        ],
      },
      {
        heading: "A practical checklist",
        body: [],
        list: [
          "Tell customers why you collect their number and what you will send them.",
          "Record opt-in before sending offers or broadcasts, and keep the record.",
          "Honour 'stop' or opt-out requests straight away, on every number your team uses.",
          "Limit who can see which chats: staff see their own, owners see everything.",
          "Keep an audit trail of important actions, and remove staff access when they leave.",
          "Delete contacts you no longer need, and name a person customers can contact about their data.",
        ],
      },
      {
        heading: "How Scriwo helps",
        body: [
          "Scriwo records opt-in on contacts and sends broadcasts only to people who opted in. Roles are enforced on the server, important actions go into an audit log, and removing a staff member's number unlinks it and deletes its saved login. You still decide your own policies; these tools make them easier to follow.",
        ],
      },
    ],
    related: ["security-and-roles", "whatsapp-broadcast", "whatsapp-contacts-crm"],
    country: "India",
  },
  {
    slug: "whatsapp-for-clinics-uae",
    title: "WhatsApp for clinics in the UAE: appointments, reminders and patient privacy",
    description: "How clinics in Dubai, Abu Dhabi and Sharjah run front-desk WhatsApp as a team without losing bookings or oversharing patient details.",
    keyword: "WhatsApp for clinics UAE",
    published: "2026-10-23",
    readingMinutes: 5,
    answer:
      "Clinics in the UAE use WhatsApp for bookings, reminders and directions. Run it as a team: put every front-desk number in one shared inbox, assign each patient chat, keep clinical details out of broadcasts, leave internal notes privately, and make sure only the staff who need a chat can see it.",
    sections: [
      {
        heading: "Where front desks lose patients",
        body: [
          "One reception phone, several receptionists and doctors who also reply from their own numbers: messages get missed, two people confirm different slots, and nobody can see what was promised.",
        ],
      },
      {
        heading: "A better front-desk setup",
        body: [],
        list: [
          "Link every front-desk and doctor number to one inbox so the clinic manager sees every booking chat.",
          "Assign each new patient chat to a named receptionist.",
          "Use saved replies for timings, location, parking and insurance questions.",
          "Keep notes about the patient private to the team; the patient never sees them.",
          "Use keyword automations for 'timings' or 'location' outside working hours.",
        ],
      },
      {
        heading: "Privacy first",
        body: [
          "Health information is sensitive. Keep diagnoses and test results out of broadcasts, share them only with the patient, and limit which staff can see which chats. Roles in Scriwo are enforced on the server, and every important action is logged.",
        ],
      },
    ],
    related: ["whatsapp-team-inbox", "chat-assignment", "security-and-roles"],
    country: "UAE",
    industries: ["clinics-and-healthcare"],
  },
  {
    slug: "whatsapp-crm-for-real-estate-india",
    title: "WhatsApp CRM for real estate in India: from portal lead to site visit",
    description: "How Indian brokers and developers in Mumbai, Bengaluru, Pune and Delhi NCR handle portal leads, site visits and follow-ups on WhatsApp as a team.",
    keyword: "WhatsApp CRM real estate India",
    published: "2026-10-23",
    readingMinutes: 6,
    answer:
      "Indian real estate teams win on speed: the first broker to send a floor plan and a site-visit slot on WhatsApp usually gets the visit. A WhatsApp CRM puts every broker's number in one inbox, assigns each portal lead within minutes, keeps notes on budget and possession timelines, and lets the owner see every conversation, including when a broker leaves.",
    sections: [
      {
        heading: "Why leads go cold",
        body: [
          "Leads from property portals and ads arrive on several brokers' phones. Some are answered in minutes, some the next day, and when a broker leaves, the buyer conversations leave with their phone.",
        ],
      },
      {
        heading: "The setup that works",
        body: [],
        list: [
          "Each broker links their own WhatsApp number; the owner sees every chat in one place.",
          "New portal leads are assigned to whoever is free, not whoever saw them first.",
          "Private notes record budget, preferred locality, loan status and possession timeline.",
          "Saved replies carry brochures, price sheets, RERA details and location pins.",
          "Broadcasts announce new launches only to buyers who opted in.",
        ],
      },
      {
        heading: "Follow-ups that do not slip",
        body: [
          "Most deals need several touches after the site visit. With every chat assigned and searchable, a manager can see which buyers have gone quiet and reassign them. Riwo can sum up a long chat so the next broker picks up without asking the buyer to repeat themselves.",
        ],
      },
    ],
    related: ["chat-assignment", "multiple-whatsapp-numbers", "private-notes-and-mentions"],
    country: "India",
    industries: ["real-estate"],
  },
  {
    slug: "test-whatsapp-crm-before-buying",
    title: "How to test a WhatsApp CRM before you buy: a team checklist",
    description: "Test connection, incoming messages, delivery receipts, staff visibility and handover with a real enquiry before choosing a WhatsApp CRM plan.",
    keyword: "WhatsApp CRM trial checklist",
    published: "2026-11-04",
    readingMinutes: 5,
    answer: "Test a WhatsApp CRM with an enquiry from a second number, a human reply, a private note and a teammate handover. Confirm that the reply reaches the phone, the note stays internal and staff see only the conversations their role permits. A connected number or an AI-generated draft alone does not prove the workflow works.",
    sections: [
      {
        heading: "Prepare a small test before importing your customers",
        body: ["Choose one company-controlled WhatsApp number, a second number whose owner agrees to help, and one teammate. Use a fictional enquiry such as a request for opening hours. Do not upload a customer list or turn on campaigns just to evaluate the inbox.", "Write down the job you need the CRM to do: assign enquiries while an agent is busy, remember a promised callback, or give a manager visibility. Pick one job for the first session. A feature tour is less useful than completing that job."],
        links: [{ label: "See Scriwo's shared team inbox", href: "/features/whatsapp-team-inbox" }],
      },
      {
        heading: "Connect, receive and reply",
        body: ["Create a workspace and link a number using the connection method the provider supports. Scriwo uses a linked-device connection like WhatsApp Web; it is not the official WhatsApp Business API. Keep the phone available and follow the instructions in Numbers.", "Ask the helper to send an enquiry from the second number. Open it in the inbox, type a reply and check the helper's phone. Distinguish a queued send, a sent message and a delivered message. A delivery receipt is stronger evidence than a button that merely accepted a request; it still does not mean the person read or acted on the message.", "If nothing arrives, confirm the linked number is connected and check the displayed error before retrying. Do not repeatedly resend an uncertain message. In Scriwo, first-enquiry setup completes after a human reply is marked delivered or read, rather than after a note or automatic reply."],
      },
      {
        heading: "Prove the team controls with two separate logins",
        body: ["On a plan that supports teammates, invite the helper and ask them to sign in separately. Assign the test chat to them and confirm they can open it. Sign in as an agent rather than an owner for this check: an owner's broad access cannot prove staff restrictions work.", "Scriwo staff see their own number's chats plus chats assigned to them. Owners and administrators see company chats. Use the test to confirm the arrangement matches your business, especially if staff use numbers containing personal conversations.", "Add a private note saying this is an internal handover test. Check the helper's customer phone: the note must not appear there. Then ask the teammate to reply and resolve the conversation."],
        links: [{ label: "Private notes and mentions", href: "/features/private-notes-and-mentions" }, { label: "Roles, access and security", href: "/security" }],
      },
      {
        heading: "Check the next day's work, not only the first reply",
        body: ["If the plan includes a pipeline, add a lead from the chat and create a follow-up. Check who owns it and where it appears. Reopen the conversation after signing out and back in: the context should still be there.", "For a property agency, try a listing and a viewing using test details. Check an intentional booking conflict and make sure a requested meeting is not being presented as a confirmed calendar appointment. Scriwo Homes has viewing tools; a general workflow meeting request is a follow-up request, not external calendar availability."],
        links: [{ label: "Sales pipeline and follow-ups", href: "/features/whatsapp-sales-pipeline" }, { label: "Scriwo Homes for property agencies", href: "/homes" }],
      },
      {
        heading: "Decide using evidence from the trial",
        body: ["Record what worked, what failed, how long setup took and what required help. Compare plan limits, ongoing cost, available history and export options before paying. A trial is useful even if it shows that another connection model suits you better.", "Scriwo offers a no-card 14-day Growth trial with up to three linked numbers. Paid Growth has its own number limit; the trial allowance and the paid plan are not identical. The Free plan is for one account and one number. Check the current pricing page for entitlements, taxes and billing options."],
        links: [{ label: "Current Scriwo plans and trial details", href: "/pricing" }, { label: "What the Free plan includes", href: "/free-whatsapp-crm" }],
      },
    ],
    related: ["whatsapp-team-inbox", "chat-assignment", "private-notes-and-mentions"],
  },
  {
    slug: "whatsapp-car-dealership-lead-follow-up",
    title: "WhatsApp lead follow-up for car dealerships: enquiry to test drive",
    description: "A practical dealership workflow for assigning WhatsApp enquiries, recording vehicle requirements, arranging test drives and following up without losing context.",
    keyword: "WhatsApp for car dealerships",
    published: "2026-11-04",
    readingMinutes: 5,
    industries: ["automobile-dealers"],
    answer: "Give each dealership WhatsApp enquiry an owner, record the vehicle and buying requirements, agree the next step and create a follow-up. Keep availability, quotations and finance decisions with authorised staff. A shared inbox helps salespeople hand over the conversation; a pipeline makes an unanswered enquiry or overdue callback visible to the manager.",
    sections: [
      {
        heading: "Capture the enquiry without asking the buyer to start again",
        body: ["A buyer may ask about a vehicle they saw online, send a photo or return to an older conversation. Read the existing chat before asking questions. Record whether they want a new or used vehicle, the model or body type, budget range, location, timeframe and whether a trade-in is involved.", "Collect only information needed for the next step. An early WhatsApp enquiry is not the place to request identity documents or detailed financial records. If finance is discussed, move any application into the dealership's approved process; a chat assistant should not promise approval."],
      },
      {
        heading: "Give the conversation to one salesperson",
        body: ["Assign an owner as soon as the enquiry arrives. If the person who owns that WhatsApp number is occupied, hand the chat to an available teammate rather than leaving two people to assume the other will answer.", "An internal handover note can be simple: 'Asked about a used automatic SUV; wants to visit Saturday; check current stock before quoting.' Label those details as the buyer's stated requirements, not verified availability. In Scriwo, private notes stay inside the team inbox and are not sent to the customer."],
        links: [{ label: "Chat assignment for a sales team", href: "/features/chat-assignment" }, { label: "Private notes for handovers", href: "/features/private-notes-and-mentions" }],
      },
      {
        heading: "Confirm the vehicle and test-drive arrangements yourself",
        body: ["Have an authorised employee confirm that the vehicle is still available, the specification is correct and the quoted price is current. Include the quotation's scope and any conditions using the dealership's approved wording.", "Agree a test-drive time through your existing booking process. Save the agreed next step on the lead and create a reminder. Scriwo's general sales pipeline records leads and follow-ups; it does not provide a dealership inventory feed or a dedicated test-drive booking integration. Do not treat a follow-up task as proof that a vehicle or appointment has been reserved."],
        links: [{ label: "WhatsApp sales pipeline", href: "/features/whatsapp-sales-pipeline" }],
      },
      {
        heading: "Use AI to prepare, and people to confirm",
        body: ["Riwo can summarise the conversation, tidy a rough answer or prepare a reply for a salesperson to review. If you enable a qualification workflow, decide which questions it may ask and where a person should take over.", "Keep prices, availability, finance terms and commitments under human control. When a buyer asks for a person, hand over promptly with their requirements and the questions already answered. Test the workflow with a colleague before enabling it for customers."],
        links: [{ label: "Riwo AI assistant", href: "/riwo" }, { label: "AI handover and disclosure", href: "/features/ai-handoff-and-disclosure" }],
      },
      {
        heading: "Follow up on the promise, not on an arbitrary message schedule",
        body: ["After the visit, record what the buyer wanted next: another model, a valuation, a quote or time to decide. Assign the task to one person and set the agreed due date. A useful follow-up refers to that request; repeated generic messages add work without answering the buyer's question.", "Separate an individual requested follow-up from a marketing broadcast. Do not assume that enquiring about one car means permission for every future offer. Check recorded marketing permission and honour opt-outs before including a contact in a campaign."],
      },
      {
        heading: "Review the dealership's own numbers each week",
        body: ["Review waiting enquiries, unassigned conversations, overdue follow-ups and outcomes your team has actually recorded. Choose a reply target appropriate to your opening hours and staffing. Compare the same periods and definitions; there is no universal conversion rate every dealership should expect.", "Record confirmed test drives, quotations and completed sales in the system your team actually uses. Scriwo does not automatically know whether a test drive happened or a vehicle sold. Start with one number and one handover, then expand when staff can complete the workflow reliably."],
        links: [{ label: "Scriwo for automobile dealers", href: "/industries/automobile-dealers" }, { label: "Trial checklist before you choose a CRM", href: "/blog/test-whatsapp-crm-before-buying" }],
      },
    ],
    related: ["chat-assignment", "whatsapp-sales-pipeline", "ai-handoff-and-disclosure"],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);

/** Guides that speak to an industry or market, newest first, for cross-links from those pages. */
export const guidesFor = ({ industry, country, exclude }: { industry?: string; country?: "UAE" | "India"; exclude?: string }) =>
  POSTS.filter((p) => p.slug !== exclude && ((industry && p.industries?.includes(industry)) || (country && p.country === country)))
    .sort((a, b) => Number(!!(industry && b.industries?.includes(industry))) - Number(!!(industry && a.industries?.includes(industry))) || b.published.localeCompare(a.published));
