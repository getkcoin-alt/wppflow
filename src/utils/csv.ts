export function parseContactsCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (ch === "," || ch === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      cell = "";
      if (ch === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += ch;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted value");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = (rows.shift() || []).map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/^\uFEFF/, ""),
  );
  if (!headers.includes("name") || !headers.includes("phone"))
    throw new Error("CSV needs name and phone columns");
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) =>
      Object.fromEntries(headers.map((h, i) => [h, r[i]?.trim() || ""])),
    );
}
export function contactsCsv(
  rows: { name: string; phone: string; email?: string; tags?: string[] }[],
) {
  const quote = (s: string) =>
    `"${(/^[=+@-]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
  return [
    "name,phone,email,tags",
    ...rows.map((r) =>
      [r.name, r.phone, r.email || "", (r.tags || []).join(";")]
        .map(quote)
        .join(","),
    ),
  ].join("\r\n");
}
