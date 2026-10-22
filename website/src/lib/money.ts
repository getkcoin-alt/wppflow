export type Currency = "AED" | "INR";

export const formatMoney = (n: number, cur: Currency) =>
  new Intl.NumberFormat(cur === "AED" ? "en-AE" : "en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

/** Visitors in India see rupees first; everyone else sees dirhams. */
export const currencyForZone = (zone: string): Currency => (zone === "Asia/Kolkata" || zone === "Asia/Calcutta" ? "INR" : "AED");
