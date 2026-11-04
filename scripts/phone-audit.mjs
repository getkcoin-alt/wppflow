// Walks the main phone screens of a running Scriwo app at five phone widths and reports what a thumb would trip over:
//   - the page or a screen scrolling sideways
//   - a tap target smaller than 44 x 44 px (counting the invisible area the app adds around small buttons)
//   - a text field below 16 px (iOS zooms the whole page into such a field)
//   - a button with no name for a screen reader
// It needs Playwright with Chromium (`npx playwright install chromium`), the app running, and a company to sign in to that has
// some chats, a pipeline and the usual screens. It exits 1 when it finds anything, so it can gate a release.
//
//   APP_URL=http://localhost:5173 AUDIT_EMAIL=me@example.com AUDIT_PASSWORD=... node scripts/phone-audit.mjs
//   WIDTHS=320,390 THEME=dark node scripts/phone-audit.mjs      (fewer widths, or the dark theme)
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const APP = process.env.APP_URL || "http://localhost:5173";
const EMAIL = process.env.AUDIT_EMAIL;
const PASSWORD = process.env.AUDIT_PASSWORD;
const WIDTHS = (process.env.WIDTHS || "320,360,375,390,430").split(",").map(Number);
const THEME = process.env.THEME === "dark" ? "dark" : "light";
if (!EMAIL || !PASSWORD) {
  console.error("Set AUDIT_EMAIL and AUDIT_PASSWORD to a company to sign in to.");
  process.exit(2);
}

// runs in the page
function inspect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const found = { small: [], overflow: [], fonts: [], unnamed: [] };
  const visible = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.pointerEvents === "none" || n.hasAttribute("inert") || n.getAttribute("aria-hidden") === "true") return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  };
  const name = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
  for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="switch"], [role="radio"], select, input[type="checkbox"], input[type="radio"], summary')) {
    if (el.disabled || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    let w = r.width;
    let h = r.height;
    const after = getComputedStyle(el, "::after");
    if (after.content !== "none" && after.position === "absolute") {
      w = Math.max(w, parseFloat(after.width) || 0);
      h = Math.max(h, parseFloat(after.height) || 0);
    }
    const label = el.closest("label");
    if (label) {
      const lr = label.getBoundingClientRect();
      w = Math.max(w, lr.width);
      h = Math.max(h, lr.height);
    }
    if (Math.min(w, h) < 43.5) found.small.push(`${name(el)} (${Math.round(w)}x${Math.round(h)})`);
    if (el.tagName === "BUTTON" && !(el.getAttribute("aria-label") || el.textContent.trim() || el.getAttribute("title"))) found.unnamed.push(`a button without a name near y=${Math.round(r.top)}`);
  }
  for (const el of document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]), textarea, select")) {
    if (!visible(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 16) found.fonts.push(`${name(el)} is ${size}px`);
  }
  const root = document.documentElement;
  if (root.scrollWidth > root.clientWidth + 1) found.overflow.push(`the page is ${root.scrollWidth - root.clientWidth}px wider than the screen`);
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1 || r.width >= vw * 1.5) continue;
    let held = false;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === "auto" || ox === "scroll" || ox === "hidden") {
        held = true;
        break;
      }
    }
    if (!held) {
      found.overflow.push(`${el.tagName.toLowerCase()} "${name(el)}" ends ${Math.round(r.right - vw)}px past the edge`);
      break;
    }
  }
  return found;
}

const results = [];
const browser = await chromium.launch();
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, colorScheme: THEME, userAgent: devices["iPhone 14"].userAgent });
  const page = await context.newPage();
  page.on("pageerror", (e) => results.push({ width, screen: "(script error)", found: { small: [], overflow: [], fonts: [], unnamed: [], error: [e.message] } }));
  await page.goto(APP);
  await page.getByLabel(/email/i).first().fill(EMAIL);
  await page.getByLabel(/password/i).first().fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).first().click();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Skip the guide" }).click().catch(() => {});
  const bar = page.locator('nav[aria-label="Main"].lg\\:hidden');
  const look = async (screen) => {
    await page.waitForTimeout(700);
    results.push({ width, screen, found: await page.evaluate(inspect) });
  };
  const sheet = async (screen, open, close) => {
    try {
      await open();
      await look(screen);
      await (close ? close() : page.keyboard.press("Escape"));
      await page.waitForTimeout(450);
    } catch {
      /* this company does not have that screen */
    }
  };
  const go = async (label) => {
    try {
      await bar.getByRole("button", { name: new RegExp(label) }).click({ timeout: 3000 });
      await look(label);
      return true;
    } catch {
      return false;
    }
  };
  const fromMenu = async (label) => {
    try {
      await bar.getByRole("button", { name: "Menu" }).click({ timeout: 3000 });
      await page.waitForTimeout(450);
      await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: new RegExp(label) }).click({ timeout: 3000 });
      await look(label);
    } catch {
      await page.keyboard.press("Escape").catch(() => {});
    }
  };

  await look("Today");
  if (await go("Inbox")) {
    await sheet("Inbox filters", () => page.getByRole("button", { name: /^Filters/ }).click({ timeout: 3000 }));
    const first = page.locator('[role="button"][tabindex="0"]').first();
    if (await first.count()) {
      await first.tap();
      await look("A chat");
      await sheet("A chat: the + tray", () => page.getByRole("button", { name: "More to send" }).click({ timeout: 3000 }));
      await sheet("A chat: more", () => page.getByRole("button", { name: "More", exact: true }).click({ timeout: 3000 }));
      await sheet("A chat: details", () => page.getByRole("button", { name: /^Details for/ }).click({ timeout: 3000 }));
      await page.goBack().catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  for (const tab of ["Pipeline", "Contacts", "Real estate"]) if (await go(tab) && tab === "Pipeline") await sheet("Pipeline filters", () => page.getByRole("button", { name: /^Filters/ }).click({ timeout: 3000 }));
  for (const item of ["Contacts", "Automations", "Numbers", "Reports", "Broadcasts", "Team"]) await fromMenu(item);
  await sheet("Menu", () => bar.getByRole("button", { name: "Menu" }).click({ timeout: 3000 }));
  await context.close();
}
await browser.close();

// the same finding at several widths is one finding
const merged = new Map();
for (const { width, screen, found } of results)
  for (const kind of ["error", "overflow", "fonts", "unnamed", "small"])
    for (const message of found[kind] || []) {
      const key = `${kind}|${screen}|${message.replace(/\s*\(\d+x\d+\)$/, "")}`;
      const entry = merged.get(key) || { kind, screen, message, widths: [] };
      entry.widths.push(width);
      merged.set(key, entry);
    }
const screens = new Set(results.map((r) => r.screen));
console.log(`Looked at ${screens.size} screens and sheets at ${WIDTHS.join(", ")} px (${THEME}).`);
if (!merged.size) {
  console.log("Nothing to fix: no sideways scrolling, every target is 44 px or more, every field is 16 px or more.");
} else {
  for (const e of merged.values()) console.log(`- [${e.kind}] ${e.screen}: ${e.message} (at ${e.widths.join(", ")})`);
  process.exitCode = 1;
}
