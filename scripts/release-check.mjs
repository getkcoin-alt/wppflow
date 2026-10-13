// Vercel: exit 0 skips publishing; exit 1 continues the build.
// Fail closed so a code push cannot replace the UI before the API migration is ready.
export const backendReady = (health) =>
  health?.status === "ok" &&
  health.apiContract === 3 &&
  health.database?.connected === true;
export async function releaseExitCode(env = process.env, fetcher = fetch) {
  if (env.VERCEL_ENV === "preview") return 1;
  try {
    const response = await fetcher("https://srv1628639.hstgr.cloud/health", {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (response.ok && backendReady(await response.json())) return 1;
  } catch {}
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
