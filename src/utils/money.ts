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

// What a customer pays on an Indian invoice, worked out the way the server does it, so a price can be judged before
// it is saved: GST is added to an exclusive price, or found inside an inclusive one.
export function gstSplit(amountMinor: number, taxMode: "exclusive" | "inclusive", rate: number) {
  if (taxMode === "inclusive") {
    const taxable = Math.round((amountMinor * 100) / (100 + rate));
    return { total: amountMinor, tax: amountMinor - taxable };
  }
  const tax = Math.round((amountMinor * rate) / 100);
  return { total: amountMinor + tax, tax };
}
