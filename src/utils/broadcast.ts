// Helpers for writing a broadcast: seeing it the way a customer will, finding what is still blank, and saying
// how long it will take.

export interface Part {
  text: string;
  /** A [blank] the sender still has to write */
  blank?: boolean;
}

/** What is left to write: the [bracketed] parts. */
export const findBlanks = (text: string): string[] => [
  ...new Set(text.match(/\[[^\]\n]+\]/g) || []),
];

const SAMPLE = { name: "Aisha Khan", first: "Aisha" };

/** The message as one customer would see it, split so the blanks can be highlighted. */
export function previewParts(text: string, company: string): Part[] {
  const filled = text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (whole, key) => {
    const k = String(key).toLowerCase();
    return k === "name"
      ? SAMPLE.name
      : k === "first_name"
        ? SAMPLE.first
        : k === "company"
          ? company || "Your company"
          : whole;
  });
  const parts: Part[] = [];
  let last = 0;
  for (const m of filled.matchAll(/\[[^\]\n]+\]/g)) {
    if (m.index > last) parts.push({ text: filled.slice(last, m.index) });
    parts.push({ text: m[0], blank: true });
    last = m.index + m[0].length;
  }
  if (last < filled.length) parts.push({ text: filled.slice(last) });
  return parts;
}

/** How long sending takes, in words. */
export function estimate(people: number, secondsBetween: number): string {
  const seconds = Math.max(0, (people - 1) * secondsBetween);
  if (seconds < 60) return "under a minute";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `about ${hours} hour${hours === 1 ? "" : "s"}${rest ? ` ${rest} min` : ""}`;
}

/** The speeds a person can choose, from fastest to most careful. */
export const SPEEDS = [
  { seconds: 4, label: "Fast", note: "one every 4 seconds" },
  { seconds: 8, label: "Standard", note: "one every 8 seconds, recommended" },
  { seconds: 15, label: "Careful", note: "one every 15 seconds, best for new numbers" },
] as const;

/** `datetime-local` text for a moment, in the person's own time. */
export const localInput = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
