import { it, expect } from "vitest";
import { parseContactsCsv, contactsCsv } from "../utils/csv";
it("parses quotes, commas, BOM and multiline values", () => {
  expect(
    parseContactsCsv(
      '\uFEFFname,phone,tags\r\n"Alice, A",15551234567,"VIP;New"\r\n"Bob\nSmith",15557654321,',
    )[0],
  ).toEqual({ name: "Alice, A", phone: "15551234567", tags: "VIP;New" });
});
it("rejects malformed or missing required CSV headers", () => {
  expect(() => parseContactsCsv("email\na@b.c")).toThrow();
  expect(() => parseContactsCsv('name,phone\n"Unclosed,123')).toThrow();
});
it("escapes formulas and embedded quotes on export", () => {
  const csv = contactsCsv([{ name: '=HYPERLINK("x")', phone: "15551234567" }]);
  expect(csv).toContain('"\'=HYPERLINK(""x"")"');
});
