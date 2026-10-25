import type { WhatsAppSession } from "../types";

// The name a number is stored under: what the person typed, lower-case, with anything else as a dash.
export const sessionKeyFor = (label: string) =>
  (label.trim() || "whatsapp-line").toLowerCase().replace(/[^a-z0-9]/g, "-");

type Named = Pick<WhatsAppSession, "sessionKey">;

export const nameInUse = (sessions: Named[], key: string) =>
  sessions.some((s) => String(s.sessionKey).toLowerCase() === key.toLowerCase());

// The label offered for the next number: the usual first one, then "WhatsApp 2", "WhatsApp 3"...
export function nextFreeLabel(sessions: Named[]) {
  if (!nameInUse(sessions, sessionKeyFor("Primary WhatsApp"))) return "Primary WhatsApp";
  for (let n = 2; n < 1000; n++) {
    const label = `WhatsApp ${n}`;
    if (!nameInUse(sessions, sessionKeyFor(label))) return label;
  }
  return "WhatsApp";
}
