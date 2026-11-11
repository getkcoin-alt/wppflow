import { describe, it, expect, vi, afterEach } from "vitest";
import { isTransient, shouldRetry, retryDelay, notDataMessage } from "../services/retryPolicy";
import { apiRequest } from "../services/api";

describe("which failed requests are tried again", () => {
  it("tries a busy or unreachable server again, but not a refusal", () => {
    for (const status of [500, 502, 503, 504, 524, 429, 408]) expect(isTransient({ status }), `${status}`).toBe(true);
    expect(isTransient(new TypeError("Failed to fetch"))).toBe(true); // no answer at all
    for (const status of [400, 401, 403, 404, 409, 422]) expect(isTransient({ status }), `${status}`).toBe(false);
  });
  it("gives a transient failure three more tries, then shows it", () => {
    const busy = { status: 504 };
    expect([0, 1, 2, 3, 4].map((n) => shouldRetry(n, busy))).toEqual([true, true, true, false, false]);
    expect(shouldRetry(0, { status: 403 })).toBe(false);
  });
  it("waits 1, 2, 4 seconds and never more than 8", () => {
    expect([0, 1, 2, 3, 4, 9].map(retryDelay)).toEqual([1000, 2000, 4000, 8000, 8000, 8000]);
  });
});

describe("what a person is told when the server answers with something that is not data", () => {
  const reply = (status: number, body: string, type = "text/html") =>
    vi.fn(async () => new Response(body, { status, headers: { "content-type": type } }));
  afterEach(() => vi.unstubAllGlobals());

  it("says the server was busy for a gateway error page, instead of 'invalid response'", async () => {
    vi.stubGlobal("fetch", reply(504, "<html><body><h1>504 Gateway Time-out</h1></body></html>"));
    const error = await apiRequest("/api/conversations").catch((e) => e);
    expect(error.message).toBe(notDataMessage(504));
    expect(error.message).toMatch(/busy and did not answer in time/);
    expect(error.status).toBe(504);
    expect(isTransient(error)).toBe(true); // so the screen tries again before showing it
  });
  it("keeps the server's own words when it sends them", async () => {
    vi.stubGlobal("fetch", reply(403, JSON.stringify({ status: "error", message: "Your plan does not include this" }), "application/json"));
    const error = await apiRequest("/api/x").catch((e) => e);
    expect(error.message).toBe("Your plan does not include this");
    expect(isTransient(error)).toBe(false);
  });
  it("still says 'invalid response' for a client error that is not data", async () => {
    vi.stubGlobal("fetch", reply(404, "<html>Not found</html>"));
    const error = await apiRequest("/api/x").catch((e) => e);
    expect(error.message).toBe("The server returned an invalid response");
  });
});
