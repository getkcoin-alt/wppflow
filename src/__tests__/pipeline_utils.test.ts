import { describe, it, expect } from "vitest";
import { daysSince, describeEvent, dueLabel, endOfToday, followUpOptions, formatMoney, inStage, shortMoney, stageTone } from "../utils/pipeline";
import { lead } from "./pipelineFixtures";

describe("money", () => {
  it("writes whole amounts with the currency code", () => {
    expect(formatMoney(1400000, "AED")).toBe("AED 1,400,000");
    expect(formatMoney(2499.6, "INR")).toBe("INR 2,500");
    expect(formatMoney(0, "AED")).toBe("AED 0");
  });
  it("shortens big amounts for a column header", () => {
    expect(shortMoney(1_400_000)).toBe("1.4M");
    expect(shortMoney(850_000)).toBe("850K");
    expect(shortMoney(1200)).toBe("1.2K");
    expect(shortMoney(95)).toBe("95");
    expect(shortMoney(0)).toBe("0");
  });
});

describe("time", () => {
  const now = new Date(2026, 9, 25, 11, 0).getTime();
  it("counts whole days in a step", () => {
    expect(daysSince(new Date(now - 3 * 86_400_000 - 1000).toISOString(), now)).toBe(3);
    expect(inStage(lead({ stageChangedAt: new Date(now - 2 * 3600_000).toISOString() }), now)).toBe("Today");
    expect(inStage(lead({ stageChangedAt: new Date(now - 30 * 3600_000).toISOString() }), now)).toBe("1 day");
    expect(inStage(lead({ stageChangedAt: new Date(now - 9 * 86_400_000).toISOString() }), now)).toBe("9 days");
  });
  it("says when a follow-up is due, and when it is late", () => {
    const at = (days: number, h = 15) => new Date(2026, 9, 25 + days, h, 0).toISOString();
    expect(dueLabel(at(0, 16), new Date(now))).toEqual({ text: "Today 4:00 PM", late: false });
    expect(dueLabel(at(1), new Date(now))).toEqual({ text: "Tomorrow 3:00 PM", late: false });
    expect(dueLabel(at(5), new Date(now)).late).toBe(false);
    expect(dueLabel(at(0, 9), new Date(now))).toEqual({ text: "Overdue since 9:00 AM", late: true });
    expect(dueLabel(at(-1), new Date(now))).toEqual({ text: "Overdue 1 day", late: true });
    expect(dueLabel(at(-4), new Date(now))).toEqual({ text: "Overdue 4 days", late: true });
  });
  it("ends 'today' at the person's own midnight", () => {
    const end = endOfToday(new Date(2026, 9, 25, 3, 0));
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([2026, 9, 25, 23, 59]);
  });
  it("offers ready follow-up times at nine in the morning", () => {
    const options = followUpOptions(new Date(2026, 9, 25, 14, 30));
    expect(options.map((o) => o.label)).toEqual(["Tomorrow", "In 3 days", "Next week"]);
    expect(options.map((o) => [o.at.getDate(), o.at.getHours(), o.at.getMinutes()])).toEqual([[26, 9, 0], [28, 9, 0], [1, 9, 0]]);
  });
});

describe("words", () => {
  it("colours steps by what they mean", () => {
    expect([stageTone("open"), stageTone("won"), stageTone("lost")]).toEqual(["neutral", "ok", "danger"]);
  });
  it("tells a lead's history in sentences", () => {
    const e = (type: string, detail: Record<string, any> = {}, actorName = "Sam") => describeEvent({ type, actorName, detail });
    expect(e("created", { source: "chat" })).toBe("Sam added this lead");
    expect(e("created", { source: "automation" }, "")).toBe("Added automatically");
    expect(e("stage", { from: "New", to: "Contacted" })).toBe("Sam moved it from New to Contacted");
    expect(e("won", { to: "Deal closed" })).toBe("Sam marked it Deal closed");
    expect(e("lost", { to: "Lost", reason: "Price" })).toBe("Sam marked it Lost: Price");
    expect(e("lost", { to: "Lost" })).toBe("Sam marked it Lost");
    expect(e("reopened", { to: "New" })).toBe("Sam reopened it in New");
    expect(e("owner", { to: "Tina" })).toBe("Sam gave it to Tina");
    expect(e("owner", { to: "" })).toBe("Sam took the owner off");
    expect(e("value", { from: 100, to: 200 })).toBe("Sam changed the value from 100 to 200");
  });
});
