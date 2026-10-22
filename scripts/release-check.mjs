// Vercel: exit 0 skips publishing; exit 1 continues the build.
// Fail closed so a code push cannot replace the UI before the API migration is ready.
export const backendReady = (health) =>
  health?.status === "ok" &&
  health.apiContract === 3 &&
  health.database?.connected === true;
const ATTEMPTS = 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function releaseExitCode(env = process.env, fetcher = fetch) {
  if (env.VERCEL_ENV === "preview") return 1;
  const pause = Number(env.RELEASE_CHECK_PAUSE_MS ?? 4000);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetcher("https://srv1628639.hstgr.cloud/health", {
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      // A backend that answers and is not ready (old contract, degraded, no database) is a decision,
      // so the release is held at once. Only silence or an error status is treated as a passing hiccup.
      if (response.ok) return backendReady(await response.json()) ? 1 : 0;
    } catch {}
    if (attempt < ATTEMPTS) await wait(pause);
  }
  return 0;
}
if (process.argv[1]?.endsWith("release-check.mjs")) {
  process.exitCode = await releaseExitCode();
  console.log(
    process.exitCode === 1
      ? "Backend contract ready: continue build."
      : "Release held: keep current production UI until backend contract 3 is ready.",
  );
}
