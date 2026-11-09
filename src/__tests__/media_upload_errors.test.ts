import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadAttachment } from "../services/api";

// A file goes to the storage in three steps: ask where to put it, put it there from the browser, then send. These are the failures
// of the middle step, which a browser reports in the least helpful way there is.
const realFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response;
const prepared = { status: "success", attachmentId: "att_1", uploadUrl: "https://bucket.example/t/att_1?sig=1" };

beforeEach(() => vi.restoreAllMocks());
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.unstubAllGlobals();
});

describe("uploading a file to send", () => {
  it("asks for an address, puts the file there with its type, then sends it", async () => {
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${String(url).replace(/^https?:\/\/[^/]*/, "")}`);
      if (String(url).includes("/api/attachments/prepare")) return json(prepared);
      if (String(url).startsWith("https://bucket.example")) {
        expect((init!.headers as Record<string, string>)["Content-Type"]).toBe("image/png");
        return { ok: true, status: 200 } as Response;
      }
      return json({ status: "success", id: "m1" }, 201);
    }) as typeof fetch;
    await uploadAttachment("c1", new Blob(["x"]), "a.png", "image/png");
    expect(calls).toEqual(["POST /api/attachments/prepare", "PUT /t/att_1?sig=1", "POST /api/attachments/att_1/send"]);
  });

  it("says what is wrong when the browser is not allowed to reach the storage, instead of 'Failed to fetch'", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    globalThis.fetch = vi.fn(async (url: string) => {
      if (String(url).includes("/api/attachments/prepare")) return json(prepared);
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    const error = await uploadAttachment("c1", new Blob(["x"]), "a.png", "image/png").catch((e: Error) => e);
    expect((error as Error).message).not.toMatch(/Failed to fetch/);
    expect((error as Error).message).toMatch(/not allowed to reach the file storage/);
    expect((error as Error).message).toMatch(/Scriwo support/);
  });

  it("tells a person who is offline to check the connection", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    globalThis.fetch = vi.fn(async (url: string) => {
      if (String(url).includes("/api/attachments/prepare")) return json(prepared);
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    const error = await uploadAttachment("c1", new Blob(["x"]), "a.png", "image/png").catch((e: Error) => e);
    expect((error as Error).message).toMatch(/offline/);
  });

  it("names what the storage answered when it refuses the file, and never sends the message", async () => {
    const urls: string[] = [];
    globalThis.fetch = vi.fn(async (url: string) => {
      urls.push(String(url));
      if (String(url).includes("/api/attachments/prepare")) return json(prepared);
      return { ok: false, status: 403 } as Response;
    }) as typeof fetch;
    const error = await uploadAttachment("c1", new Blob(["x"]), "a.png", "image/png").catch((e: Error) => e);
    expect((error as Error).message).toMatch(/storage answered 403/);
    expect(urls.some((u) => u.endsWith("/send"))).toBe(false);
  });
});
