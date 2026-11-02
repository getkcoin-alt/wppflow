/** "Good morning" by the person's own clock. */
export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** The end of the person's own day, as the server needs it to decide what is "today". */
export function endOfToday(now = new Date()): string {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One calm sentence about the state of the day, written by rules so it is instant and always right. */
export function dayLine(c: { waiting: number; overdue: number; tasksDue: number; tasksOverdue: number; numbersNeedingCare: number }, targetMinutes: number): string {
  const parts: string[] = [];
  if (c.waiting) parts.push(`${plural(c.waiting, "customer is", "customers are")} waiting for a reply${c.overdue ? `, ${c.overdue} past your ${targetMinutes}-minute target` : ""}`);
  if (c.tasksDue) parts.push(`${plural(c.tasksDue, "follow-up is", "follow-ups are")} due today${c.tasksOverdue ? `, ${c.tasksOverdue} late` : ""}`);
  if (c.numbersNeedingCare) parts.push(`${plural(c.numbersNeedingCare, "number needs", "numbers need")} care`);
  if (!parts.length) return "You're all caught up. Nothing is waiting for you.";
  const text = parts.join(". ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}
