import { describe, expect, it } from "vitest";
import { buildAgentPrompt, durationText, whatIsMissing, SECRET_ENV, type AgentPromptInput } from "../components/developer/otp/agentPrompt";
import { overview } from "./otpFixtures";
import type { OtpKey } from "../services/api";

const key = (over: Partial<OtpKey> = {}): OtpKey => ({ id: "k1", name: "My site", kind: "secret", mode: "live", prefix: "otp_sk_live_ab12", allowedOrigins: [], createdAt: "2026-11-08T05:00:00Z", lastUsedAt: null, revokedAt: null, ...over });
const ALL_TEMPLATES = ["login", "signup", "reset", "payment", "delivery", "booking", "change", "verify"].map((k) => ({ key: k, title: k[0].toUpperCase() + k.slice(1), blurb: `Blurb for ${k}.`, defaults: { codeLength: 6, ttlSeconds: 300, maxAttempts: 5, resendSeconds: 30 } }));
const build = (over: Partial<AgentPromptInput["overview"]> = {}, extra: Partial<AgentPromptInput> = {}) =>
  buildAgentPrompt({ overview: { ...overview(), templates: ALL_TEMPLATES, ...over }, base: "https://app.scriwo.com", appBase: "https://app.scriwo.com", ...extra });

describe("the prompt for a coding agent", () => {
  it("carries every choice made on the page", () => {
    const p = build({ settings: { ...overview().settings, template: "payment", brandResolved: "Noor Clinic", locale: "ar", codeLength: 8, ttlSeconds: 90, maxAttempts: 3, resendSeconds: 120, enabled: true } });
    expect(p).toContain("**Payment**");
    expect(p).toContain("Blurb for payment.");
    expect(p).toContain("**Noor Clinic**");
    expect(p).toContain("العربية (ar)");
    expect(p).toContain("**8 digits**");
    expect(p).toContain("**90 seconds**");
    expect(p).toContain("**3 tries**");
    expect(p).toContain("**2 minutes**");
    expect(p).toContain("**100 codes a day**");
    expect(p).toContain("**1,000 a month**");
    expect(p).toContain("**3 codes every 10 minutes**");
    expect(p).toContain("switched on");
    expect(p).toContain('"expiresIn":90,"resendAfter":120');
  });

  it("says when codes are paused", () => {
    expect(build({ settings: { ...overview().settings, enabled: false } })).toContain("**paused**");
  });

  it("gives the exact API: both calls, the idempotency key, the uncertain answer and the reasons", () => {
    const p = build();
    for (const part of [
      "POST https://app.scriwo.com/api/otp/send",
      "POST https://app.scriwo.com/api/otp/verify",
      "Authorization: Bearer $SCRIWO_OTP_SECRET_KEY",
      "Idempotency-Key",
      '"state": "uncertain"',
      "`wrong_code`, `expired`, `too_many_attempts`, `already_used`, `superseded`, `not_sent`",
      "A code works **once**",
      "attemptsLeft",
      "retryAfter",
      "up to 80 characters",
      "POST https://app.scriwo.com/api/otp/proof/verify",
      'their send answer also carries `"test": true` and the code itself, for your tests only',
      'curl -X POST https://app.scriwo.com/api/otp/send -H "Authorization: Bearer $SCRIWO_OTP_SECRET_KEY"',
      "whatever the verification was for",
    ])
      expect(p, part).toContain(part);
  });

  it("explains what to do for every error code the service can answer with", () => {
    const p = build();
    for (const code of ["invalid_phone", "not_on_whatsapp", "resend_too_soon", "too_many_requests", "busy", "rate_limited", "quota_exceeded", "no_number_connected", "number_offline", "otp_paused", "otp_suspended", "otp_unavailable", "delivery_failed", "missing_key", "invalid_key", "wrong_key_kind", "wrong_code", "expired", "too_many_attempts", "superseded", "not_sent", "already_used"])
      expect(p, code).toContain(`\`${code}\``);
  });

  it("sizes the example code to the digits chosen", () => {
    expect(build({ settings: { ...overview().settings, codeLength: 4 } })).toContain('"code": "4829"');
    expect(build({ settings: { ...overview().settings, codeLength: 8 } })).toContain('"code": "48291300"');
  });

  it("puts each use case in the right place of a project, and says what reference to use", () => {
    const places = new Map<string, string>();
    for (const t of ALL_TEMPLATES) {
      const p = build({ settings: { ...overview().settings, template: t.key } });
      expect(p).toContain(`**${t.title}**`);
      places.set(t.key, p.split("\n").find((l) => l.startsWith("It belongs in")) || "");
    }
    expect(new Set(places.values()).size).toBe(ALL_TEMPLATES.length);
    expect(places.get("login")).toMatch(/before .*session|session is never created/i);
    expect(places.get("payment")).toMatch(/this very payment/);
    expect(places.get("change")).toMatch(/CURRENT phone number/);
    expect(build({ settings: { ...overview().settings, template: "payment" } })).toMatch(/required here: it ties the code to the payment/);
  });

  describe("secrets", () => {
    it("never includes a secret key, and says where it goes", () => {
      const p = build({ keys: [key(), key({ id: "k2", name: "Testing", mode: "test", prefix: "otp_sk_test_ef56" })] });
      expect(p).not.toMatch(/otp_sk_(live|test)_[0-9a-f]{40}/);
      expect(p).toContain(`\`${SECRET_ENV}\``);
      expect(p).toContain("It is not in this prompt on purpose");
      expect(p).toContain("Never write it into source code");
      // the keys on the account are named by their start only
      expect(p).toContain("My site (secret, live, starts otp_sk_live_ab12…)");
      expect(p).toContain("Testing (secret, test, starts otp_sk_test_ef56…)");
    });

    it("does not include a secret key even if one is handed in by mistake as the public one", () => {
      const secret = `otp_sk_live_${"c".repeat(40)}`;
      const p = build({ keys: [key({ prefix: "otp_sk_live_cccc" })] }, { publicKey: secret });
      expect(p).not.toContain(secret);
    });

    it("includes a widget key made on this visit (public by design) and only while it is still live", () => {
      const pub = `otp_pk_live_${"a".repeat(40)}`;
      const k = key({ id: "k7", kind: "public", prefix: "otp_pk_live_aaaa", allowedOrigins: ["https://shop.example.com"] });
      expect(build({ keys: [k] }, { publicKey: pub })).toContain(`key: "${pub}"`);
      expect(build({ keys: [{ ...k, revokedAt: "2026-11-09T00:00:00Z" }] }, { publicKey: pub })).not.toContain(pub);
      expect(build({ keys: [] }, { publicKey: pub })).not.toContain(pub);
      expect(build({ keys: [k] })).not.toContain(pub);
    });

    it("never names a revoked key as one the account has", () => {
      const p = build({ keys: [key({ name: "Old key", revokedAt: "2026-11-01T00:00:00Z" })] });
      expect(p).not.toContain("Old key");
      expect(p).toContain("none yet");
    });
  });

  describe("how far the setup is", () => {
    it("is complete when a number is linked, a real code worked and a key exists", () => {
      const p = build({ ready: { number: true, tested: true, key: true } });
      expect(p).toContain("Complete. A number is linked");
      expect(p).toContain("that nothing is left to do on the Scriwo side");
      expect(p).not.toContain("Not complete yet");
    });

    it("says what is left, and to build with a test key meanwhile", () => {
      const p = build({ ready: { number: false, tested: false, key: true } });
      expect(p).toContain("Not complete yet.");
      expect(p).toContain("link a WhatsApp number to send the codes from; try one real code from the page");
      expect(p).not.toContain("create a key");
      expect(p).toContain("build and test with a TEST key");
      expect(p).toContain("what is still to do on the Scriwo side (link a WhatsApp number to send the codes from; try one real code from the page)");
      expect(p).toContain("(not linked yet)");
    });

    it("names the missing steps in the owner's words", () => {
      expect(whatIsMissing({ number: true, tested: true, key: true })).toEqual([]);
      expect(whatIsMissing({ number: false, tested: false, key: false })).toEqual(["link a WhatsApp number to send the codes from", "try one real code from the page", "create a key"]);
    });
  });

  describe("the widget and the webhook", () => {
    it("names the websites the widget key works on, and where the script is served from", () => {
      const p = build({ keys: [key({ id: "k7", kind: "public", prefix: "otp_pk_live_aaaa", allowedOrigins: ["https://shop.example.com", "https://www.shop.example.com"] })] });
      expect(p).toContain("`https://shop.example.com`, `https://www.shop.example.com`");
      expect(p).toContain('<script src="https://app.scriwo.com/otp.js"></script>');
      expect(p).not.toContain('api: "');
      expect(p).toContain("A proof works once, within 10 minutes");
    });

    it("says where the API is when it is not where the script is (a developer's machine)", () => {
      const p = build({}, { base: "http://localhost:8090", appBase: "http://localhost:5173" });
      expect(p).toContain('<script src="http://localhost:5173/otp.js"></script>');
      expect(p).toContain('api: "http://localhost:8090"');
      expect(p).toContain("POST http://localhost:8090/api/otp/send");
    });

    it("tells the owner how to get a widget key when there is none", () => {
      expect(build()).toContain("none yet. The owner creates one under Developers, Free OTP");
    });

    it("explains the webhook, its signature and its address, without the secret, when one is set", () => {
      const p = build({ webhook: { id: "w1", url: "https://example.com/otp-events", createdAt: "2026-11-09T00:00:00Z" } });
      expect(p).toContain("`https://example.com/otp-events`");
      expect(p).toContain("X-Scriwo-Signature");
      expect(p).toContain("X-Scriwo-Timestamp");
      expect(p).toContain("HMAC-SHA256");
      expect(p).toContain("<timestamp>.<raw request body>");
      expect(p).toContain("SCRIWO_OTP_WEBHOOK_SECRET");
      expect(p).toContain("The code is never in an event");
      expect(p).toContain("`SCRIWO_OTP_WEBHOOK_SECRET`)");
    });

    it("leaves the webhook out of the list of variables when there is none", () => {
      const p = build();
      expect(p).toContain("None is set and none is needed");
      expect(p).not.toContain("`SCRIWO_OTP_WEBHOOK_SECRET`)");
    });
  });

  it("states the rules a careful engineer follows", () => {
    const p = build();
    for (const rule of ["checked on the server, with the secret key", "Never log a code, a key, or a full phone number", "Rate-limit it per IP and per session", "Do not reveal whether an account exists", "no SMS fallback", "123456"]) expect(p, rule).toContain(rule);
  });

  it("is honest that it is not the official WhatsApp Business API", () => {
    expect(build()).toContain("It is not the official WhatsApp Business API");
  });

  it("is a sensible size for a prompt", () => {
    const p = build({ webhook: { id: "w", url: "https://example.com/e", createdAt: "x" }, keys: [key({ kind: "public", prefix: "otp_pk_live_aaaa", allowedOrigins: ["https://a.example.com"] })] });
    expect(p.length).toBeGreaterThan(5000);
    expect(p.length).toBeLessThan(16000);
  });
});

describe("durations in words", () => {
  it("reads a time the way a person would say it", () => {
    expect(durationText(30)).toBe("30 seconds");
    expect(durationText(1)).toBe("1 second");
    expect(durationText(60)).toBe("1 minute");
    expect(durationText(90)).toBe("90 seconds");
    expect(durationText(300)).toBe("5 minutes");
    expect(durationText(3600)).toBe("1 hour");
    expect(durationText(7200)).toBe("2 hours");
  });
});
