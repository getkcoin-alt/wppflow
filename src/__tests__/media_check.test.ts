import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("../services/api", () => api);
import { appOriginsFor, corsRuleFor, runMediaCheck } from "../services/mediaCheck";

const realFetch = globalThis.fetch;
beforeEach(() => {
  api.apiGet.mockReset();
  api.apiPost.mockReset();
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("media storage check", () => {
  it("lists the server settings that are missing and stops there", async () => {
    api.apiGet.mockResolvedValue({
      configured: false,
      missing: ["S3_BUCKET", "S3_ACCESS_KEY_ID"],
    });
    const r = await runMediaCheck("https://scriwo.com");
    expect(r.server.ok).toBe(false);
    expect(r.server.note).toContain("S3_BUCKET, S3_ACCESS_KEY_ID");
    expect(r.browser).toBeNull();
    expect(api.apiPost).not.toHaveBeenCalled();
  });

  it("reports a server-side storage error without trying the browser", async () => {
    api.apiGet.mockResolvedValue({
      configured: true,
      ok: false,
      error: "The bucket was not found. Check S3_BUCKET.",
    });
    const r = await runMediaCheck();
    expect(r.server).toEqual({
      ok: false,
      note: "The bucket was not found. Check S3_BUCKET.",
    });
    expect(r.browser).toBeNull();
  });

  it("points at the CORS rules when the browser cannot upload", async () => {
    api.apiGet.mockResolvedValue({ configured: true, ok: true, ms: 120 });
    api.apiPost.mockResolvedValue({
      url: "https://bucket.example/x?sig=1",
      key: "t/_check/1",
    });
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch")) as any;
    const r = await runMediaCheck("https://scriwo.com");
    expect(r.server.ok).toBe(true);
    expect(r.browser?.ok).toBe(false);
    expect(r.browser?.note).toMatch(/CORS rules.*https:\/\/scriwo\.com/);
  });

  it("hands over the rule to paste when the browser is blocked, naming every address the app is opened from", async () => {
    api.apiGet.mockResolvedValue({ configured: true, ok: true });
    api.apiPost.mockResolvedValue({ url: "https://bucket.example/x?sig=1", key: "t/_check/1" });
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as any;
    const r = await runMediaCheck("https://app.scriwo.com");
    const rule = JSON.parse(r.browser!.corsRule!);
    expect(rule).toEqual([
      {
        AllowedOrigins: ["https://app.scriwo.com", "https://homes.scriwo.com"],
        AllowedMethods: ["PUT", "GET", "HEAD"],
        AllowedHeaders: ["Content-Type"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ]);
  });

  it("gives no rule when the storage answered but refused, because that is not a CORS problem", async () => {
    api.apiGet.mockResolvedValue({ configured: true, ok: true });
    api.apiPost.mockResolvedValue({ url: "https://bucket.example/x?sig=1", key: "t/_check/1" });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 }) as any;
    const r = await runMediaCheck();
    expect(r.browser?.ok).toBe(false);
    expect(r.browser?.corsRule).toBeUndefined();
  });

  it("lists the other front door of the same app: app. and homes. share one bucket", () => {
    expect(appOriginsFor("https://app.scriwo.com")).toEqual(["https://app.scriwo.com", "https://homes.scriwo.com"]);
    expect(appOriginsFor("https://homes.scriwo.com")).toEqual(["https://homes.scriwo.com", "https://app.scriwo.com"]);
    expect(appOriginsFor("https://crm.example.org")).toEqual(["https://crm.example.org", "https://app.example.org", "https://homes.example.org"]);
  });

  it("names only the address itself when there is no sibling to name", () => {
    expect(appOriginsFor("http://localhost:5173")).toEqual(["http://localhost:5173"]);
    expect(appOriginsFor("https://scriwo.com")).toEqual(["https://scriwo.com"]);
    expect(appOriginsFor("not an address")).toEqual(["not an address"]);
    expect(JSON.parse(corsRuleFor("http://localhost:5173"))[0].AllowedOrigins).toEqual(["http://localhost:5173"]);
  });

  it("passes when the browser uploads and the server confirms it arrived", async () => {
    api.apiGet.mockResolvedValue({ configured: true, ok: true });
    api.apiPost.mockImplementation(async (path: string) =>
      path.endsWith("/upload")
        ? { url: "https://bucket.example/x?sig=1", key: "t/_check/1" }
        : { ok: true },
    );
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200 }) as any;
    const r = await runMediaCheck();
    expect(r.browser).toEqual({
      ok: true,
      note: "This browser can upload files to the bucket.",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://bucket.example/x?sig=1",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(api.apiPost).toHaveBeenLastCalledWith(
      "/api/workspace/media-check/finish",
      { key: "t/_check/1" },
    );
  });
});
