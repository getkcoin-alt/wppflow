// Monogram avatars: a quiet, stable tint per person so a long list is easy to scan.
// A restrained jewel-and-graphite set that looks right on both the light and dark themes.
const PALETTE: Array<[string, string, string]> = [
  ["#14382f", "#0b241e", "#7fe0bd"], // emerald
  ["#2a2f45", "#1b1e2e", "#a3b4ff"], // sapphire
  ["#45312a", "#2b1d18", "#f0b99b"], // copper
  ["#3b2a45", "#251a2e", "#d4a8ff"], // amethyst
  ["#423a22", "#2a2514", "#e6cf86"], // champagne
  ["#183a42", "#0e252b", "#73d6e8"], // lagoon
  ["#452a35", "#2d1a22", "#f2a6bf"], // rose quartz
  ["#2f3a2a", "#1e2619", "#b7e08a"], // moss
];
const GROUP: [string, string, string] = ["#2a2c30", "#17181a", "#c9ccd1"]; // graphite

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function safeAvatarFallback(
  name: string,
  isGroup: boolean = false,
): string {
  let initials = "";
  try {
    const sanitized = (name || "").replace(/[\uD800-\uDFFF]/g, "").trim();
    const match = sanitized.match(/([a-zA-Z0-9ऀ-ॿ])/g);
    if (match && match.length > 0)
      initials = match.slice(0, 2).join("").toUpperCase();
  } catch {}
  if (!initials) initials = isGroup ? "GP" : "WA";
  const [top, bottom, ink] = isGroup
    ? GROUP
    : PALETTE[hash(name || "") % PALETTE.length];
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${top}'/><stop offset='1' stop-color='${bottom}'/></linearGradient></defs>` +
    `<rect width='100' height='100' rx='50' fill='url(#g)'/>` +
    `<text x='50' y='62' font-family='-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif' font-size='36' font-weight='600' fill='${ink}' text-anchor='middle' letter-spacing='-1'>${initials.slice(0, 2).replace(/[<>&]/g, "")}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
