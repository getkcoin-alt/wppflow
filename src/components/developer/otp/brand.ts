// the same rule the server applies to the name in the message, so a mistake is explained while typing
const BRAND = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} &'-]{1,29}$/u;
export const brandProblem = (value: string) => (!value.trim() || BRAND.test(value.trim()) ? "" : "Use 2 to 30 letters, numbers, spaces, & - or ' (no links, dots or symbols).");
