// What a person pairing a number should read: plain language, never server file paths.
export function friendlyPairingError(message?: string | null): string {
  const text = String(message || "");
  if (/already running/i.test(text))
    return "The previous connection for this number was still shutting down. Please try again.";
  return (
    text.replace(/(?:\/[\w.@:+-]+){2,}\/?/g, "…").trim() ||
    "Something went wrong. Please try again."
  );
}
