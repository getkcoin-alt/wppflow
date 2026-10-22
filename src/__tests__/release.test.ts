import { it, expect } from "vitest";
// @ts-expect-error the release check is deliberately dependency-free JavaScript
import { releaseExitCode, backendReady } from "../../scripts/release-check.mjs";
it("holds production for old, degraded, malformed or unreachable backends", async () => {
  for (const data of [
    { status: "ok", version: "2.7.0" },
    { status: "degraded", apiContract: 3, database: { connected: true } },
    {},
  ]) {
    expect(
      await releaseExitCode(
        { VERCEL_ENV: "production", RELEASE_CHECK_PAUSE_MS: "0" },
        async () => new Response(JSON.stringify(data)),
      ),
    ).toBe(0);
  }
  expect(
    await releaseExitCode({ VERCEL_ENV: "production", RELEASE_CHECK_PAUSE_MS: "0" }, async () => {
      throw new Error("offline");
    }),
  ).toBe(0);
});
it("allows only a healthy migrated contract 3 backend or an explicit preview", async () => {
  expect(
    backendReady({
      status: "ok",
      apiContract: 3,
      database: { connected: true },
    }),
  ).toBe(true);
  expect(
    await releaseExitCode(
      { VERCEL_ENV: "production", RELEASE_CHECK_PAUSE_MS: "0" },
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            apiContract: 3,
            database: { connected: true },
          }),
        ),
    ),
  ).toBe(1);
  expect(await releaseExitCode({ VERCEL_ENV: "preview" })).toBe(1);
});

const READY = JSON.stringify({
  status: "ok",
  apiContract: 3,
  database: { connected: true },
});
const prod = { VERCEL_ENV: "production", RELEASE_CHECK_PAUSE_MS: "0" };
it("rides out a brief hiccup instead of holding a good release", async () => {
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls === 1) throw new Error("timed out");
    if (calls === 2) return new Response("bad gateway", { status: 502 });
    return new Response(READY);
  };
  expect(await releaseExitCode(prod, flaky)).toBe(1);
  expect(calls).toBe(3);
});
it("still holds the release when the backend stays unreachable, after three tries", async () => {
  let calls = 0;
  expect(
    await releaseExitCode(prod, async () => {
      calls++;
      throw new Error("offline");
    }),
  ).toBe(0);
  expect(calls).toBe(3);
});
it("holds at once, without retrying, when the backend answers that it is not ready", async () => {
  let calls = 0;
  expect(
    await releaseExitCode(prod, async () => {
      calls++;
      return new Response(JSON.stringify({ status: "ok", apiContract: 2 }));
    }),
  ).toBe(0);
  expect(calls).toBe(1);
});
