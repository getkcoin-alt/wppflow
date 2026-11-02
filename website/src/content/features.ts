import type { LucideIcon } from "lucide-react";
import {
  Inbox, UserCheck, StickyNote, Megaphone, Bot, Smartphone, ShieldCheck, Code2, BellRing, Contact,
  Sunrise, Zap, Briefcase, KanbanSquare, BarChart3, UserRoundCheck, BookOpen,
} from "lucide-react";

export type Feature = {
  slug: string;
  icon: LucideIcon;
  name: string;
  /** Primary search phrase the page is built around. */
  keyword: string;
  title: string;
  summary: string;
  points: { title: string; body: string }[];
  howTo: string[];
  faqs: { q: string; a: string }[];
};

export const FEATURES: Feature[] = [
  {
    slug: "whatsapp-team-inbox",
    icon: Inbox,
    name: "Shared team inbox",
    keyword: "WhatsApp team inbox",
    title: "A shared WhatsApp inbox that feels like WhatsApp itself",
    summary:
      "Every chat from every number your team links, in one live inbox. Messages appear without refreshing, missed messages are caught up automatically, and opening a chat loads its history.",
    points: [
      { title: "Live, with no refresh", body: "New messages, delivery ticks and replies appear the moment they happen, on every screen that is open." },
      { title: "Nothing slips through", body: "If a connection drops, Scriwo notices the gap and fetches what was missed. A periodic check repairs anything the live feed skipped." },
      { title: "History when you need it", body: "Open a chat and its earlier WhatsApp messages load into the conversation, filed under the right contact." },
      { title: "Groups and status done right", body: "Group chats are shown as groups, and status updates are kept out of your customer conversations." },
      { title: "Errors in plain language", body: "When something fails, Scriwo says what happened and what to do, instead of a vague 'something went wrong'." },
      { title: "⌘K to find anything", body: "Jump to any chat, contact or screen from the keyboard. Phone-first layout for staff who live on mobile." },
    ],
    howTo: [
      "Your company account is created and the owner sets a password from a single-use link.",
      "Each teammate signs in and links their WhatsApp number by scanning a QR code, the same way as WhatsApp Web.",
      "Chats from every linked number arrive in the shared inbox, in real time.",
    ],
    faqs: [
      { q: "Do my staff need to change their WhatsApp number?", a: "No. Each teammate links the number they already use by scanning a QR code. Customers keep messaging the same number." },
      { q: "Does the phone need to stay online?", a: "The linked phone should stay charged and connected, just like with WhatsApp Web. Scriwo alerts you when a phone goes offline so you can fix it before customers wait." },
      { q: "Can I see chats from WhatsApp groups?", a: "Yes. Groups appear as groups in the inbox, and status updates are filtered out of customer conversations." },
    ],
  },
  {
    slug: "ai-today-home",
    icon: Sunrise,
    name: "Today: your AI-first home",
    keyword: "AI WhatsApp inbox",
    title: "Open Scriwo and see what needs you, with the reply already prepared",
    summary:
      "Today is the first screen. It lists the chats that need a person, how long each has waited, what the customer wants and a reply Riwo has already drafted, so the usual job is read, tap and send.",
    points: [
      { title: "Needs you now", body: "Waiting chats, oldest first, with the customer's mood, a one-line summary and a ready reply. Send it as it is, edit it, or open the chat." },
      { title: "A short morning brief", body: "Two warm sentences on how yesterday went and the one thing most worth your attention today, written from your real numbers." },
      { title: "Follow-ups and phones in one place", body: "Follow-ups that are due, numbers that need care, and your reply-time performance, without opening four screens." },
      { title: "Ask Riwo", body: "Type what you want in plain words, such as \"show unpaid leads\", and Scriwo takes you there. It opens screens and fills things in for you to confirm; it never acts silently." },
      { title: "A setup coach for new workspaces", body: "Connect a number, write about your business, add saved replies, invite the team. One clear next step at a time." },
      { title: "Fair on your allowance", body: "Riwo prepares replies in the background using the same daily allowance as everything else, and people who click always come first. Owners can switch Riwo off for the whole company at any time." },
    ],
    howTo: ["Sign in. Today is the first screen.", "Read the card for the chat that has waited longest, and the reply Riwo prepared.", "Send, edit or open the chat. The card clears and the next one is ready."],
    faqs: [
      { q: "Does Today send anything by itself?", a: "No. Today prepares; you send. Replies leave only when a person taps send. Sending automatically is a separate, optional setting called Autopilot." },
      { q: "Which plans include the prepared replies?", a: "Riwo, and so the prepared replies and the morning brief, is part of the Growth plan and above. The Today screen itself is on every plan." },
    ],
  },
  {
    slug: "riwo-autopilot",
    icon: Zap,
    name: "Autopilot for safe replies",
    keyword: "WhatsApp auto reply AI",
    title: "Let Riwo handle the safe, repetitive replies, and nothing else",
    summary:
      "Autopilot is off until an owner switches it on. When on, Riwo answers a customer only with one of your own saved replies, word for word, and only in cases that are safe to automate. Every action is listed and can be taken back.",
    points: [
      { title: "Your words, not the AI's", body: "Riwo picks which saved reply fully answers the question. It never writes what the customer reads, so it cannot invent a price or a promise." },
      { title: "Clear the thank-yous", body: "When a customer only says thanks or OK, the chat leaves your waiting list. Nothing is sent." },
      { title: "Strict guard rails", body: "Never in groups, never in a chat a teammate owns or answered lately, never when the customer sounds unhappy or urgent, never to someone who said stop, never twice in a few hours, and a daily limit." },
      { title: "Always labelled", body: "Customers can see the reply came from Riwo, and a customer who writes \"human\" is handed to a person at once." },
      { title: "Everything is recorded", body: "A list shows what Autopilot did today, and each reply has an Undo." },
    ],
    howTo: ["Open Today and find Autopilot.", "Turn on the rule you want, such as answering with saved replies.", "Check the list of what it did, and undo anything you do not like."],
    faqs: [
      { q: "Can Autopilot send prices or offers?", a: "Only if a saved reply you wrote says so. Riwo does not write messages of its own in Autopilot." },
      { q: "Is it on by default?", a: "No. Every Autopilot rule is off until an owner turns it on, for the whole company." },
    ],
  },
  {
    slug: "ai-sales-assistant",
    icon: Briefcase,
    name: "AI sales assistant",
    keyword: "WhatsApp sales assistant",
    title: "Qualify every new WhatsApp lead, then hand the sale to an executive",
    summary:
      "Riwo welcomes a new customer, asks your discovery questions one at a time, answers short questions from what you wrote about your business, and keeps the answers. When they ask for pricing or a proposal, it sends your formal message, hands the chat to an executive with a summary and adds the customer to your pipeline.",
    points: [
      { title: "Your questions, in your order", body: "What are you looking for, how many, where, by when. Up to six, asked exactly as you wrote them, and skipped if the customer already answered." },
      { title: "Pricing always goes to a person", body: "The moment someone asks for pricing, a quote or a proposal, in English, Arabic, Hindi or Hinglish, Riwo stops and sends your formal message: an executive is reviewing the requirements and will reply. It never states a price." },
      { title: "A pipeline built for you", body: "The first answer creates a lead; a pricing request moves it to your Proposal step. Nothing moves backwards, and the executive finds the customer's requirements in a private note in the chat." },
      { title: "Nobody is left waiting", body: "The assigned teammate and the managers are notified, the chat stays at the top of Today, and a follow-up task is made for the executive." },
      { title: "Learns from your website", body: "Enter your website address and Riwo reads your public pages and drafts what it may say about your business, plus suggested questions. You check and edit it before it is used." },
      { title: "Works without the AI too", body: "If Riwo is unavailable, the questions and the pricing hand-off still run." },
    ],
    howTo: ["Open Automations and choose Sales assistant.", "Enter your website and tap Read my website, or write a few sentences yourself. Edit the questions and the formal message.", "Save and turn it on. New customers are welcomed and qualified from the next message."],
    faqs: [
      { q: "Does the AI quote prices?", a: "No. Pricing and proposal requests are recognised by a word list before the AI is asked, and are always handed to a person with your formal message." },
      { q: "Does the customer know it is automated?", a: "Yes. Everything Riwo sends says it is an automated reply and that the customer can write \"human\" to reach a person." },
      { q: "Which plans include it?", a: "Automations are part of the Growth plan and above. Answering questions and reading your website use Riwo, which is also Growth and above." },
    ],
  },
  {
    slug: "riwo-knowledge-agent",
    icon: BookOpen,
    name: "Knowledge base and sales agent",
    keyword: "AI sales agent WhatsApp from website",
    title: "An AI sales agent that knows your whole website",
    summary:
      "Give Riwo your website and it learns every product, service and portfolio page. It then talks to new customers like someone who works for you: it finds out what they need, recommends the right product and moves them to the next step you chose. You set it up by describing it in your own words.",
    points: [
      { title: "One link, every product", body: "Add your website (up to five) and Riwo reads it page by page, writes what you do and lists each product, so a company with many products is talked about naturally." },
      { title: "Refresh when it changes", body: "Press Refresh and Riwo reads the site again, updating only what changed and forgetting pages you took down. It also re-reads by itself every day." },
      { title: "Your notes too", body: "Add what your website doesn't say, such as hours, how demos work and what you never do." },
      { title: "Describe it in your own words", body: "Tell Riwo what you want, the way you would brief a new salesperson. It asks what it still needs to know and drafts the settings for you to check. Nothing switches on until you say so." },
      { title: "Natural, not scripted", body: "It answers from your knowledge base, finds out what the customer needs, handles doubts with what is true, and works toward your goal: a handover, their details, a demo or a link." },
      { title: "Safe by design", body: "Riwo never invents a price, link or promise: anything not on your website or in your notes is never sent. Prices go to your team unless you let Riwo repeat the prices on your site. A person takes over when the customer is ready, with a summary, and the customer is added to your pipeline." },
    ],
    howTo: ["Open Automations and add your website to the knowledge base.", "Choose Riwo sales agent and describe in your own words what you want. Answer Riwo's questions.", "Check the settings, save, and turn it on."],
    faqs: [
      { q: "Does Riwo close the sale by itself?", a: "It runs the conversation and moves the customer to the next step you chose. A person finishes the sale, and Riwo never negotiates or invents terms." },
      { q: "Does it learn from my customers' chats?", a: "No. It reads your website and your notes, and nothing else." },
      { q: "Which plans include it?", a: "Automations and Riwo are part of the Growth plan and above." },
    ],
  },
  {
    slug: "ai-handoff-and-disclosure",
    icon: UserRoundCheck,
    name: "Honest AI with a person on call",
    keyword: "AI chatbot human handoff WhatsApp",
    title: "Customers always know when it is an assistant, and can ask for a person",
    summary:
      "Anything Riwo sends carries a short line saying it is automated and how to reach a person. When a customer asks for one, in English, Arabic or Hinglish, the automation stops, your team is notified and the chat goes to the top.",
    points: [
      { title: "Disclosure on every automated reply", body: "A short line at the end of each message from Riwo, so nobody is misled about who they are talking to." },
      { title: "\"Human\" works", body: "Phrases such as \"I want to talk to a person\", the same in Arabic or Hindi, or a lone \"human\" once Riwo has been answering." },
      { title: "The team is told at once", body: "The chat owner or the managers get a notification, and the chat shows as \"Asked for a person\", \"Wants pricing\" or \"Ready for an executive\" until a teammate replies." },
      { title: "Private mode", body: "Owners can limit Riwo to AI providers that do not keep or train on customer messages." },
    ],
    howTo: ["Nothing to set up: disclosure and hand-off are built in.", "Watch Today for chats marked as asking for a person.", "Reply as normal. The mark clears when you do."],
    faqs: [{ q: "Can I turn the disclosure line off?", a: "No. It is part of how Scriwo keeps automated replies honest." }],
  },
  {
    slug: "whatsapp-sales-pipeline",
    icon: KanbanSquare,
    name: "Sales pipeline",
    keyword: "WhatsApp CRM pipeline",
    title: "A sales pipeline that lives inside your WhatsApp conversations",
    summary:
      "Turn a chat into a lead in one tap, move it across your steps on a board, set follow-ups and see who owns what. Leads follow the chat, so nothing needs copying into another tool.",
    points: [
      { title: "From chat to lead in one tap", body: "Or let a rule do it for new customers and for people who ask for a quote. One open lead per contact, and never from a group chat." },
      { title: "Board, list and Today", body: "A step per column with counts and values, a list view, and a Today list of follow-ups. Rename, reorder and add steps, or start from a template for real estate, car dealers or clinics." },
      { title: "Follow-ups that remind", body: "A reminder arrives when a follow-up is due, and an overdue one is escalated to the owner and administrators after a day (you can change this)." },
      { title: "Same visibility as the inbox", body: "Managers see every lead; staff see their own and the leads on their numbers. The owner of a lead and the assignee of its chat are one person." },
      { title: "A written history", body: "Every move, won or lost with a reason, and what Riwo noted, in order." },
    ],
    howTo: ["Open a chat and tap Add to pipeline, or turn on the Sales assistant to do it for you.", "Drag the lead across the steps as the deal moves.", "Set a follow-up so it is never forgotten."],
    faqs: [{ q: "Which plans include the pipeline?", a: "The sales pipeline is part of the Growth plan and above." }],
  },
  {
    slug: "team-reports-and-assignment",
    icon: BarChart3,
    name: "Reply-time reports and fair assignment",
    keyword: "WhatsApp team performance reports",
    title: "Know how fast your team replies, and share new chats fairly",
    summary:
      "See your median and 90th-percentile reply times, how many chats meet your target and who is waiting, with a leaderboard and a daily summary for owners. New chats can be shared round-robin or to the least busy person.",
    points: [
      { title: "Reply-time reports", body: "Median and 90th percentile, the share replied to within your target, chats still waiting, a leaderboard and a CSV export." },
      { title: "Daily owner summary", body: "A short summary each day, so you do not have to open the report to know how the team did." },
      { title: "Round-robin or least busy", body: "New chats go to available teammates by turns, or to whoever has the fewest open chats, within the working hours and numbers you choose." },
      { title: "Follow-ups on chats", body: "A follow-up does not need a lead. \"Call back Thursday\" on any chat reminds the right person, and overdue ones are escalated to the managers." },
      { title: "Labels and filters", body: "Coloured labels, filters by label and by status, and a New chat button for a number you type." },
    ],
    howTo: ["Open Reports to see reply times.", "Open Automations to choose how new chats are assigned.", "Set follow-ups from any chat."],
    faqs: [{ q: "What are the reports counted from?", a: "From real customer messages and the replies sent to them, per teammate and per number. You can download the figures as CSV." }],
  },
  {
    slug: "chat-assignment",
    icon: UserCheck,
    name: "Assign and resolve",
    keyword: "WhatsApp chat assignment",
    title: "Assign every WhatsApp chat to the right person, then resolve it",
    summary:
      "Hand a conversation to a teammate in one click. They see it instantly, get notified, and mark it resolved when the customer is sorted. Everyone knows who owns what.",
    points: [
      { title: "Clear ownership", body: "Every chat shows who it is assigned to. No more two people replying to the same customer, or nobody replying at all." },
      { title: "Staff see only what is theirs", body: "Staff see their own number's chats plus anything assigned to them. Owners see everything. The server enforces it, not just the screen." },
      { title: "Resolve and move on", body: "Mark a chat resolved when it is done." },
    ],
    howTo: [
      "Open a chat in the inbox.",
      "Choose a teammate from the assign menu. They are notified in the app and on desktop.",
      "When the customer is sorted, mark the chat resolved.",
    ],
    faqs: [
      { q: "Can an owner see chats assigned to staff?", a: "Yes. Owners see every chat across every number in the company." },
      { q: "Can staff see each other's chats?", a: "Only when a chat is assigned to them. Otherwise staff see the chats on their own linked number." },
    ],
  },
  {
    slug: "private-notes-and-mentions",
    icon: StickyNote,
    name: "Private notes and @mentions",
    keyword: "internal notes WhatsApp",
    title: "Private notes and @mentions inside WhatsApp chats",
    summary:
      "Leave a note on a conversation that the customer never sees, and @mention a teammate to pull them in. Context stays with the chat instead of getting lost in a separate group.",
    points: [
      { title: "Notes customers never see", body: "Notes sit in the conversation for your team only. Nothing is sent to WhatsApp." },
      { title: "@mention to ask for help", body: "Type @ and a name. Your teammate is notified and lands straight in the right chat." },
      { title: "Handovers without retyping", body: "The next person reads the notes and picks up where you left off." },
    ],
    howTo: ["Open a chat.", "Switch the composer to note mode.", "Type your note, @mention a teammate if needed, and save."],
    faqs: [{ q: "Is a private note ever sent to the customer?", a: "No. Notes are stored in Scriwo only and are never delivered to WhatsApp." }],
  },
  {
    slug: "whatsapp-broadcast",
    icon: Megaphone,
    name: "Broadcasts",
    keyword: "WhatsApp broadcast software",
    title: "WhatsApp broadcasts that respect your customers and protect your number",
    summary:
      "Send a campaign to contacts who opted in, with delays between messages so your number behaves like a person, not a spam bot.",
    points: [
      { title: "Opted-in contacts only", body: "Broadcasts go only to contacts marked as opted in. It is better for your reputation and for your number." },
      { title: "Built-in delays", body: "Messages go out with pauses between them, which lowers the chance of WhatsApp restricting the number." },
      { title: "Import from your sheet", body: "Bring contacts in from CSV and export them back whenever you need." },
    ],
    howTo: [
      "Import your contacts from CSV, with their opt-in status.",
      "Write the message and choose the opted-in audience.",
      "Start the campaign. Scriwo sends with delays and records every result.",
    ],
    faqs: [
      { q: "Can I broadcast to people who never opted in?", a: "No. Scriwo sends campaigns only to opted-in contacts. Messaging strangers in bulk is the fastest way to get a number restricted." },
      { q: "Is this the official WhatsApp Business API?", a: "No. Scriwo works with the WhatsApp number your team already uses. Keep campaigns small, relevant and opted in." },
    ],
  },
  {
    slug: "whatsapp-automation",
    icon: Bot,
    name: "Keyword automations",
    keyword: "WhatsApp auto reply",
    title: "Keyword automations and quick replies for WhatsApp",
    summary:
      "Answer common questions instantly. When a message contains a keyword like 'price' or 'location', Scriwo can reply on its own, and your team keeps saved replies for everything else.",
    points: [
      { title: "Keyword rules", body: "Set a keyword and the reply. Scriwo answers matching messages automatically." },
      { title: "Saved replies", body: "Your best answers, one click away for the whole team. Consistent and fast." },
      { title: "Humans stay in charge", body: "Automations handle the repetitive part. Anything more goes to a person." },
    ],
    howTo: ["Open Automations.", "Add a keyword and the reply.", "Turn the rule on. Matching messages get the reply instantly."],
    faqs: [{ q: "Can automation replace my sales team?", a: "It should not. Use it for repeated questions such as timings, location or price lists, and let people handle the conversation." }],
  },
  {
    slug: "multiple-whatsapp-numbers",
    icon: Smartphone,
    name: "Many numbers, one company",
    keyword: "multiple WhatsApp numbers one dashboard",
    title: "Every staff WhatsApp number in one company dashboard",
    summary:
      "Each teammate links their own number. Owners see all of them in one place, with a per-company limit you control, and numbers that look after themselves.",
    points: [
      { title: "One login per person", body: "Staff sign in with their own account and connect their own number. No shared passwords, no passing phones around." },
      { title: "Offline alerts", body: "If a linked phone goes offline, Scriwo tells you, so customers are not left waiting." },
      { title: "Clean removal", body: "Removing a number unlinks it from the phone and deletes its saved login. Leftover browser processes are cleaned up automatically." },
    ],
    howTo: ["Invite a teammate by email.", "They set a password from a single-use link.", "They open Sessions and scan the QR code with their phone."],
    faqs: [
      { q: "How many numbers can a company link?", a: "Each company has a number limit set for its plan. Contact us and we will set the limit you need." },
      { q: "What happens when someone leaves?", a: "Remove their number. Scriwo unlinks it from the phone and deletes its saved login, and the chat history stays with the company." },
    ],
  },
  {
    slug: "security-and-roles",
    icon: ShieldCheck,
    name: "Roles and security",
    keyword: "secure WhatsApp CRM",
    title: "Safe by default: roles, audit log and no emailed passwords",
    summary:
      "Owners, admins and staff each see what they should. Every important action is in the audit log, and passwords are never sent by email, only single-use links.",
    points: [
      { title: "Roles enforced by the server", body: "Access rules run on the server, so a staff member cannot see another person's chats by changing the page." },
      { title: "Audit log", body: "Who did what, and when. Useful for managers, and essential when something needs checking." },
      { title: "Suspend in one click", body: "A company or user can be suspended instantly. Live sessions are disconnected straight away." },
      { title: "Single-use links", body: "New owners and staff choose their own password from a link that works once and expires." },
    ],
    howTo: ["Invite staff with a role.", "Owners and admins manage the team; staff work their chats.", "Review the audit log any time."],
    faqs: [{ q: "Does Scriwo ever email a password?", a: "No. People choose their own password from a single-use link that expires." }],
  },
  {
    slug: "whatsapp-api-and-webhooks",
    icon: Code2,
    name: "API and webhooks",
    keyword: "WhatsApp API for developers",
    title: "A WhatsApp API, webhooks and SDK samples built into the product",
    summary:
      "Connect Scriwo to your CRM, ERP or website. Create scoped API keys, receive signed webhooks, and test requests in the built-in API tester before you write a line of code.",
    points: [
      { title: "Scoped API keys", body: "Give each integration only the access it needs, and revoke a key without touching the others." },
      { title: "Signed webhooks", body: "Every webhook is signed so your server can prove it came from Scriwo." },
      { title: "API tester and SDK samples", body: "Try requests from inside the product, then copy working samples." },
    ],
    howTo: ["Create an API key in the developer area.", "Try a request in the API tester.", "Add a webhook URL and verify the signature on your server."],
    faqs: [{ q: "Who can create API keys?", a: "Owners and admins. Staff can open the developer guide but cannot create keys or webhooks." }],
  },
  {
    slug: "team-notifications",
    icon: BellRing,
    name: "Notifications",
    keyword: "WhatsApp desktop notifications for teams",
    title: "Notifications that reach the right person",
    summary:
      "In-app and desktop alerts when a chat is assigned to you, when you are @mentioned, and when a linked phone goes offline.",
    points: [
      { title: "Desktop alerts", body: "Know about a new assignment even when Scriwo is in another tab." },
      { title: "Mentions", body: "Get pulled into the exact conversation where your help is needed." },
      { title: "Phone offline alert", body: "Find out quickly when a number stops receiving, instead of hearing it from a customer." },
    ],
    howTo: ["Allow notifications when Scriwo asks.", "Work as normal; alerts arrive when something needs you."],
    faqs: [{ q: "Do notifications work on mobile?", a: "In-app notifications work on any device. Desktop alerts work in desktop browsers that allow notifications." }],
  },
  {
    slug: "whatsapp-contacts-crm",
    icon: Contact,
    name: "Contacts and CSV",
    keyword: "WhatsApp CRM",
    title: "A WhatsApp CRM your whole team can use without training",
    summary:
      "Every customer who messages becomes a contact. Import and export with CSV, keep opt-in status, and see the full conversation history in one place.",
    points: [
      { title: "Contacts from conversations", body: "People who message you are saved as contacts automatically." },
      { title: "CSV in and out", body: "Move contacts between Scriwo and Excel or Google Sheets whenever you need." },
      { title: "No training needed", body: "If your team can use WhatsApp, they can use Scriwo." },
    ],
    howTo: ["Open Contacts.", "Import a CSV or let contacts build up from chats.", "Export any time."],
    faqs: [{ q: "Can I take my data with me?", a: "Yes. Export contacts as CSV whenever you like." }],
  },
];

export const featureBySlug = (slug: string) => FEATURES.find((f) => f.slug === slug);
