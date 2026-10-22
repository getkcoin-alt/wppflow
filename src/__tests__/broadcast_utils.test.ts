import { describe, it, expect } from "vitest";
import { estimate, findBlanks, localInput, previewParts, SPEEDS } from "../utils/broadcast";
import { blankRule, describeDays, endSentence, describeRule, keywordList, withOwnTimezone } from "../utils/automationText";

describe("writing a broadcast", () => {
  it("finds the parts still to be written, once each", () => {
    expect(findBlanks("Offer [your offer] until [date], again [your offer].")).toEqual(["[your offer]", "[date]"]);
    expect(findBlanks("Hi {{first_name}}, no blanks. [ ] [\n]")).toEqual(["[ ]"]);
    expect(findBlanks("")).toEqual([]);
  });

  it("shows the message as a customer sees it, with blanks marked", () => {
    const parts = previewParts("Hi {{first_name}} ({{name}}) from {{ company }}! Offer: [your offer]. {{other}}", "Bloom Florist");
    expect(parts.map((p) => p.text).join("")).toBe("Hi Aisha (Aisha Khan) from Bloom Florist! Offer: [your offer]. {{other}}");
    expect(parts.filter((p) => p.blank).map((p) => p.text)).toEqual(["[your offer]"]);
    expect(previewParts("From {{company}}", "")[0].text).toBe("From Your company");
  });

  it("says how long sending takes", () => {
    expect(estimate(1, 8)).toBe("under a minute");
    expect(estimate(5, 8)).toBe("under a minute");
    expect(estimate(31, 8)).toBe("about 4 minutes");
    expect(estimate(2, 60)).toBe("about 1 minute");
    expect(estimate(500, 8)).toBe("about 1 hour 7 min");
    expect(estimate(451, 8)).toBe("about 1 hour");
    expect(estimate(0, 8)).toBe("under a minute");
  });

  it("offers speeds from fast to careful, and never faster than the server allows", () => {
    expect(SPEEDS.map((s) => s.seconds)).toEqual([4, 8, 15]);
    expect(Math.min(...SPEEDS.map((s) => s.seconds))).toBeGreaterThanOrEqual(4);
  });

  it("writes a time for a date picker in the person's own time", () => {
    expect(localInput(new Date(2026, 9, 22, 7, 5))).toBe("2026-10-22T07:05");
  });
});

describe("saying what a rule does", () => {
  const base = { triggerType: "keyword" as const, triggerCondition: "price, cost", actionType: "reply_text" as const, actionSummary: "AED 50", config: {} };
  it("lists keywords in any separator", () => {
    expect(keywordList("price, cost\nرسوم،  rate ;")).toEqual(["price", "cost", "رسوم", "rate"]);
  });
  it("describes keyword rules by how they match", () => {
    expect(describeRule(base)).toEqual({ when: "When a message contains “price”, “cost”", then: "replies “AED 50”" });
    expect(describeRule({ ...base, config: { match: "exact" } }).when).toBe("When the message is exactly “price”, “cost”");
    expect(describeRule({ ...base, config: { match: "word" } }).when).toBe("When a message has the word “price”, “cost”");
    expect(describeRule({ ...base, triggerCondition: "a,b,c,d,e,f" }).when).toBe("When a message contains “a”, “b”, “c”, “d” and 2 more");
  });
  it("describes the other triggers and actions", () => {
    expect(describeRule({ ...base, triggerType: "first_message" }).when).toBe("When someone writes for the first time");
    const hours = { timezone: "Asia/Dubai", days: [1, 2, 3, 4, 5], start: "09:00", end: "18:00" };
    expect(describeRule({ ...base, triggerType: "after_hours", config: { hours } }).when).toBe("When someone writes outside Monday to Friday, 09:00–18:00 (Asia/Dubai)");
    expect(describeRule({ ...base, actionType: "assign_agent", actionSummary: "Sam", config: { reply: "A person is coming." } }).then).toBe("assigns the chat to Sam and replies “A person is coming.”");
    expect(describeRule({ ...base, actionType: "add_tag", actionSummary: "interested" }).then).toBe("tags the customer “interested”");
    expect(describeRule({ ...base, actionType: "opt_in", config: { reply: "You're in!" } }).then).toBe("records their permission for broadcasts and replies “You're in!”");
    expect(describeRule({ ...base, actionType: "opt_out" }).then).toBe("takes them off broadcasts");
    expect(describeRule({ ...base, actionSummary: "x".repeat(300) }).then.length).toBeLessThan(140);
  });
  it("says a reply is still to be written, and ends sentences without doubling punctuation", () => {
    expect(describeRule({ ...base, actionSummary: "" }).then).toBe("replies with the answer you write below");
    expect(endSentence("takes them off broadcasts")).toBe("takes them off broadcasts.");
    expect(endSentence("replies “Thanks.”")).toBe("replies “Thanks.”");
    expect(endSentence("Hello!")).toBe("Hello!");
  });
  it("names day ranges", () => {
    expect(describeDays([1, 2, 3, 4, 5, 6, 7])).toBe("every day");
    expect(describeDays([5, 1, 2, 3, 4])).toBe("Monday to Friday");
    expect(describeDays([1, 2, 3, 4, 5, 6])).toBe("Monday to Saturday");
    expect(describeDays([2, 4])).toBe("Tue, Thu");
  });
  it("starts a new rule blank, and opening hours in the person's own zone", () => {
    expect(blankRule()).toMatchObject({ name: "", triggerType: "keyword", actionType: "reply_text" });
    const away = { ...blankRule(), triggerType: "after_hours" as const, config: { hours: { timezone: "Asia/Dubai", days: [1], start: "09:00", end: "18:00" } } };
    expect(withOwnTimezone(away).config.hours?.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(withOwnTimezone(blankRule())).toEqual(blankRule());
  });
});
