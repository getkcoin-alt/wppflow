// Helpers for writing a broadcast: seeing it the way a customer will, finding what is still blank, and saying
// how long it will take with anti-ban safeguards.

export interface Part {
  text: string;
  /** A [blank] the sender still has to write */
  blank?: boolean;
}

/** What is left to write: the [bracketed] parts. */
export const findBlanks = (text: string): string[] => [
  ...new Set(text.match(/\[[^\]\n]+\]/g) || []),
];

/** Check if text contains Spintax patterns like {Hello|Hi|Hey} */
export const hasSpintax = (text: string): boolean => {
  return /\{[^{}]+?\|[^{}]+?\}/.test(text);
};

/** Resolve Spintax syntax {A|B|C} for client-side preview */
export function resolveSpintaxPreview(text: string): string {
  if (!text || typeof text !== "string") return "";
  let resolved = text;
  const regex = /\{([^{}]+?)\}/g;
  let iterations = 0;
  while (regex.test(resolved) && iterations < 10) {
    resolved = resolved.replace(regex, (_, choicesStr) => {
      if (!choicesStr.includes("|")) return `{${choicesStr}}`;
      const choices = choicesStr.split("|");
      const chosen = choices[Math.floor(Math.random() * choices.length)];
      return chosen !== undefined ? chosen : "";
    });
    regex.lastIndex = 0;
    iterations++;
  }
  return resolved;
}

const SAMPLE = { name: "Aisha Khan", first: "Aisha" };

/** The message as one customer would see it, split so the blanks can be highlighted. */
export function previewParts(
  text: string,
  company: string,
  applySpintax = true,
): Part[] {
  let filled = text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (whole, key) => {
    const k = String(key).toLowerCase();
    return k === "name"
      ? SAMPLE.name
      : k === "first_name"
        ? SAMPLE.first
        : k === "company"
          ? company || "Your company"
          : whole;
  });

  if (applySpintax && hasSpintax(filled)) {
    filled = resolveSpintaxPreview(filled);
  }

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

/** How long sending takes, factoring in dynamic human jitter and batch cool-downs. */
export function estimate(
  people: number,
  secondsBetween: number,
  batchSize = 25,
  cooldownSeconds = 300,
): string {
  if (people <= 0) return "under a minute";
  const numBatches = Math.floor(Math.max(0, people - 1) / batchSize);
  const totalCooldown = numBatches * cooldownSeconds;
  // Human jitter adds ~3-4 seconds per message on average
  const averageJitter = people * 3.5;
  const totalSeconds =
    Math.max(0, (people - 1) * secondsBetween) + totalCooldown + averageJitter;

  if (totalSeconds < 60) return "under a minute";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) {
    const batchNote =
      numBatches > 0
        ? ` (includes ${numBatches} cool-down pause${numBatches > 1 ? "s" : ""})`
        : "";
    return `about ${minutes} minute${minutes === 1 ? "" : "s"}${batchNote}`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const batchNote =
    numBatches > 0
      ? ` (includes ${numBatches} batch pause${numBatches > 1 ? "s" : ""})`
      : "";
  return `about ${hours} hour${hours === 1 ? "" : "s"}${rest ? ` ${rest} min` : ""}${batchNote}`;
}

/** The speeds a person can choose, with anti-ban safety ratings. */
export const SPEEDS = [
  {
    seconds: 8,
    label: "Standard (Anti-Ban Safe)",
    note: "8–14s human jitter + typing presence + batch cool-downs",
  },
  {
    seconds: 15,
    label: "Conservative / Cold List",
    note: "15–22s cadence, ideal for 200+ cold contacts",
  },
  {
    seconds: 5,
    label: "Express",
    note: "5–9s jitter, only for warm engaged contacts",
  },
] as const;

/** `datetime-local` text for a moment, in the person's own time. */
export const localInput = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
