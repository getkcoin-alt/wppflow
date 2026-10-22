export type Faq = { q: string; a: string };

export const GENERAL_FAQS: Faq[] = [
  { q: "What is Scriwo?", a: "Scriwo is a shared WhatsApp inbox and CRM for companies with staff. Each teammate links their own WhatsApp number, owners see every conversation in one place, and the team assigns, notes and resolves chats together." },
  { q: "Who is Scriwo for?", a: "Companies in the UAE and India where several people talk to customers on WhatsApp: real estate brokerages, clinics, coaching institutes, travel agencies, showrooms, retailers and online stores." },
  { q: "Is Scriwo the official WhatsApp Business API?", a: "No. Scriwo is independent and is not affiliated with WhatsApp or Meta. It works with the WhatsApp numbers your team already uses, linked by scanning a QR code like WhatsApp Web." },
  { q: "Can staff see each other's chats?", a: "Staff see the chats on their own number plus any chat assigned to them. Owners see everything. This is enforced by the server, not just hidden on screen." },
  { q: "How do I get started?", a: "Send us a message through the contact form. We set up your company, the owner receives a single-use link to choose a password, and then invites the team." },
  { q: "How much does Scriwo cost?", a: "Plans start at AED 299 a month in the UAE and ₹2,499 a month in India for up to 3 WhatsApp numbers, with no per-message fees. Growth (10 numbers) is AED 799 or ₹6,999, and Business (25 numbers) is AED 1,699 or ₹14,999. Prices exclude VAT or GST." },
  { q: "How do I pay?", a: "Online payment is coming soon. For now, send the contact form or message sales on WhatsApp at +91 91191 12999, and we will send an invoice in AED or INR." },
  { q: "Will my number get banned?", a: "Scriwo is built to protect your number: broadcasts go only to opted-in contacts, with delays between messages. No tool can guarantee WhatsApp will never restrict a number, so avoid messaging people who did not ask to hear from you." },
  { q: "Is my data safe?", a: "Access is role-based and checked on the server, important actions are recorded in an audit log, API keys are scoped and webhooks are signed. Passwords are never emailed." },
];
