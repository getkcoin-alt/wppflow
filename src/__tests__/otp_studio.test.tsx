import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  getOtp: vi.fn(),
  saveOtpSettings: vi.fn(),
  getOtpPreview: vi.fn(),
  createOtpKey: vi.fn(),
  revokeOtpKey: vi.fn(),
  otpTestSend: vi.fn(),
  otpTestCheck: vi.fn(),
  otpTestStatus: vi.fn(),
  getOtpLog: vi.fn(),
  setOtpWebhook: vi.fn(),
  removeOtpWebhook: vi.fn(),
  testOtpWebhook: vi.fn(),
  getOtpWebhookDeliveries: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { OtpStudio } from "../components/developer/otp/OtpStudio";
import { overview, MESSAGE } from "./otpFixtures";
import { getBaseBackendUrl, type OtpKey, type OtpOverview } from "../services/api";

const NUMBER = { sessionName: "main-line", phone: "971500000000", connected: true };
const KEY = (over: Partial<OtpKey> = {}): OtpKey => ({ id: "k1", name: "My site", kind: "secret", mode: "live", prefix: "otp_sk_live_ab12", allowedOrigins: [], createdAt: "2026-11-08T05:00:00Z", lastUsedAt: null, revokedAt: null, ...over });
const problem = (message: string, fix: string) => Object.assign(new Error(message), { data: { fix } });

const studio = (props: Partial<React.ComponentProps<typeof OtpStudio>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <OtpStudio canManage {...props} />
    </QueryClientProvider>,
  );
const show = (o: Partial<OtpOverview> = {}) => api.getOtp.mockResolvedValue(overview(o));

beforeEach(() => {
  show();
  api.getOtpPreview.mockResolvedValue(MESSAGE);
  api.getOtpLog.mockResolvedValue([]);
  api.getOtpWebhookDeliveries.mockResolvedValue([]);
  api.otpTestStatus.mockReturnValue(new Promise(() => {}));
  api.saveOtpSettings.mockImplementation(async (patch) => ({ ...overview().settings, ...patch }));
  try {
    localStorage.clear();
  } catch {
    /* nothing to clear */
  }
});
afterEach(() => {
  cleanup();
  for (const f of Object.values(api)) f.mockReset();
});

describe("Free OTP: what to pick", () => {
  it("opens on the use case, with the saved one chosen and the message exactly as people will get it", async () => {
    studio();
    const sign = await screen.findByRole("radio", { name: /Sign in/ });
    expect(sign.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: /Delivery/ }).getAttribute("aria-checked")).toBe("false");
    const message = await screen.findByLabelText("How the message looks in WhatsApp");
    await waitFor(() => expect(within(message).getByText("482913").tagName).toBe("STRONG"));
    expect(message.textContent).toContain("Acme Stores sign-in code");
    expect(message.textContent).toContain("Never share this code with anyone.");
  });

  it("one tap on another use case saves it and the page follows what the server says it now is", async () => {
    api.saveOtpSettings.mockResolvedValue({ ...overview().settings, template: "delivery", codeLength: 4, ttlSeconds: 3600, maxAttempts: 5, resendSeconds: 60 });
    studio();
    fireEvent.click(await screen.findByRole("radio", { name: /Delivery/ }));
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ template: "delivery" });
    await waitFor(() => expect(screen.getByRole("radio", { name: /Delivery/ }).getAttribute("aria-checked")).toBe("true"));
    expect(screen.getByRole("radio", { name: /Sign in/ }).getAttribute("aria-checked")).toBe("false");
  });

  it("Fine-tune holds the rest: language, digits, time, tries, wait; each change is saved", async () => {
    studio();
    await screen.findByRole("radio", { name: /Sign in/ });
    fireEvent.click(screen.getByRole("tab", { name: "हिन्दी" }));
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ locale: "hi" });
    fireEvent.change(screen.getByLabelText("Digits in the code"), { target: { value: "8" } });
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ codeLength: 8 });
    fireEvent.change(screen.getByLabelText("The code works for"), { target: { value: "600" } });
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ ttlSeconds: 600 });
    fireEvent.change(screen.getByLabelText("Tries before it locks"), { target: { value: "3" } });
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ maxAttempts: 3 });
    fireEvent.change(screen.getByLabelText("Wait before sending another"), { target: { value: "120" } });
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ resendSeconds: 120 });
  });

  it("the name in the message is saved a moment after the typing stops, and the preview shows it meanwhile", async () => {
    studio();
    const input = await screen.findByLabelText("Name shown in the message");
    fireEvent.change(input, { target: { value: "Noor Clinic" } });
    await waitFor(() => expect(api.getOtpPreview).toHaveBeenCalledWith(expect.objectContaining({ brand: "Noor Clinic" })));
    expect(api.saveOtpSettings).not.toHaveBeenCalledWith({ brand: "Noor Clinic" });
    await waitFor(() => expect(api.saveOtpSettings).toHaveBeenCalledWith({ brand: "Noor Clinic" }), { timeout: 2500 });
  });

  it("a name that cannot be used is explained while typing, never saved or previewed, and the last good message stays", async () => {
    studio();
    const input = await screen.findByLabelText("Name shown in the message");
    await waitFor(() => expect(screen.getByLabelText("How the message looks in WhatsApp").textContent).toContain("Acme Stores"));
    fireEvent.change(input, { target: { value: "shop.example.com" } });
    const note = await screen.findByText(/no links, dots or symbols/);
    expect(note.getAttribute("role")).toBe("alert");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await new Promise((r) => setTimeout(r, 900));
    expect(api.saveOtpSettings).not.toHaveBeenCalled();
    expect(api.getOtpPreview).not.toHaveBeenCalledWith(expect.objectContaining({ brand: "shop.example.com" }));
    expect(screen.getByLabelText("How the message looks in WhatsApp").textContent).toContain("Acme Stores");
    // a good name afterwards is saved as usual
    fireEvent.change(input, { target: { value: "Noor Clinic" } });
    await waitFor(() => expect(api.saveOtpSettings).toHaveBeenCalledWith({ brand: "Noor Clinic" }), { timeout: 2500 });
  });
});

describe("Free OTP: the number", () => {
  it("with no number it offers to link one, and the test says it has to wait", async () => {
    const connect = vi.fn();
    studio({ onConnectNumber: connect });
    fireEvent.click(await screen.findByRole("button", { name: /Link a WhatsApp number/ }));
    expect(connect).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Link a WhatsApp number first \(step 2\)/)).toBeDefined();
    expect((screen.getByRole("button", { name: /Send a test code/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/not in your Scriwo inbox/)).toBeDefined();
  });

  it("with numbers it lists them, uses the first connected one unless told otherwise, and saves a different choice", async () => {
    show({ numbers: [NUMBER, { sessionName: "shop-2", phone: "971511111111", connected: false }], ready: { number: true, tested: false, key: false } });
    studio();
    const first = await screen.findByRole("radio", { name: /\+971500000000/ });
    expect(first.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("Offline")).toBeDefined();
    expect(screen.getByText(/Using the first connected number/)).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: /\+971511111111/ }));
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ sessionName: "shop-2" });
  });
});

describe("Free OTP: try it", () => {
  const ready = () => show({ numbers: [NUMBER], ready: { number: true, tested: false, key: false } });
  const sendTest = async () => {
    fireEvent.change(await screen.findByPlaceholderText("+971 50 123 4567"), { target: { value: "+971 50 123 4567" } });
    fireEvent.click(screen.getByRole("button", { name: /Send a test code/ }));
  };

  it("sends a real code, takes what was typed, and shows the green light; the page then counts the test as passed", async () => {
    ready();
    api.otpTestSend.mockResolvedValue({ id: "otp_1", state: "sent", channel: "whatsapp", to: "+971•••••4567", expiresIn: 300, resendAfter: 30 });
    api.otpTestCheck.mockResolvedValue({ valid: true, id: "otp_1", secondsToVerify: 4 });
    studio();
    await sendTest();
    await waitFor(() => expect(api.otpTestSend).toHaveBeenCalledWith("+971 50 123 4567"));
    expect(await screen.findByText(/Sent to \+971•••••4567/)).toBeDefined();
    const calls = api.getOtp.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Code you received"), { target: { value: "482913" } });
    fireEvent.click(screen.getByRole("button", { name: "Check the code" }));
    await waitFor(() => expect(api.otpTestCheck).toHaveBeenCalledWith("otp_1", "482913"));
    expect(await screen.findByText(/It works\. The code was checked 4 seconds after it was sent/)).toBeDefined();
    await waitFor(() => expect(api.getOtp.mock.calls.length).toBeGreaterThan(calls));
    expect(screen.queryByLabelText("Code you received")).toBeNull();
  });

  it("a wrong code says how many tries are left; the code box only takes digits", async () => {
    ready();
    api.otpTestSend.mockResolvedValue({ id: "otp_1", state: "sent", channel: "whatsapp", to: "+971•••••4567", expiresIn: 300, resendAfter: 30 });
    api.otpTestCheck.mockResolvedValue({ valid: false, id: "otp_1", reason: "wrong_code", attemptsLeft: 3 });
    studio();
    await sendTest();
    const box = (await screen.findByLabelText("Code you received")) as HTMLInputElement;
    fireEvent.change(box, { target: { value: "12ab34" } });
    expect(box.value).toBe("1234");
    fireEvent.click(screen.getByRole("button", { name: "Check the code" }));
    expect(await screen.findByText("That is not the code. 3 tries left.")).toBeDefined();
    api.otpTestCheck.mockResolvedValue({ valid: false, id: "otp_1", reason: "expired" });
    fireEvent.click(screen.getByRole("button", { name: "Check the code" }));
    expect(await screen.findByText("That code has expired. Send a new one.")).toBeDefined();
  });

  it("a send that fails says what happened and what to do", async () => {
    ready();
    api.otpTestSend.mockRejectedValue(problem("This number is not on WhatsApp.", "Offer another way to sign in for this person."));
    studio();
    await sendTest();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("This number is not on WhatsApp. Offer another way to sign in for this person.");
  });

  it("the delivery tick appears when WhatsApp says the code arrived", async () => {
    ready();
    api.otpTestSend.mockResolvedValue({ id: "otp_1", state: "sent", channel: "whatsapp", to: "+971•••••4567", expiresIn: 300, resendAfter: 30 });
    api.otpTestStatus.mockResolvedValue({ id: "otp_1", status: "delivered", deliveredAt: "2026-11-08T05:00:03Z" });
    studio();
    await sendTest();
    expect(await screen.findByText(/Delivered to \+971•••••4567/, {}, { timeout: 4500 })).toBeDefined();
  }, 8000);

  it("the number it remembers is the one the person used last", async () => {
    ready();
    api.otpTestSend.mockResolvedValue({ id: "otp_1", state: "sent", channel: "whatsapp", to: "+971•••••4567", expiresIn: 300, resendAfter: 30 });
    studio();
    await sendTest();
    await screen.findByText(/Sent to/);
    cleanup();
    studio();
    expect(((await screen.findByPlaceholderText("+971 50 123 4567")) as HTMLInputElement).value).toBe("+971 50 123 4567");
  });
});

describe("Free OTP: connect", () => {
  it("creates a key, shows it once with a copy button, and puts it in the code to paste", async () => {
    const created = { ...KEY({ id: "k9", prefix: "otp_sk_live_cd34" }), key: `otp_sk_live_${"c".repeat(40)}` };
    api.createOtpKey.mockResolvedValue(created);
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    studio();
    const before = await screen.findByLabelText("Code for node");
    expect(before.textContent).toContain("YOUR_SECRET_KEY");
    expect(screen.getByText(/Create a key above and it is filled in for you/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Create my key" }));
    await waitFor(() => expect(api.createOtpKey).toHaveBeenCalledWith({ name: "My website", kind: "secret", mode: "live" }));
    expect(await screen.findByText("Copy this key now. It is shown only once.")).toBeDefined();
    const shown = screen.getByLabelText("Your new key");
    expect(shown.textContent).toBe(created.key);
    fireEvent.click(within(shown.parentElement!).getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(created.key));
    const code = screen.getByLabelText("Code for node").textContent || "";
    expect(code).toContain(created.key);
    expect(code).toContain(`${getBaseBackendUrl() || window.location.origin}/api/otp"`);
    expect(code).not.toContain("YOUR_SECRET_KEY");
    fireEvent.click(screen.getByRole("tab", { name: "Python" }));
    expect(screen.getByLabelText("Code for python").textContent).toContain("requests.post");
    fireEvent.click(screen.getByRole("tab", { name: "PHP" }));
    expect(screen.getByLabelText("Code for php").textContent).toContain("curl_init");
    fireEvent.click(screen.getByRole("tab", { name: "No-code" }));
    expect(screen.getByLabelText("Code for nocode").textContent).toContain("Authorization = Bearer");
  });

  it("a test key says it sends nothing and always uses 123456", async () => {
    api.createOtpKey.mockResolvedValue({ ...KEY({ id: "k8", mode: "test", prefix: "otp_sk_test_ef56" }), key: `otp_sk_test_${"e".repeat(40)}` });
    studio();
    fireEvent.click(await screen.findByRole("button", { name: "Create a test key" }));
    await waitFor(() => expect(api.createOtpKey).toHaveBeenCalledWith(expect.objectContaining({ kind: "secret", mode: "test" })));
    expect(await screen.findByText(/always uses the code 123456/)).toBeDefined();
  });

  it("lists the keys that are live, hides the revoked ones, and revokes on request", async () => {
    show({ keys: [KEY(), KEY({ id: "k2", name: "Old", revokedAt: "2026-11-01T00:00:00Z" }), KEY({ id: "k3", name: "Widget", kind: "public", prefix: "otp_pk_live_9z" })] });
    api.revokeOtpKey.mockResolvedValue({});
    studio();
    const list = await screen.findByRole("list", { name: "Your secret keys" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("Old")).toBeNull();
    fireEvent.click(within(list).getByRole("button", { name: "Revoke My site" }));
    await waitFor(() => expect(api.revokeOtpKey).toHaveBeenCalledWith("k1"));
  });

  it("the web widget needs the websites it will run on, makes a public key, and gives the page code and the server check", async () => {
    api.createOtpKey.mockResolvedValue({ ...KEY({ id: "k7", kind: "public", prefix: "otp_pk_live_aa11", allowedOrigins: ["https://shop.example.com"] }), key: `otp_pk_live_${"a".repeat(40)}` });
    studio();
    fireEvent.click(await screen.findByRole("tab", { name: "Web widget" }));
    const create = screen.getByRole("button", { name: "Create widget key" }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Websites where the widget will run"), { target: { value: "https://shop.example.com  https://www.shop.example.com" } });
    expect(create.disabled).toBe(false);
    fireEvent.click(create);
    await waitFor(() => expect(api.createOtpKey).toHaveBeenCalledWith({ name: "My website", kind: "public", mode: "live", origins: ["https://shop.example.com", "https://www.shop.example.com"] }));
    const page = (await screen.findByLabelText("Widget code")).textContent || "";
    expect(page).toContain(`<script src="${window.location.origin}/otp.js"></script>`);
    // the widget talks to the address it was loaded from; on a developer's machine, where the API is elsewhere, the snippet says where
    expect(page).toContain(`api: "${getBaseBackendUrl()}"`);
    expect(page).toContain(`otp_pk_live_${"a".repeat(40)}`);
    expect(page).toContain("ScriwoOTP.verify");
    expect(screen.getByLabelText("Proof check").textContent).toContain("/api/otp/proof/verify");
    expect(screen.getByText(/The widget gives your page a proof/)).toBeDefined();
  });

  it("a key that is refused says why", async () => {
    api.createOtpKey.mockRejectedValue(problem("\"http://x.com\" cannot be used.", "Use https:// addresses (http:// is only allowed for localhost)."));
    studio();
    fireEvent.click(await screen.findByRole("tab", { name: "Web widget" }));
    fireEvent.change(screen.getByLabelText("Websites where the widget will run"), { target: { value: "http://x.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create widget key" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Use https:// addresses");
  });
});

describe("Free OTP: get notified", () => {
  const open = async () => {
    studio();
    return screen.findByText("Get notified (optional)");
  };
  it("saves one address, shows the signing secret once, and can send itself a test event", async () => {
    api.setOtpWebhook.mockResolvedValue({ webhook: { id: "w1", url: "https://example.com/hook" }, secret: "s".repeat(64) });
    await open();
    fireEvent.click(screen.getByText("Get notified (optional)"));
    fireEvent.change(screen.getByLabelText("Webhook address"), { target: { value: " https://example.com/hook " } });
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(api.setOtpWebhook).toHaveBeenCalledWith("https://example.com/hook"));
    expect((await screen.findByLabelText("Signing secret")).textContent).toBe("s".repeat(64));
    expect(screen.getByText("Copy the signing secret now. It is shown only once.")).toBeDefined();
  });

  it("with an address set it shows it, tests it, lists the latest calls and removes it", async () => {
    show({ webhook: { id: "w1", url: "https://example.com/hook", createdAt: "2026-11-08T05:00:00Z" } });
    api.getOtpWebhookDeliveries.mockResolvedValue([{ id: "d1", event: "otp.verified", status: "delivered", attempts: 1, response_status: 200, error: null, created_at: "2026-11-08T05:01:00Z" }]);
    api.testOtpWebhook.mockResolvedValue({});
    api.removeOtpWebhook.mockResolvedValue({});
    await open();
    expect(await screen.findByText("https://example.com/hook")).toBeDefined();
    const calls = await screen.findByRole("list", { name: "Recent calls to your address" });
    expect(within(calls).getByText("otp.verified")).toBeDefined();
    expect(within(calls).getByText("HTTP 200")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Send a test event/ }));
    await waitFor(() => expect(api.testOtpWebhook).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/A test event was sent/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(api.removeOtpWebhook).toHaveBeenCalledTimes(1));
  });

  it("an address that is not allowed is explained", async () => {
    api.setOtpWebhook.mockRejectedValue(problem("Private or reserved webhook destinations are forbidden", "Use a public https address, for example https://example.com/otp-events"));
    await open();
    fireEvent.click(screen.getByText("Get notified (optional)"));
    fireEvent.change(screen.getByLabelText("Webhook address"), { target: { value: "https://127.0.0.1/x" } });
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Use a public https address");
  });
});

describe("Free OTP: the whole picture", () => {
  it("counts the steps done and says when it is ready for real codes", async () => {
    studio();
    expect(await screen.findByText("0 of 3 steps done")).toBeDefined();
    cleanup();
    show({ numbers: [NUMBER], ready: { number: true, tested: true, key: true }, keys: [KEY()] });
    studio();
    expect(await screen.findByText("Ready for real codes")).toBeDefined();
    const steps = within(screen.getByRole("list", { name: "Setup progress" }));
    expect(steps.getAllByText(", done")).toHaveLength(3);
  });

  it("marks the next thing to do", async () => {
    show({ numbers: [NUMBER], ready: { number: true, tested: false, key: false } });
    studio();
    const test = (await screen.findByRole("heading", { name: "Try it yourself" })).closest("section")!;
    expect(within(test).getByText("Next")).toBeDefined();
    expect(within(screen.getByRole("heading", { name: "Where do the codes come from?" }).closest("section")!).getByText("Done")).toBeDefined();
  });

  it("the switch pauses and resumes the codes, and a pause is said at the top where it cannot be missed", async () => {
    studio();
    const sw = await screen.findByRole("switch", { name: "Send codes" });
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByText(/Codes are paused: nothing is sent/)).toBeNull();
    fireEvent.click(sw);
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ enabled: false });
    await waitFor(() => expect(screen.getByRole("switch", { name: "Send codes" }).getAttribute("aria-checked")).toBe("false"));
    expect(screen.getByText("Codes are paused")).toBeDefined();
    expect(screen.getByText(/Codes are paused: nothing is sent/)).toBeDefined();
    api.saveOtpSettings.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Switch on" }));
    expect(api.saveOtpSettings).toHaveBeenCalledWith({ enabled: true });
    await waitFor(() => expect(screen.queryByText(/Codes are paused: nothing is sent/)).toBeNull());
  });

  it("shows what has been used of the free allowance, and the latest codes with the numbers masked", async () => {
    show({ usage: { today: { used: 37, limit: 100, resets: "x" }, month: { used: 412, limit: 1000, resets: "y" } }, stats: { days: 7, sent: 40, delivered: 38, verified: 31, failed: 2, verifiedRate: 0.77, medianSecondsToVerify: 9 } });
    api.getOtpLog.mockResolvedValue([
      { id: "a", status: "verified", mode: "live", source: "api", to: "+971•••••4567", template: "login", locale: "en", reference: null, attempts: 1, maxAttempts: 5, createdAt: "2026-11-08T05:00:00Z", sentAt: null, deliveredAt: null, verifiedAt: null, expiresAt: "2026-11-08T05:05:00Z", error: null, secondsToVerify: 7 },
      { id: "b", status: "failed", mode: "live", source: "widget", to: "+919•••••4047", template: "login", locale: "en", reference: null, attempts: 0, maxAttempts: 5, createdAt: "2026-11-08T05:01:00Z", sentAt: null, deliveredAt: null, verifiedAt: null, expiresAt: "2026-11-08T05:06:00Z", error: "not_on_whatsapp", secondsToVerify: null },
    ]);
    studio();
    expect((await screen.findByRole("progressbar", { name: "Free codes today" })).getAttribute("aria-valuenow")).toBe("37");
    expect(screen.getByText("37 of 100")).toBeDefined();
    expect(screen.getByText("412 of 1000")).toBeDefined();
    const log = await screen.findByRole("list", { name: "Recent codes" });
    expect(within(log).getByText("+971•••••4567")).toBeDefined();
    expect(within(log).getByText("Verified")).toBeDefined();
    expect(within(log).getByText("Not on WhatsApp")).toBeDefined();
    expect(within(log).getByText("widget")).toBeDefined();
    expect(screen.getByText("9s")).toBeDefined();
  });

  it("says plainly when the platform has switched OTP off, or Scriwo has suspended the company", async () => {
    show({ available: false });
    studio();
    expect(await screen.findByText(/switched off on the platform for the moment/)).toBeDefined();
    cleanup();
    show({ settings: { ...overview().settings, suspended: true } });
    studio();
    expect(await screen.findByText(/OTP has been suspended for your company/)).toBeDefined();
  });

  it("a teammate who is not an owner or administrator is told who sets it up, and nothing is asked of the server", () => {
    studio({ canManage: false });
    expect(screen.getByText(/Free OTP is set up by your company's owner or an administrator/)).toBeDefined();
    expect(api.getOtp).not.toHaveBeenCalled();
  });

  it("a page that cannot load says why instead of staying empty", async () => {
    api.getOtp.mockRejectedValue(problem("Interactive workspace login required", "Sign in again."));
    studio();
    expect((await screen.findByRole("alert")).textContent).toContain("Sign in again.");
  });
});
