import { describe, it, expect } from "vitest";
import { LANGS, PUBLIC_PLACEHOLDER, SECRET_PLACEHOLDER, proofSnippet, serverSnippet, widgetSnippet } from "../components/developer/otp/snippets";

const BASE = "https://app.scriwo.com";
const KEY = `otp_sk_live_${"a".repeat(40)}`;

describe("the code a developer pastes", () => {
  it("every language calls send and then verify, on the address and with the key", () => {
    for (const { key } of LANGS) {
      const code = serverSnippet(key, { base: BASE, key: KEY });
      expect(code, key).toContain(`${BASE}/api/otp`);
      expect(code, key).toContain(KEY);
      expect(code, key).toMatch(/send/);
      expect(code, key).toMatch(/verify/);
      expect(code, key).not.toContain(SECRET_PLACEHOLDER);
    }
  });

  it("without a key it shows a plain placeholder, never a made-up key", () => {
    for (const { key } of LANGS) {
      const code = serverSnippet(key, { base: BASE });
      expect(code, key).toContain(SECRET_PLACEHOLDER);
      expect(code, key).not.toMatch(/otp_sk_/);
    }
  });

  it("the languages are the ones people use, the simplest first", () => {
    expect(LANGS.map((l) => l.label)).toEqual(["Node.js", "Python", "PHP", "Java", "cURL", "No-code"]);
  });

  it("the Node.js example reads the answer the way the API gives it", () => {
    const code = serverSnippet("node", { base: BASE, key: KEY });
    expect(code).toContain("sent.id");
    expect(code).toContain("check.valid");
    expect(code).toContain("check.reason");
  });

  it("the no-code steps are fields to type into an HTTP step, not code", () => {
    const text = serverSnippet("nocode", { base: BASE, key: KEY });
    expect(text).toContain(`URL:     ${BASE}/api/otp/send`);
    expect(text).toContain(`Header:  Authorization = Bearer ${KEY}`);
    expect(text).toContain("Then:    continue only if  valid  is  true");
  });

  it("the widget needs one script and one call, with the public key", () => {
    const html = widgetSnippet({ base: BASE, key: `otp_pk_live_${"b".repeat(40)}` });
    expect(html).toContain(`<script src="${BASE}/otp.js"></script>`);
    expect(html).toContain(`key: "otp_pk_live_${"b".repeat(40)}"`);
    expect(html).toContain("ScriwoOTP.verify");
    expect(html).toContain("onVerified");
    expect(widgetSnippet({ base: BASE })).toContain(PUBLIC_PLACEHOLDER);
  });

  it("the server's check of a proof uses the secret key and says a proof works once", () => {
    const code = proofSnippet({ base: BASE, key: KEY });
    expect(code).toContain(`${BASE}/api/otp/proof/verify`);
    expect(code).toContain(KEY);
    expect(code).toContain("A proof works once, for ten minutes.");
  });
});
