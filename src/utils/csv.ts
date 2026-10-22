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
  rows: {
    name: string;
    phone: string;
    email?: string;
    tags?: string[];
    optIn?: boolean;
  }[],
) {
  const quote = (s: string) =>
    `"${(/^[=+@-]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
  // "optin" is "yes" for people who agreed to broadcasts and empty for everyone else, so importing the file
  // again never changes anyone's permission to "no" by accident.
  return [
    "name,phone,email,tags,optin",
    ...rows.map((r) =>
      [r.name, r.phone, r.email || "", (r.tags || []).join(";"), r.optIn ? "yes" : ""]
        .map(quote)
        .join(","),
    ),
  ].join("\r\n");
}
