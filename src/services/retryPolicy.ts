// Which failed requests are worth trying again before a person sees an error.
//
// A server that is busy, restarting or briefly unreachable (a gateway error page, a dropped connection, a request that timed out)
// usually answers a moment later, and the red "Retry" banner for it only worries people. A refusal (not signed in, not allowed, not
// found, a mistake in the request) will not change by asking again, so it is shown at once.
export const isTransient = (error: unknown): boolean => {
  const status = (error as { status?: number } | null)?.status;
  return status === undefined || status >= 500 || status === 429 || status === 408;
};

// A server that is struggling is not helped by being asked again at once: two more tries, a few seconds apart, then the screen shows it
// (and the person can press Retry). Each wait differs a little so that many screens do not ask again in the same second.
const JITTER_MS = import.meta.env.MODE === "test" ? 0 : 1000;

/** used as the `retry` of the query client: two more tries for a transient failure, none for a refusal */
export const shouldRetry = (failures: number, error: unknown): boolean => failures < 2 && isTransient(error);

/** three seconds, then six (never more than ten), each with up to a second more */
export const retryDelay = (failures: number): number => Math.min(3000 * 2 ** failures, 10_000) + Math.random() * JITTER_MS;

/** what is said when the server answered with something that is not data (a gateway error page, usually) */
export const notDataMessage = (status: number): string =>
  status >= 500 || status === 429 || status === 408
    ? "The server was busy and did not answer in time. Wait a moment and try again."
    : "The server returned an invalid response";
