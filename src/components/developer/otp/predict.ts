import type { OtpSettings, OtpSettingsPatch, OtpTemplate } from "../../../services/api";

/**
 * What the server will answer to a settings change, worked out here so the page can show it at once instead of after a round trip.
 * It mirrors the server's rule: choosing a different use case sets its usual digits, expiry, tries and resend wait, and anything the
 * same change says about those wins. When the server answers, its answer replaces this, so a wrong guess only lasts a moment.
 */
export function predictSettings(current: OtpSettings, patch: OtpSettingsPatch, templates: OtpTemplate[]): OtpSettings {
  const next: OtpSettings = { ...current };
  if (patch.template !== undefined) {
    const chosen = templates.find((t) => t.key === patch.template);
    if (chosen) {
      if (chosen.key !== current.template) Object.assign(next, chosen.defaults);
      next.template = chosen.key;
    }
  }
  if (patch.enabled !== undefined) next.enabled = Boolean(patch.enabled);
  if (patch.locale !== undefined) next.locale = patch.locale;
  if (patch.codeLength !== undefined) next.codeLength = patch.codeLength;
  if (patch.ttlSeconds !== undefined) next.ttlSeconds = patch.ttlSeconds;
  if (patch.maxAttempts !== undefined) next.maxAttempts = patch.maxAttempts;
  if (patch.resendSeconds !== undefined) next.resendSeconds = patch.resendSeconds;
  if (patch.sessionName !== undefined) next.sessionName = patch.sessionName || null;
  if (patch.brand !== undefined) {
    const brand = String(patch.brand ?? "").trim();
    next.brand = brand;
    // an empty name means "use the company's", which only the server knows: until it answers, keep what is shown
    if (brand) next.brandResolved = brand;
  }
  return next;
}
