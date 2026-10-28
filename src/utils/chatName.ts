// What a chat or a person is called on screen. WhatsApp's own ids ("971500000001@c.us", "83752348860497@lid") are plumbing,
// not names: they are never shown. The server already does this; this keeps older answers and live updates honest too.

const ID_SUFFIX = /@(c\.us|s\.whatsapp\.net|lid|g\.us|broadcast|newsletter)$/i;
export const isWhatsAppId = (value?: string | null) => ID_SUFFIX.test(String(value ?? "").trim());

/** The digits of a real mobile number, or "" for a hidden "linked" id or a group id. */
export function mobileDigits(phone?: string | null): string {
  const raw = String(phone ?? "").trim();
  if (!raw || /@(lid|g\.us|broadcast|newsletter)$/i.test(raw)) return "";
  const digits = raw.replace(/(?::\d+)?@(c\.us|s\.whatsapp\.net)$/i, "").replace(/\D/g, "");
  return /^\d{6,15}$/.test(digits) ? digits : "";
}

export const mobileText = (phone?: string | null) => {
  const digits = mobileDigits(phone);
  return digits ? `+${digits}` : "";
};

export const NO_NAME = "Unknown contact";

/** The person's name, else their mobile number, else a plain label: never a WhatsApp id. */
export function chatTitle(name?: string | null, phone?: string | null, isGroup = false): string {
  const given = String(name ?? "").trim();
  if (isGroup) return given && !isWhatsAppId(given) ? given : "WhatsApp Group";
  if (given && !isWhatsAppId(given) && given !== String(phone ?? "").trim() && !/^\+?[\d\s().-]{6,}$/.test(given)) return given;
  return mobileText(given) || mobileText(phone) || NO_NAME;
}

/** The number under a chat's name; empty for a group, or for a person WhatsApp only gave a hidden id for. */
export const chatSubtitle = (chat: { phone?: string | null; displayPhone?: string | null; isGroup?: boolean }) =>
  chat.isGroup ? "" : chat.displayPhone ?? mobileText(chat.phone);

/** Does this chat match what was typed in the search box: by name, or by number written in any format? */
export function chatMatches(chat: { contactName?: string | null; phone?: string | null; isGroup?: boolean }, typed: string): boolean {
  const q = typed.trim().toLowerCase();
  if (!q) return true;
  if (chatTitle(chat.contactName, chat.phone, chat.isGroup).toLowerCase().includes(q)) return true;
  if (chat.isGroup) return false;
  const number = mobileDigits(chat.phone);
  if (!number) return false;
  if (number.includes(q.replace(/^\+/, ""))) return true;
  const digits = q.replace(/\D/g, "");
  return /^[\s\d+().-]+$/.test(q) && digits.length >= 3 && number.includes(digits.replace(/^0+/, "") || digits);
}
