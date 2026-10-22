import type { LucideIcon } from "lucide-react";
import {
  Inbox, UserCheck, StickyNote, Megaphone, Bot, Smartphone, ShieldCheck, Code2, BellRing, Contact,
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
