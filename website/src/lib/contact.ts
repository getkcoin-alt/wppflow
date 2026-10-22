export const INTERESTS = [
  { value: "demo", label: "A demo for my team" },
  { value: "pricing", label: "Pricing and a quote" },
  { value: "starter", label: "Start the Starter plan" },
  { value: "growth", label: "Start the Growth plan" },
  { value: "business", label: "Start the Business plan" },
  { value: "enterprise", label: "Enterprise" },
  { value: "partner", label: "Partnership or reselling" },
  { value: "support", label: "Help with my account" },
  { value: "general", label: "Something else" },
] as const;

export const COUNTRIES = ["United Arab Emirates", "India", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "Bahrain", "Other"];
export const TEAM_SIZES = ["1-3", "4-10", "11-25", "26-50", "51+"];

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  teamSize: string;
  interest: string;
  message: string;
};

/** Mirrors the server's checks so people see problems before sending. The server is still the authority. */
export function validateContact(v: ContactInput): Partial<Record<keyof ContactInput, string>> {
  const errors: Partial<Record<keyof ContactInput, string>> = {};
  if (!v.name.trim()) errors.name = "Please tell us your name.";
  if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) errors.email = "Please enter a valid email address.";
  if (v.phone.trim() && !/^[+\d][\d\s()-]{5,}$/.test(v.phone.trim())) errors.phone = "Please include the country code, for example +971 50 123 4567.";
  if (v.message.length > 4000) errors.message = "Please keep the message under 4,000 characters.";
  return errors;
}
