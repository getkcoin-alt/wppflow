// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  apiGet,
  sendMessageToConversation,
  addMessage,
  setStoredToken,
  setStoredTenantId,
  clearStoredToken,
  refreshSession,
} from "../services/api";
const response = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
describe("Actual HTTP client contracts", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    clearStoredToken();
    setStoredToken("access-test");
    setStoredTenantId("tenant-test");
  });
  afterEach(() => vi.unstubAllGlobals());
  it("sends authorization, tenant and credentials on real fetch calls", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ conversations: [{ id: "thread" }] }));
    vi.stubGlobal("fetch", fetch);
    const result = await apiGet("/api/conversations");
    expect(result.conversations[0].id).toBe("thread");
    expect(fetch.mock.calls[0][1]).toMatchObject({
      credentials: "include",
      headers: {
        Authorization: "Bearer access-test",
        "X-Tenant-Id": "tenant-test",
      },
    });
    expect(localStorage.getItem("wppflow_auth_token")).toBeNull();
  });
  it("keeps notes on their private endpoint", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ message: { id: "note" } }));
    vi.stubGlobal("fetch", fetch);
    await addMessage("thread", {
      text: "Internal",
      isNote: true,
      idempotencyKey: "stable",
    });
    expect(fetch.mock.calls[0][0]).toContain("/api/conversations/thread/notes");
  });
  it("does not retry an ambiguous network send", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Network lost"));
    vi.stubGlobal("fetch", fetch);
    await expect(
      sendMessageToConversation("thread", {
        text: "Hello",
        idempotencyKey: "stable",
      }),
    ).rejects.toThrow("Network lost");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("refreshes once after a rejected access token and preserves the send identity", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ message: "expired" }, 401))
      .mockResolvedValueOnce(
        response({ token: "renewed", tenant: { id: "tenant-test" } }),
      )
      .mockResolvedValueOnce(response({ message: { id: "saved" } }));
    vi.stubGlobal("fetch", fetch);
    await sendMessageToConversation("thread", {
      text: "Hello",
      idempotencyKey: "stable",
    });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetch.mock.calls[0][1].body).idempotencyKey).toBe(
      "stable",
    );
    expect(fetch.mock.calls[2][1].body).toBe(fetch.mock.calls[0][1].body);
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe("Bearer renewed");
  });
  it("coalesces simultaneous refresh requests", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        response({ token: "renewed", tenant: { id: "tenant-test" } }),
      );
    vi.stubGlobal("fetch", fetch);
    await Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
