// "45 s", "12 min", "3.5 h", "2.1 days": a wait said the way people say it.
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "No data yet";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(seconds < 36000 ? 1 : 0)} h`;
  return `${(seconds / 86400).toFixed(1)} days`;
}
export const isoDay = (offset = 0, from = new Date()) => {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + offset));
  return d.toISOString().slice(0, 10);
};
