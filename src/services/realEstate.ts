import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

// Scriwo Real Estate: the calls the screens make. Every one goes to /api/solutions/real_estate, which the server only
// opens for companies that have been given the solution.
const base = "/api/solutions/real_estate";

export type LeadType = "buyer" | "tenant" | "landlord" | "seller" | "investor";
export type Timeline =
  | "immediate"
  | "1_month"
  | "3_months"
  | "6_months"
  | "later"
  | "unknown";
export type QualificationStatus =
  | "new"
  | "in_progress"
  | "qualified"
  | "disqualified";

export interface ReMeta {
  leadTypes: LeadType[];
  qualificationStatuses: QualificationStatus[];
  propertyTypes: string[];
  propertyStatuses: string[];
  timelines: Timeline[];
  currencies: string[];
  settings: {
    timezone: string;
    freshnessDays: number;
    viewingMinutes: number;
  } & Record<string, string | number>;
}

export interface ReProfile {
  leadId: string;
  leadType: LeadType | null;
  intent: "buy" | "rent" | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string | null;
  communities: string[];
  propertyTypes: string[];
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  timeline: Timeline | null;
  sourceDetail: string;
  qualificationStatus: QualificationStatus;
  disqualifiedReason: string;
  nextAction: string;
  notes: string;
  qualifiedAt: string | null;
}
export type ProfileInput = Partial<Omit<ReProfile, "leadId" | "qualifiedAt">>;

export interface ReProperty {
  id: string;
  reference: string;
  title: string;
  purpose: "sale" | "rent";
  status: "draft" | "available" | "reserved" | "sold" | "rented" | "withdrawn";
  price: number | null;
  currency: string;
  rentPeriod: "year" | "month" | null;
  community: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqft: number | null;
  furnished: "furnished" | "partly" | "unfurnished" | null;
  availableFrom: string | null;
  listingUrl: string;
  permitNumber: string;
  media: {
    kind: "photo" | "floorplan" | "brochure" | "video";
    url: string;
    caption: string;
  }[];
  agentUserId: number | null;
  agentName: string;
  lastVerifiedAt: string | null;
  verification: "fresh" | "stale" | "never";
  verifiedDaysAgo: number | null;
}
export type PropertyInput = Partial<
  Omit<
    ReProperty,
    "id" | "verification" | "verifiedDaysAgo" | "lastVerifiedAt" | "agentName"
  >
>;

export interface ReMatch {
  property: ReProperty;
  reasons: string[];
  warnings: string[];
  verification: "fresh" | "stale" | "never";
  shareText: string;
}
export interface ReMatches {
  eligible: boolean;
  reason: string | null;
  requirements: string[];
  total: number;
  candidates: number;
  leftOut: Record<string, number>;
  freshnessDays: number;
  matches: ReMatch[];
}

export interface ReViewing {
  id: string;
  leadId: string;
  leadName: string;
  propertyId: string;
  propertyReference: string;
  propertyTitle: string;
  community: string;
  agentUserId: number;
  agentName: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  local: { date: string; time: string; endTime: string; text: string };
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string;
  cancelReason: string;
  allowed: string[];
}

export type AlertKind =
  | "unassigned_lead"
  | "overdue_followup"
  | "response_overdue"
  | "missing_next_action"
  | "stalled_lead"
  | "failed_automation";
export interface ReAlert {
  id: string;
  kind: AlertKind;
  severity: "high" | "medium" | "low";
  status: "open" | "snoozed" | "resolved";
  title: string;
  reason: string;
  leadId: string | null;
  conversationId: string | null;
  leadName: string;
  stageName: string;
  ownerName: string;
  valueAtRisk: number;
  currency: string;
  snoozedUntil: string | null;
  firstSeenAt: string;
}
export interface ReOverview {
  windowDays: number;
  currency: string;
  values: {
    pipeline: { amount: number; leads: number; meaning: string; note: string };
    atRisk: { amount: number; leads: number; meaning: string; note: string };
    won: { amount: number; deals: number; meaning: string; note: string };
  };
  lost: number;
  alerts: { open: number; high: number; byKind: Record<AlertKind, number> };
  funnel: {
    note: string;
    enquiries: number;
    qualified: number;
    viewingBooked: number;
    viewingHeld: number;
    won: number;
    rates: Record<
      "qualified" | "viewingBooked" | "viewingHeld" | "won",
      number | null
    >;
  };
  upcomingViewings: number;
}

export interface ReProposal {
  status: "proposal";
  note: string;
  proposal: ProfileInput;
  evidence: Record<string, string>;
  changes: string[];
  rejected: { field: string; reason: string }[];
  conflict: string | null;
  missing: string[];
  uncertain: string[];
  summary: string;
}
export interface NextAction {
  code: string;
  text: string;
  why: string;
}

export const reMeta = (): Promise<ReMeta> => apiGet(`${base}/meta`);
export const reOverview = (days = 30): Promise<ReOverview> =>
  apiGet(`${base}/overview?days=${days}`);
export const reAlerts = (
  status: "open" | "snoozed" | "resolved" = "open",
): Promise<{ alerts: ReAlert[] }> => apiGet(`${base}/alerts?status=${status}`);
export const reScan = () => apiPost(`${base}/alerts/scan`, {});
export const reAlertAction = (
  id: string,
  action: "resolve" | "dismiss" | "snooze",
  body: object = {},
) => apiPost(`${base}/alerts/${encodeURIComponent(id)}/${action}`, body);

export const reProfile = (
  leadId: string,
): Promise<{ profile: ReProfile | null; missing: string[] }> =>
  apiGet(`${base}/leads/${encodeURIComponent(leadId)}/profile`);
export const reSaveProfile = (
  leadId: string,
  input: ProfileInput & { assisted?: boolean },
): Promise<{ profile: ReProfile; missing: string[]; changed: string[] }> =>
  apiPut(`${base}/leads/${encodeURIComponent(leadId)}/profile`, input);
export const reMatches = (leadId: string): Promise<ReMatches> =>
  apiGet(`${base}/leads/${encodeURIComponent(leadId)}/matches`);
export const reNextActions = (
  leadId: string,
): Promise<{ actions: NextAction[] }> =>
  apiGet(`${base}/leads/${encodeURIComponent(leadId)}/next-actions`);
export const reProposal = (leadId: string): Promise<ReProposal> =>
  apiPost(`${base}/leads/${encodeURIComponent(leadId)}/ai/qualification`, {});
export const reDraft = (
  leadId: string,
  tone: string,
): Promise<{ text: string; references: string[]; note: string }> =>
  apiPost(`${base}/leads/${encodeURIComponent(leadId)}/ai/draft`, { tone });
export const reLeadViewings = (
  leadId: string,
): Promise<{ viewings: ReViewing[] }> =>
  apiGet(`${base}/leads/${encodeURIComponent(leadId)}/viewings`);

export const reProperties = (
  f: { q?: string; status?: string; purpose?: string } = {},
): Promise<{
  properties: ReProperty[];
  total: number;
  counts: Record<string, number>;
}> => {
  const q = new URLSearchParams(
    Object.entries(f).filter(([, v]) => v) as [string, string][],
  ).toString();
  return apiGet(`${base}/properties${q ? `?${q}` : ""}`);
};
export const reCreateProperty = (
  input: PropertyInput,
): Promise<{ property: ReProperty }> => apiPost(`${base}/properties`, input);
export const reUpdateProperty = (
  id: string,
  input: PropertyInput,
): Promise<{ property: ReProperty }> =>
  apiPatch(`${base}/properties/${encodeURIComponent(id)}`, input);
export const reVerifyProperty = (
  id: string,
): Promise<{ property: ReProperty }> =>
  apiPost(`${base}/properties/${encodeURIComponent(id)}/verify`, {});
export const reDeleteProperty = (id: string) =>
  apiDelete(`${base}/properties/${encodeURIComponent(id)}`);

export const reViewings = (
  from?: string,
  to?: string,
): Promise<{ viewings: ReViewing[] }> => {
  const q = new URLSearchParams(
    Object.entries({ from, to }).filter(([, v]) => v) as [string, string][],
  ).toString();
  return apiGet(`${base}/viewings${q ? `?${q}` : ""}`);
};
export interface BookInput {
  leadId: string;
  propertyId: string;
  agentUserId?: number;
  date: string;
  time: string;
  timeZone: string;
  durationMinutes?: number;
  notes?: string;
  idempotencyKey: string;
}
export const reBook = (
  input: BookInput,
): Promise<{
  viewing: ReViewing;
  existing: boolean;
  suggestedStage: { id: string; name: string } | null;
  confirmationText: string;
}> => apiPost(`${base}/viewings`, input);
export const reViewingAction = (
  id: string,
  action: "confirm" | "complete" | "no-show" | "cancel" | "reschedule",
  body: object = {},
): Promise<{ viewing: ReViewing; confirmationText: string }> =>
  apiPost(`${base}/viewings/${encodeURIComponent(id)}/${action}`, body);
export const viewingIcsPath = (id: string) =>
  `${base}/viewings/${encodeURIComponent(id)}/calendar.ics`;
