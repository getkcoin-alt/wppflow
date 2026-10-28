const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", ""]);
// On any hosted address (app.scriwo.com, a Vercel preview) the app talks to the backend
// through its own address, where Vercel forwards /api and /health. Only a developer machine uses
// localhost. Matching on "vercel.app" alone sent every custom domain to the visitor's own computer.
export const backendBaseFor = (hostname: string, configured?: string) =>
  configured || (LOCAL_HOSTS.has(hostname) ? "http://localhost:8080" : "");

/**
 * An address the server gave for a file it serves, such as a profile picture ("/api/avatars/…"). It is relative to the
 * API, so on a developer machine it needs the API's own origin; on a hosted address it is already right.
 */
export function assetUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return `${backendBaseFor(host, import.meta.env.VITE_BACKEND_URL).replace(/\/$/, "")}${path}`;
}
