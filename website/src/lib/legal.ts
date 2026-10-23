import { SITE } from "./site";

/**
 * The business behind Scriwo, as payment gateways and customers see it. Every legal page,
 * the contact page, the footer and the structured data read from here, so the details must
 * match the GST / MCA registration exactly. Empty fields are not shown.
 */
export const LEGAL = {
  /** Registered legal name, e.g. "Scriza Technologies Private Limited". */
  legalName: "Scriza",
  /** Short name used in running text ("Scriza", "we"). */
  shortName: "Scriza",
  companySite: "https://scriza.in",
  registeredAddress: "",
  /** City whose courts have jurisdiction: the registered office's city. */
  jurisdiction: "",
  gstin: "",
  cin: "",
  supportEmail: "",
  phone: SITE.whatsappDisplay,
  /** Grievance Officer under India's IT Rules 2021 and DPDP Act 2023. */
  grievanceOfficer: { name: "", email: "" },
  supportHours: "Monday to Saturday, 10:00 to 19:00 IST (08:30 to 17:30 GST)",
  updated: "23 October 2026",
} as const;

export const POLICY_LINKS = [
  { href: "/terms", label: "Terms and conditions" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refund-policy", label: "Refund and cancellation" },
  { href: "/shipping-policy", label: "Shipping and delivery" },
] as const;

/** Business details as label/value rows, skipping any not yet filled in. */
export const businessDetails = () =>
  [
    ["Legal name", LEGAL.legalName],
    ["Registered office", LEGAL.registeredAddress],
    ["GSTIN", LEGAL.gstin],
    ["CIN", LEGAL.cin],
    ["Email", LEGAL.supportEmail],
    ["Phone and WhatsApp", LEGAL.phone],
    ["Support hours", LEGAL.supportHours],
  ].filter(([, v]) => v) as [string, string][];
