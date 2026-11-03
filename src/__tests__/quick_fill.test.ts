import { describe, it, expect } from "vitest";
import { findMoney, findDay, findTime, understandLead, understandProperty, understandViewing } from "../utils/quickFill";

// a Wednesday
const NOW = new Date(2026, 10, 4, 10, 0);

describe("money in everyday words", () => {
  it.each([
    ["1.8M", 1_800_000],
    ["budget AED 2,500,000", 2_500_000],
    ["₹50k", 50_000],
    ["45 lakh", 4_500_000],
    ["2 crore", 20_000_000],
    ["1200000", 1_200_000],
  ])("%s", (said, amount) => expect(findMoney(said)?.amount).toBe(amount));
  it("never reads a count as money", () => {
    expect(findMoney("2 bed 3 bath 45 min at 4pm")).toBeNull();
    expect(findMoney("2bhk 1,200 sqft")).toBeNull();
    expect(findMoney("call at 10:30")).toBeNull();
  });
  it("keeps the currency that was said", () => expect(findMoney("AED 90k")?.currency).toBe("AED"));
});

describe("days and times", () => {
  it("understands relative days", () => {
    expect(findDay("tomorrow", NOW)?.days).toBe(1);
    expect(findDay("in 3 days", NOW)?.days).toBe(3);
    expect(findDay("next week", NOW)?.days).toBe(7);
    expect(findDay("friday", NOW)?.date).toBe("2026-11-06");
    expect(findDay("wednesday", NOW)?.days).toBe(7);
    expect(findDay("2026-11-20", NOW)?.days).toBe(16);
    expect(findDay("nothing here", NOW)).toBeNull();
  });
  it("understands times", () => {
    expect(findTime("at 4pm")?.time).toBe("16:00");
    expect(findTime("3:30 pm")?.time).toBe("15:30");
    expect(findTime("12am")?.time).toBe("00:00");
    expect(findTime("15:45")?.time).toBe("15:45");
    expect(findTime("noon")?.time).toBe("12:00");
    expect(findTime("13pm")).toBeNull();
  });
});

describe("a new lead from one line", () => {
  it("fills what it understands and keeps the rest as the title", () => {
    const u = understandLead("2 bedroom in Marina 1.8M call tomorrow", NOW);
    expect(u.fields.value).toBe("1800000");
    expect(u.fields.followDays).toBe(1);
    expect(u.fields.title).toBe("2 bedroom in Marina");
    expect(u.chips).toContain("Follow up tomorrow");
  });
  it("leaves everything empty when nothing is understood", () => {
    const u = understandLead("", NOW);
    expect(u.fields).toEqual({});
    expect(u.chips).toEqual([]);
  });
});

describe("a new property from one line", () => {
  it("reads a listing", () => {
    const u = understandProperty("2 bed 2 bath furnished apartment for rent in Dubai Marina AED 120k per year 1,250 sqft");
    expect(u.fields).toMatchObject({ bedrooms: "2", bathrooms: "2", furnished: "furnished", propertyType: "apartment", purpose: "rent", rentPeriod: "year", price: "120000", currency: "AED", sizeSqft: "1250", community: "Dubai Marina" });
    expect(u.fields.title).toBe("2-bed Apartment in Dubai Marina");
  });
  it("reads a sale, a studio and unfurnished", () => {
    const u = understandProperty("studio for sale 750k unfurnished");
    expect(u.fields).toMatchObject({ bedrooms: "0", purpose: "sale", price: "750000", furnished: "unfurnished" });
  });
  it("only picks a type the company has", () => {
    expect(understandProperty("big villa", { propertyTypes: ["apartment"] }).fields.propertyType).toBeUndefined();
  });
});

describe("a viewing from one line", () => {
  it("reads day, time and length", () => {
    const u = understandViewing("tomorrow 4pm for 30 min", NOW);
    expect(u.fields).toEqual({ date: "2026-11-05", time: "16:00", minutes: "30" });
  });
});
