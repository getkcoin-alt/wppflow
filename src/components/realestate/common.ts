import { useQuery } from "@tanstack/react-query";
import { getStoredTenantId } from "../../services/api";
import { reMeta, type AlertKind } from "../../services/realEstate";

export const reKey = (...parts: unknown[]) => [
  "re",
  getStoredTenantId(),
  ...parts,
];
export const errorOf = (e: unknown) =>
  (e as Error)?.message || "Something went wrong. Try again.";
export const useReMeta = () =>
  useQuery({
    queryKey: reKey("meta"),
    queryFn: reMeta,
    staleTime: 5 * 60 * 1000,
  });

export const LEAD_TYPE_LABEL: Record<string, string> = {
  buyer: "Buyer",
  tenant: "Tenant",
  landlord: "Landlord",
  seller: "Seller",
  investor: "Investor",
};
export const TIMELINE_LABEL: Record<string, string> = {
  immediate: "As soon as possible",
  "1_month": "Within a month",
  "3_months": "Within 3 months",
  "6_months": "Within 6 months",
  later: "Later than that",
  unknown: "Not known yet",
};
export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "Being qualified",
  qualified: "Qualified",
  disqualified: "Not a fit",
};
export const PROPERTY_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  rented: "Rented",
  withdrawn: "Withdrawn",
};
export const VIEWING_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
};
export const ALERT_LABEL: Record<AlertKind, string> = {
  unassigned_lead: "Nobody owns it",
  overdue_followup: "Follow-up overdue",
  response_overdue: "Customer waiting",
  missing_next_action: "No next step",
  stalled_lead: "Gone quiet",
  failed_automation: "Automation failing",
};
export const LEFT_OUT_LABEL: Record<string, string> = {
  budget: "over the budget",
  bedrooms: "a different number of bedrooms",
  type: "a different property type",
  area: "in a different area",
  currency: "priced in another currency",
};

export const bedroomsText = (n: number | null) =>
  n === null ? "" : n === 0 ? "Studio" : `${n} bed`;

export const splitList = (text: string) =>
  text
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
