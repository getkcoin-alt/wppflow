// Scriwo sold to one industry under its own address, such as homes.scriwo.com for property agencies. It is the same app: the
// address decides the name and words on the sign-in page, which screen a new workspace opens on, and what sign-up asks the
// server to set up. Everything else is the product as it always was.

export interface VerticalCopy {
  key: "homes";
  /** What the product is called here */
  name: string;
  /** Short suffix shown after the Scriwo wordmark */
  suffix: string;
  headline: [string, string];
  intro: string;
  points: string[];
  /** The sample chat shown beside the sign-in form */
  preview: { who: string; initials: string; asks: string; answer: string; note: string };
  trialNote: string;
  /** The screen a workspace of this kind opens on */
  homeTab: "realestate";
}

export const VERTICALS: Record<string, VerticalCopy> = {
  homes: {
    key: "homes",
    name: "Scriwo Homes",
    suffix: "Homes",
    headline: ["Every property enquiry,", "captured and followed up."],
    intro: "The WhatsApp revenue system for property agencies. No lead lost in a personal chat, every buyer qualified, every viewing booked.",
    points: [
      "Buyers and renters qualified on WhatsApp, in your questions",
      "Every lead assigned, followed up and tracked to the deal",
      "Managers see which enquiries nobody has answered",
    ],
    preview: {
      who: "Rashid Al Mansoori",
      initials: "RM",
      asks: "Looking for a 2-bedroom in Dubai Marina, budget around 1.8M.",
      answer: "Welcome! Are you looking to buy or rent, and when do you plan to move?",
      note: "Qualified: buy · Marina · 2BR · AED 1.8M · this quarter",
    },
    trialNote: "14 days of everything, free. No card needed.",
    homeTab: "realestate",
  },
};

const KEY = "scriwo_vertical";

export const verticalOfHostname = (hostname: string | null | undefined): VerticalCopy | null => {
  const first = String(hostname || "").toLowerCase().split(".")[0];
  return Object.hasOwn(VERTICALS, first) ? VERTICALS[first] : null;
};

// The vertical for this visit: from the address, or (for trying it out on any address) ?vertical=homes, kept for the visit.
export function currentVertical(): VerticalCopy | null {
  if (typeof window === "undefined") return null;
  const fromHost = verticalOfHostname(window.location.hostname);
  if (fromHost) return fromHost;
  try {
    const asked = new URLSearchParams(window.location.search).get("vertical");
    if (asked && Object.hasOwn(VERTICALS, asked)) window.sessionStorage.setItem(KEY, asked);
    const kept = window.sessionStorage.getItem(KEY);
    return kept && Object.hasOwn(VERTICALS, kept) ? VERTICALS[kept] : null;
  } catch {
    return null;
  }
}
