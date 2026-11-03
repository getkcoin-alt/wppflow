// "Say it the way you would say it": turns one line of everyday words into the fields of a form, with no server and no cost, so
// the person types a sentence instead of filling ten boxes. It only understands what it is sure of; everything else is left for
// the person, and the form always shows what was filled so it can be checked and changed. Nothing is saved by this file.

export interface Understood<T> {
  fields: Partial<T>;
  /** short readable pieces, shown to the person as "Understood: ..." */
  chips: string[];
  /** the words left over once what was understood is taken out */
  rest: string;
}

const MULT: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, mil: 1e6, million: 1e6, lakh: 1e5, lac: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7 };
// a number followed by these is a count of something else, never money
const NOT_MONEY = /^\s*(bed|bedroom|br|bhk|bath|sqft|sq|sf|min|mins|minute|minutes|hour|hours|hr|day|days|am|pm|%)/i;

export interface Money {
  amount: number;
  currency?: string;
  /** the exact words it was read from */
  text: string;
}

const CUR: Record<string, string> = { aed: "AED", dh: "AED", dhs: "AED", usd: "USD", $: "USD", inr: "INR", "₹": "INR", rs: "INR", eur: "EUR", "€": "EUR", gbp: "GBP", "£": "GBP" };

/** The amount of money in some words: "1.8M", "AED 2,500,000", "₹50k", "45 lakh". The biggest figure that is plainly money wins. */
export function findMoney(text: string): Money | null {
  const re = /(?:(aed|dhs?|usd|inr|eur|gbp|rs\.?|[$₹€£])\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|mn|mil|million|m|lakhs?|lac|crores?|cr)?(?![a-z0-9])/gi;
  let best: Money | null = null;
  for (const m of text.matchAll(re)) {
    const after = text.slice((m.index ?? 0) + m[0].length);
    if (NOT_MONEY.test(after) || /^\s*[:/-]\s*\d/.test(after)) continue;
    const before = text.slice(Math.max(0, (m.index ?? 0) - 1), m.index);
    if (/[:/]/.test(before)) continue;
    const raw = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(raw)) continue;
    const suffix = (m[3] || "").toLowerCase();
    const amount = Math.round(raw * (suffix ? MULT[suffix] ?? 1 : 1));
    // a bare small number ("2", "3") is not money unless it has a currency or a suffix
    if (!m[1] && !suffix && amount < 1000) continue;
    const cur = m[1] ? CUR[m[1].toLowerCase().replace(/\.$/, "")] : undefined;
    if (!best || amount > best.amount) best = { amount, currency: cur, text: m[0].trim() };
  }
  return best;
}

export const formatMoney = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n));

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export interface DayFound {
  /** whole days from today */
  days: number;
  date: string;
  text: string;
}

/** A day in everyday words: today, tomorrow, friday, next week, in 3 days, 2026-11-20, 20/11. */
export function findDay(text: string, now = new Date()): DayFound | null {
  const t = text.toLowerCase();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const make = (days: number, said: string): DayFound => ({ days, date: isoDate(addDays(today, days)), text: said });
  let m: RegExpMatchArray | null;
  if ((m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/))) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return make(Math.round((+d - +today) / 864e5), m[0]);
  }
  if ((m = t.match(/\bin\s+(\d{1,3})\s*(day|days|week|weeks)\b/))) return make(Number(m[1]) * (m[2].startsWith("week") ? 7 : 1), m[0]);
  if ((m = t.match(/\b(day after tomorrow)\b/))) return make(2, m[0]);
  if ((m = t.match(/\b(tomorrow|tmrw|tmr)\b/))) return make(1, m[0]);
  if ((m = t.match(/\b(today|tonight)\b/))) return make(0, m[0]);
  if ((m = t.match(/\bnext week\b/))) return make(7, m[0]);
  if ((m = t.match(/\b(?:next\s+|on\s+|this\s+)?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|sday|nesday|rsday|urday)?\b/))) {
    const idx = WEEKDAYS.findIndex((w) => w.startsWith(m![1].slice(0, 3)));
    let diff = (idx - today.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    return make(diff, m[0]);
  }
  if ((m = t.match(/\b(\d{1,2})[/.](\d{1,2})\b/)) && Number(m[1]) <= 31 && Number(m[2]) <= 12) {
    let d = new Date(today.getFullYear(), Number(m[2]) - 1, Number(m[1]));
    if (d < today) d = new Date(today.getFullYear() + 1, Number(m[2]) - 1, Number(m[1]));
    return make(Math.round((+d - +today) / 864e5), m[0]);
  }
  return null;
}

/** A time of day: 4pm, 3:30 pm, 15:45, noon. Returns "HH:MM". */
export function findTime(text: string): { time: string; text: string } | null {
  const t = text.toLowerCase();
  let m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3] === "pm") h += 12;
    if (Number(m[1]) > 12 || Number(m[2] || 0) > 59) return null;
    return { time: `${pad(h)}:${m[2] || "00"}`, text: m[0] };
  }
  if ((m = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) return { time: `${pad(Number(m[1]))}:${m[2]}`, text: m[0] };
  if ((m = t.match(/\bnoon\b/))) return { time: "12:00", text: m[0] };
  return null;
}

/** A length of time: "45 min", "1 hour", "90 minutes". Returns minutes. */
export function findMinutes(text: string): { minutes: number; text: string } | null {
  const t = text.toLowerCase();
  let m = t.match(/\b(\d{1,3})\s*(?:min|mins|minutes)\b/);
  if (m) return { minutes: Number(m[1]), text: m[0] };
  if ((m = t.match(/\b(\d(?:\.\d)?)\s*(?:h|hr|hrs|hour|hours)\b/))) return { minutes: Math.round(Number(m[1]) * 60), text: m[0] };
  return null;
}

const take = (rest: string, said: string) => rest.replace(said, " ").replace(/\s{2,}/g, " ");
const tidy = (s: string) => s.replace(/\s+/g, " ").replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, "").replace(/\b(?:for|at|on|in|by|of|with|and|call|follow(?:\s|-)?up|remind(?:\s+me)?)\s*$/i, "").replace(/[\s,.;:–—-]+$/g, "").trim();

// ── New lead ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface LeadFill {
  title: string;
  value: string;
  followDays: number;
}
export function understandLead(text: string, now = new Date()): Understood<LeadFill> {
  const fields: Partial<LeadFill> = {};
  const chips: string[] = [];
  let rest = ` ${text} `;
  const money = findMoney(rest);
  if (money) {
    fields.value = String(money.amount);
    chips.push(`Value ${money.currency ? money.currency + " " : ""}${formatMoney(money.amount)}`);
    rest = take(rest, money.text);
  }
  const day = findDay(rest, now);
  if (day) {
    fields.followDays = day.days;
    chips.push(day.days === 0 ? "Follow up today" : day.days === 1 ? "Follow up tomorrow" : `Follow up in ${day.days} days`);
    rest = take(rest, day.text);
  }
  const title = tidy(rest);
  if (title) {
    fields.title = title.charAt(0).toUpperCase() + title.slice(1);
    chips.push(`For “${fields.title.length > 28 ? fields.title.slice(0, 27) + "…" : fields.title}”`);
  }
  return { fields, chips, rest: title };
}

// ── New property ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface PropertyFill {
  purpose: "sale" | "rent";
  propertyType: string;
  price: string;
  currency: string;
  rentPeriod: "year" | "month";
  community: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqft: string;
  furnished: "furnished" | "semi" | "unfurnished";
  title: string;
}
const TYPE_WORDS: [RegExp, string][] = [
  [/\b(apartments?|flats?)\b/i, "apartment"],
  [/\bvillas?\b/i, "villa"],
  [/\btown\s?houses?\b/i, "townhouse"],
  [/\bpenthouses?\b/i, "penthouse"],
  [/\boffices?\b/i, "office"],
  [/\b(shops?|retail)\b/i, "retail"],
  [/\b(land|plot)\b/i, "land"],
  [/\bwarehouses?\b/i, "warehouse"],
];
export function understandProperty(text: string, opts: { propertyTypes?: string[]; currency?: string } = {}): Understood<PropertyFill> {
  const fields: Partial<PropertyFill> = {};
  const chips: string[] = [];
  let rest = ` ${text} `;
  const cut = (said: string) => (rest = take(rest, said));

  let m: RegExpMatchArray | null;
  if ((m = rest.match(/\b(\d{1,2})\s*(?:bed(?:room)?s?|br|bhk)\b/i))) {
    fields.bedrooms = m[1];
    chips.push(`${m[1]} bed`);
    cut(m[0]);
  } else if ((m = rest.match(/\bstudio\b/i))) {
    fields.bedrooms = "0";
    chips.push("Studio");
  }
  if ((m = rest.match(/\b(\d{1,2})\s*(?:bath(?:room)?s?|ba)\b/i))) {
    fields.bathrooms = m[1];
    chips.push(`${m[1]} bath`);
    cut(m[0]);
  }
  if ((m = rest.match(/\b(\d[\d,]*)\s*(?:sq\.?\s?ft|sqft|sf|square\s?feet)\b/i))) {
    fields.sizeSqft = m[1].replace(/,/g, "");
    chips.push(`${Number(fields.sizeSqft).toLocaleString("en-US")} sq ft`);
    cut(m[0]);
  }
  const purpose = /\b(for\s+)?(rent|rental|lease|to let|per\s+(?:year|month|yr)|\/\s?(?:yr|year|month|mo))\b/i.test(rest) ? "rent" : /\b(for\s+)?(sale|sell|selling|buy)\b/i.test(rest) ? "sale" : undefined;
  if (purpose) {
    fields.purpose = purpose;
    chips.push(purpose === "rent" ? "For rent" : "For sale");
    if (purpose === "rent") {
      fields.rentPeriod = /\b(month|monthly|\/\s?mo|per\s+month)\b/i.test(rest) ? "month" : "year";
      chips.push(`per ${fields.rentPeriod}`);
    }
  }
  const money = findMoney(rest);
  if (money) {
    fields.price = String(money.amount);
    if (money.currency) fields.currency = money.currency;
    chips.push(`${money.currency || opts.currency || ""} ${formatMoney(money.amount)}`.trim());
    cut(money.text);
  }
  for (const [re, kind] of TYPE_WORDS) {
    if (re.test(rest) && (!opts.propertyTypes || opts.propertyTypes.includes(kind))) {
      fields.propertyType = kind;
      chips.push(kind.charAt(0).toUpperCase() + kind.slice(1));
      break;
    }
  }
  if (/\bunfurnished\b/i.test(rest)) {
    fields.furnished = "unfurnished";
    chips.push("Unfurnished");
  } else if (/\bsemi[\s-]?furnished\b/i.test(rest)) {
    fields.furnished = "semi";
    chips.push("Semi-furnished");
  } else if (/\bfurnished\b/i.test(rest)) {
    fields.furnished = "furnished";
    chips.push("Furnished");
  }
  // where: "in Dubai Marina", "at Palm Jumeirah"; stops at a comma, a number or a joining word
  if ((m = rest.match(/\b(?:in|at|near)\s+([a-z][a-z'’ -]{2,36}?)(?=\s*(?:,|\.|$|\bfor\b|\bwith\b|\bat\b|\bper\b|\bmonthly\b|\bfurnished\b|\bunfurnished\b|\bsemi\b|\d))/i))) {
    const place = tidy(m[1]).replace(/\b\w/g, (c) => c.toUpperCase());
    if (place) {
      fields.community = place;
      chips.push(place);
    }
  }
  if (fields.bedrooms !== undefined || fields.community || fields.propertyType) {
    const kind = fields.propertyType || "property";
    const beds = fields.bedrooms === "0" ? "Studio" : fields.bedrooms ? `${fields.bedrooms}-bed ` : "";
    const where = fields.community ? ` in ${fields.community}` : "";
    fields.title = `${beds}${kind.charAt(0).toUpperCase() + kind.slice(1)}${where}`.replace(/^Studio (\w)/, (_, c) => `Studio ${c.toLowerCase()}`);
  }
  return { fields, chips, rest: tidy(rest) };
}

// ── Book a viewing ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ViewingFill {
  date: string;
  time: string;
  minutes: string;
}
export function understandViewing(text: string, now = new Date()): Understood<ViewingFill> {
  const fields: Partial<ViewingFill> = {};
  const chips: string[] = [];
  let rest = ` ${text} `;
  const minutes = findMinutes(rest);
  if (minutes) {
    fields.minutes = String(minutes.minutes);
    chips.push(`${minutes.minutes} min`);
    rest = take(rest, minutes.text);
  }
  const time = findTime(rest);
  if (time) {
    fields.time = time.time;
    chips.push(`at ${time.time}`);
    rest = take(rest, time.text);
  }
  const day = findDay(rest, now);
  if (day) {
    fields.date = day.date;
    chips.push(new Date(`${day.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
    rest = take(rest, day.text);
  }
  return { fields, chips, rest: tidy(rest) };
}
