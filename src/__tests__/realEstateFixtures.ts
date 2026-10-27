import type { ReAlert, ReMatch, ReMatches, ReMeta, ReOverview, ReProperty, ReViewing } from "../services/realEstate";

export const META: ReMeta = {
  leadTypes: ["buyer", "tenant", "landlord", "seller", "investor"],
  qualificationStatuses: ["new", "in_progress", "qualified", "disqualified"],
  propertyTypes: ["apartment", "villa", "townhouse", "penthouse", "duplex", "studio", "office", "shop", "warehouse", "land"],
  propertyStatuses: ["draft", "available", "reserved", "sold", "rented", "withdrawn"],
  timelines: ["immediate", "1_month", "3_months", "6_months", "later", "unknown"],
  currencies: ["AED", "USD", "EUR", "GBP", "INR"],
  settings: { timezone: "Asia/Dubai", freshnessDays: 14, viewingMinutes: 45 },
};

export const property = (o: Partial<ReProperty> = {}): ReProperty => ({
  id: "p1", reference: "DM-101", title: "Marina view", purpose: "sale", status: "available", price: 1400000, currency: "AED", rentPeriod: null, community: "Dubai Marina",
  propertyType: "apartment", bedrooms: 2, bathrooms: 2, sizeSqft: 1100, furnished: null, availableFrom: null, listingUrl: "https://listings.example.test/dm-101", permitNumber: "",
  media: [], agentUserId: null, agentName: "", lastVerifiedAt: new Date().toISOString(), verification: "fresh", verifiedDaysAgo: 0, ...o,
});

export const match = ({ property: p, ...o }: Omit<Partial<ReMatch>, "property"> & { property?: Partial<ReProperty> } = {}): ReMatch => ({
  property: property(p),
  reasons: ["For sale", "AED 1,400,000 is within the AED 1,500,000 budget", "In Dubai Marina, as wanted"],
  warnings: [],
  verification: "fresh",
  shareText: "DM-101: 2 bed, apartment, Dubai Marina, AED 1,400,000\nhttps://listings.example.test/dm-101",
  ...o,
});

export const matches = (o: Partial<ReMatches> = {}): ReMatches => ({ eligible: true, reason: null, requirements: ["budget", "area"], total: 1, candidates: 4, leftOut: {}, freshnessDays: 14, matches: [match()], ...o });

export const viewing = (o: Partial<ReViewing> = {}): ReViewing => ({
  id: "v1", leadId: "l1", leadName: "Aisha Khan", propertyId: "p1", propertyReference: "DM-101", propertyTitle: "Marina view", community: "Dubai Marina", agentUserId: 2, agentName: "Sam Agent",
  startsAt: new Date(Date.now() + 3 * 86400000).toISOString(), endsAt: new Date(Date.now() + 3 * 86400000 + 2700000).toISOString(), timeZone: "Asia/Dubai",
  local: { date: "2026-11-05", time: "16:00", endTime: "16:45", text: "Thu 5 Nov 2026, 16:00" }, status: "scheduled", notes: "", cancelReason: "", allowed: ["confirmed", "completed", "cancelled", "no_show"], ...o,
});

export const alert = (o: Partial<ReAlert> = {}): ReAlert => ({
  id: "a1", kind: "unassigned_lead", severity: "medium", status: "open", title: "No one owns Aisha Khan", reason: "Nobody is responsible for this lead, and it came in 6 hours ago. The target is 15 minutes.",
  leadId: "l1", conversationId: "chat-1", leadName: "Aisha Khan", stageName: "New", ownerName: "", valueAtRisk: 900000, currency: "AED", snoozedUntil: null, firstSeenAt: new Date().toISOString(), ...o,
});

export const overview = (o: Partial<ReOverview> = {}): ReOverview => ({
  windowDays: 30, currency: "AED",
  values: {
    pipeline: { amount: 5000000, leads: 4, meaning: "hypothetical", note: "What open leads are worth if they all close. Not revenue." },
    atRisk: { amount: 900000, leads: 1, meaning: "hypothetical", note: "The value of open leads that have a revenue leak. Not revenue." },
    won: { amount: 1000000, deals: 1, meaning: "recorded", note: "The value recorded on leads marked won in the last 30 days." },
  },
  lost: 0,
  alerts: { open: 1, high: 0, byKind: { unassigned_lead: 1, overdue_followup: 0, response_overdue: 0, missing_next_action: 0, stalled_lead: 0, failed_automation: 0 } },
  funnel: { note: "Leads that came in during the last 30 days, and how far they have got since.", enquiries: 10, qualified: 5, viewingBooked: 3, viewingHeld: 2, won: 1, rates: { qualified: 50, viewingBooked: 30, viewingHeld: 20, won: 10 } },
  upcomingViewings: 2, ...o,
});
