import { SITE } from "./site";

/**
 * The business behind Scriwo, as payment gateways and customers see it. Every legal page,
 * the contact page, the footer and the structured data read from here, so the details must
 * match the GST / MCA registration exactly. Empty fields are not shown.
 */
export const LEGAL = {
  /** Registered legal name, e.g. "Scriza Technologies Private Limited". */
  legalName: "Scriza Private Limited",
  /** Short name used in running text ("Scriza", "we"). */
  shortName: "Scriza",
  companySite: "https://scriza.in",
  registeredAddress: "488 Pandit Plaza, Sector 9, Savina, Udaipur, Rajasthan 313001, India",
  /** Principal place of business on the GST registration. */
  corporateAddress: "Ground Floor, 4-5, Logix Park, Sector 16, Noida, Uttar Pradesh 201301, India",
  /** City whose courts have jurisdiction: the registered office's city. */
  jurisdiction: "Udaipur, Rajasthan",
  gstin: "09ABICS9865M1Z8",
  cin: "U74999RJ2022PTC082624",
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
    ["Corporate office", LEGAL.corporateAddress],
    ["GSTIN", LEGAL.gstin],
    ["CIN", LEGAL.cin],
    ["Email", LEGAL.supportEmail],
    ["Phone and WhatsApp", LEGAL.phone],
    ["Support hours", LEGAL.supportHours],
  ].filter(([, v]) => v) as [string, string][];
