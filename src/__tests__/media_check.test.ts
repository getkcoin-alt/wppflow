import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("../services/api", () => api);
import { runMediaCheck } from "../services/mediaCheck";

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
