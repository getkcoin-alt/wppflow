import { describe, expect, it } from "vitest";
import { predictSettings } from "../components/developer/otp/predict";
import { overview } from "./otpFixtures";

const o = overview();
const settings = o.settings; // login: 6 digits, 5 minutes, 5 tries, 30 s
const templates = o.templates;

describe("what the server will answer to a settings change", () => {
  it("choosing another use case brings its usual numbers", () => {
    const next = predictSettings(settings, { template: "delivery" }, templates);
    expect(next).toMatchObject({ template: "delivery", codeLength: 4, ttlSeconds: 3600, maxAttempts: 5, resendSeconds: 60 });
  });

  it("choosing the same use case again changes nothing about the numbers the person has set", () => {
    const tuned = { ...settings, codeLength: 8, ttlSeconds: 900 };
    expect(predictSettings(tuned, { template: "login" }, templates)).toEqual(tuned);
  });

  it("what the same change says about the numbers wins over the use case's usual ones", () => {
    const next = predictSettings(settings, { template: "delivery", codeLength: 5 }, templates);
    expect(next).toMatchObject({ template: "delivery", codeLength: 5, ttlSeconds: 3600 });
  });

  it("changes only what it is told to", () => {
    const next = predictSettings(settings, { locale: "hi", maxAttempts: 3, resendSeconds: 120, ttlSeconds: 600, codeLength: 8, enabled: false }, templates);
    expect(next).toEqual({ ...settings, locale: "hi", maxAttempts: 3, resendSeconds: 120, ttlSeconds: 600, codeLength: 8, enabled: false });
  });

  it("a name replaces the shown one; clearing it keeps what is shown until the server says which name it falls back to", () => {
    expect(predictSettings(settings, { brand: "  Noor Clinic " }, templates)).toMatchObject({ brand: "Noor Clinic", brandResolved: "Noor Clinic" });
    expect(predictSettings({ ...settings, brand: "Old", brandResolved: "Old" }, { brand: "" }, templates)).toMatchObject({ brand: "", brandResolved: "Old" });
  });

  it("choosing a number, or none", () => {
    expect(predictSettings(settings, { sessionName: "main-line" }, templates).sessionName).toBe("main-line");
    expect(predictSettings({ ...settings, sessionName: "main-line" }, { sessionName: null }, templates).sessionName).toBeNull();
  });

  it("an unknown use case is left to the server to refuse", () => {
    expect(predictSettings(settings, { template: "nope" }, templates)).toEqual(settings);
  });

  it("does not change what it was given", () => {
    const before = JSON.stringify(settings);
    predictSettings(settings, { template: "delivery", locale: "ar" }, templates);
    expect(JSON.stringify(settings)).toBe(before);
  });
});
