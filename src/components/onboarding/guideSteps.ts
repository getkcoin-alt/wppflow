// What Riwo says in the welcome guide. Short on purpose: each step is one idea, one line of what to do, and a reason to care.
// Two versions: Scriwo (any business) and Scriwo Homes (property agencies, on homes.scriwo.com).

export interface GuideStep {
  /** only owners and administrators can do this, so teammates are not shown it */
  managerOnly?: boolean;
  /** a small label above the title, such as "Step 1 of 4" is added by the guide itself */
  title: string;
  /** what Riwo says */
  say: string;
  /** where to find it in the product */
  where: string;
  /** an emoji-free picture drawn by the guide */
  scene: "hello" | "connect" | "chat" | "ai" | "team" | "leads" | "homes" | "viewings" | "go";
}

export const APP_GUIDE: GuideStep[] = [
  {
    title: "Hi, I'm Riwo",
    say: "I'll show you around in a minute. Scriwo puts your whole team on one WhatsApp inbox, and I help with the busy work. Start by handling one enquiry.",
    where: "This takes about a minute. Skip any time.",
    scene: "hello",
  },
  {
    title: "Connect your WhatsApp number",
    say: "Scan one code with your phone, the same way you link WhatsApp Web. Your chats appear in Scriwo and your phone keeps working as usual.",
    where: "Numbers, then Connect a number",
    scene: "connect",
    managerOnly: true,
  },
  {
    title: "Reply together, never double-reply",
    say: "Owners and administrators see company chats. Staff see their own number’s chats and chats assigned to them. Give a chat to a teammate, leave a private note, and tap Ask Riwo for a draft. You read it, change it, and send it.",
    where: "Inbox",
    scene: "chat",
  },
  {
    title: "Let me do the repeating work",
    say: "Give me your website and I learn what you sell. Then I can greet new people, answer simple questions, ask the right questions and pass the serious buyers to you. I never decide a price or close a deal myself.",
    where: "Automations, then Knowledge base",
    scene: "ai",
  },
  {
    title: "Bring your team, then start your day on Today",
    say: "Invite teammates by email, each with their own role. Today shows who is waiting, what is due, and replies I have already drafted.",
    where: "Team, then Today",
    scene: "team",
    managerOnly: true,
  },
  {
    title: "That's it. Your turn",
    say: "Start with step one: connect a number. I'll be in the corner whenever you need me.",
    where: "Open Riwo any time from the Ask Riwo button",
    scene: "go",
  },
];

export const HOMES_GUIDE: GuideStep[] = [
  {
    title: "Hi, I'm Riwo",
    say: "I work for property agencies. Every enquiry that lands on WhatsApp gets captured, qualified and followed up, so no lead is lost in someone's personal chat. Try everything free for 14 days.",
    where: "About a minute. Skip any time.",
    scene: "hello",
  },
  {
    title: "Connect your agency's number",
    say: "Scan one code and the team shares one inbox. Agents keep using WhatsApp the way they like; the company keeps the conversations.",
    where: "Numbers, then Connect a number",
    scene: "connect",
    managerOnly: true,
  },
  {
    title: "Every buyer, qualified",
    say: "I ask buy or rent, area, bedrooms, budget and timeline in your words, and write the answers onto the lead. You see who is serious without scrolling.",
    where: "Real estate, then Leads",
    scene: "leads",
  },
  {
    title: "Add your properties, get matches",
    say: "List what you have. When a buyer's needs fit a property, you see the match and can send it in one tap.",
    where: "Real estate, then Properties and Matches",
    scene: "homes",
  },
  {
    title: "Book viewings, spot what slipped",
    say: "Viewings sit next to the chat. The revenue leaks list shows enquiries nobody answered and buyers who went quiet, so a manager can step in.",
    where: "Real estate, then Viewings and Revenue leaks",
    scene: "viewings",
  },
  {
    title: "That's it. Your turn",
    say: "Connect a number and your first enquiry will land here. I'll be around whenever you need me.",
    where: "Open Riwo any time from the Ask Riwo button",
    scene: "go",
  },
];
