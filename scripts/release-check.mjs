// Vercel: exit 0 skips publishing; exit 1 continues the build.
// Fail closed so a code push cannot replace the UI before the API migration is ready.
export const backendReady = (health) =>
  health?.status === "ok" &&
  health.apiContract === 3 &&
  health.database?.connected === true;
// The server itself first, then the app's own address, which Vercel forwards to the same server. A build
// machine can be refused by the server's firewall while the app address still answers, and the app
// address is the very path people use, so reading the contract through it is just as true.
export const HEALTH_URLS = [
  "https://srv1628639.hstgr.cloud/health",
  "https://app.scriwo.com/health",
];
const ATTEMPTS = 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function releaseExitCode(env = process.env, fetcher = fetch, log = () => {}) {
  if (env.VERCEL_ENV === "preview") return 1;
  const pause = Number(env.RELEASE_CHECK_PAUSE_MS ?? 4000);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    for (const url of HEALTH_URLS) {
      try {
        const response = await fetcher(url, {
          signal: AbortSignal.timeout(6000),
          cache: "no-store",
        });
        // A backend that answers and is not ready (old contract, degraded, no database) is a decision,
        // so the release is held at once. Only silence or an error status is treated as a passing hiccup.
        if (response.ok) {
          const ready = backendReady(await response.json());
          log(`${url} answered: ${ready ? "ready" : "not ready"}`);
          return ready ? 1 : 0;
        }
        log(`${url} answered ${response.status} (try ${attempt} of ${ATTEMPTS})`);
      } catch (error) {
        log(`${url} did not answer: ${error?.cause?.code || error?.name || "error"} ${error?.message || ""} (try ${attempt} of ${ATTEMPTS})`);
      }
    }
    if (attempt < ATTEMPTS) await wait(pause);
  }
  return 0;
}
if (process.argv[1]?.endsWith("release-check.mjs")) {
  process.exitCode = await releaseExitCode(process.env, fetch, (line) => console.log(line));
  console.log(
    process.exitCode === 1
      ? "Backend contract ready: continue build."
      : "Release held: keep current production UI until backend contract 3 is ready.",
  );
}
