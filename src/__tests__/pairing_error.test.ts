import { describe, it, expect } from "vitest";
import { friendlyPairingError } from "../utils/pairingError";

describe("pairing errors", () => {
  it("explains a browser that is still shutting down instead of showing server paths", () => {
    const raw =
      "The browser is already running for /opt/wppflow-backend/tokens/tenant_tenant_1_93e_staff-9/tenant_tenant_1_93e_staff-9. Use a different `userDataDir` or stop the running browser first.";
    const text = friendlyPairingError(raw);
    expect(text).toMatch(/still shutting down/);
    expect(text).not.toContain("/opt/");
  });

  it("strips file paths from any other message and keeps the rest", () => {
    expect(
      friendlyPairingError("Cannot open /opt/app/tokens/x/y.json now"),
    ).toBe("Cannot open … now");
    expect(friendlyPairingError("QR code expired. Try again.")).toBe(
      "QR code expired. Try again.",
    );
    expect(friendlyPairingError("")).toMatch(/try again/i);
    expect(friendlyPairingError(null)).toMatch(/try again/i);
  });
});
