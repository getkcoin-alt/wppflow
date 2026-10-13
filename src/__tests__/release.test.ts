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
        { VERCEL_ENV: "production" },
        async () => new Response(JSON.stringify(data)),
      ),
    ).toBe(0);
  }
  expect(
    await releaseExitCode({ VERCEL_ENV: "production" }, async () => {
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
      { VERCEL_ENV: "production" },
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
