export type Currency = "INR" | "AED";
// Prices are held in the smallest unit (paise, fils). Whole amounts are shown without decimals: ₹2,499, AED 299.
export function formatMinor(amountMinor: number, currency: Currency) {
  const major = amountMinor / 100;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}
// Visitors in India see rupees first; everyone else sees dirhams.
export const currencyForZone = (zone: string): Currency => (zone === "Asia/Kolkata" || zone === "Asia/Calcutta" ? "INR" : "AED");
