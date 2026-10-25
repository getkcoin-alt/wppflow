import type { AssignmentSettings } from "../services/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES = DAYS;

// "Mon to Fri", "Mon, Wed and Sat": the days said the way people say them.
export function sayDays(days: number[]): string {
  const d = [...days].sort((a, b) => a - b);
  if (d.length === 7) return "every day";
  if (d.join() === [1, 2, 3, 4, 5].join()) return "Mon to Fri";
  if (d.join() === [1, 2, 3, 4, 5, 6].join()) return "Mon to Sat";
  const names = d.map((x) => DAYS[x]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] || "no days";
}

// What the company's rule for new chats does, in one sentence.
export function describeRule(s: AssignmentSettings): string {
  if (!s.enabled) return "New chats wait in the inbox until someone takes them.";
  const people = s.members.filter((m) => m.inRotation).length;
  const numbers = s.sessionNames.length;
  return (
    `${s.mode === "least_busy" ? "Each new chat goes to the person with the fewest open chats" : "New chats go round the team in turn"}, ` +
    `${people} ${people === 1 ? "person" : "people"}${s.team ? ` in ${s.team}` : ""}, on ${numbers} ${numbers === 1 ? "number" : "numbers"}` +
    (s.maxOpen ? `, up to ${s.maxOpen} open chats each` : "") +
    (s.useHours ? `. Only ${sayDays(s.workDays)}, ${s.workStart} to ${s.workEnd} (${s.timezone})` : "") +
    "."
  );
}
