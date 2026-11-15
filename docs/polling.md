# Background requests: how often the app asks the server, and when it holds back

**Why.** On 14 Nov the live server answered every request in 5 to 17 s, and some failed. One tab on the Today screen was asking for about a
dozen things a minute and thirteen at once at sign-in; five people with a tab open each is more than a small server can answer, so
everything else (a click included) queued behind it. The live updates (the socket) already push what changes; the timers are only the safety
net behind them. So the app now asks less, and asks *less still* when the server struggles. The code is `src/services/polling.ts`.

## The rules

| Rule | Detail |
|---|---|
| A person who is away is asked for less | no mouse, key, touch or scroll for 5 minutes: three times slower; 15 minutes: six times (`startInputTracking`, started in `App`) |
| A hidden tab is not asked for at all | TanStack Query's own rule for `refetchInterval`; the health dot and the live-update safety net follow it too, and look again the moment the tab is shown |
| A struggling server is asked less, never more | a moving average of how long the app's plain reads take (`noteResponse`, fed by `services/api.ts`): over 3 s, or 2 failures in a row, doubles every interval; over 6 s, or 4 failures, quadruples them. A reading older than 3 minutes counts for nothing |
| Never faster than every 15 s | `FLOOR_MS` |
| Tabs drift apart | each tab rolls ONE fixed spread (plus or minus a tenth) when it loads, so tabs do not all ask in the same second |
| Only plain reads are measured | not writes, not an AI answer, a file, an export or a history sync (`isMeasured` in `api.ts`): those are slow by nature and say nothing about the server |

Use it as `refetchInterval: () => pollInterval(60_000)`.

**The spread must stay the same from call to call.** TanStack Query restarts its countdown whenever the number it gets from
`refetchInterval` changes, and a screen is drawn many times a minute. A number that was random at every call restarted the clock at every
drawing, so the request could be late or never made (found on the local stack: the first refresh of Today came 33 s late).
`tests/polling.test.tsx` draws a screen every 5 s for 140 s and checks the request is still made on time.

## How often, healthy server and a person at the page

| Request | Before | Now | Pushed live by |
|---|---|---|---|
| `/api/sessions` (numbers) | 30 s | 90 s | `session:status` |
| `/api/home` (Today) | 30 s | 60 s | `home:changed`, `lead:changed` |
| `/api/workspace/summary` (Performance) | 30 s | 120 s | slow numbers |
| `/api/home/autopilot` | 45 s | 120 s | a change made in the panel refreshes it |
| `/api/notifications` | 120 s | 180 s | `notification:new` |
| `/health` (the quiet dot) | 20 s | 60 s (15 s while down) | |
| `/api/conversations/changes` (safety net behind the socket) | 60 s | 60 s | |
| Numbers screen, `/api/sessions/health` | 30 s | 30 s (only while that screen is open) | |

## A gentler sign-in (`useStage`)

On the Today screen the first second asks only for what it shows (`home`, `sessions`, `capabilities`); the rest is released in steps:

| Step | After | Requests |
|---|---|---|
| 1 | 1.2 s | the chat list, notifications, workspaces, summary |
| 2 | 3 s | team, saved replies, labels, Riwo's autopilot |
| 3 | 6 s | contacts, campaigns, automations |

The moment a person goes anywhere else, nothing is held back (`released`): they may need it now. In tests all delays are 0.

## Retries (`services/retryPolicy.ts`)

A transient failure (a 5xx, 429, 408, no answer) is tried again twice, after about 3 s and 6 s (up to a second more in the browser, so that
many screens do not ask together), then the screen shows it. A refusal is shown at once. It used to be three retries after 1, 2 and 4 s,
which adds load exactly when the server can least take it.

## Measured (same script, same local stack and seeded company, old build against new)

| | Before | Now |
|---|---|---|
| data requests in the first second after sign-in | 13 | 3 |
| in the first 8 seconds | 13 | 13, spread over the steps |
| nothing touched, per minute | 11.1 | 5.1 |

After five minutes without a touch the new rate is a third of that (about 1.7 a minute, by the rule above; not separately measured).

Script: `e2e-calm.cjs` (Playwright, records every `/api/` request with its time).

## Tests

`src/__tests__/polling.test.tsx` (the pace, idle, a struggling server, stale readings, which requests are measured, the steps, the stable
spread and the on-time refresh while the screen is redrawn), `health_poll.test.tsx` (the dot: a minute apart, 15 s while down, nothing while
hidden, at once when shown), `retry_policy.test.ts`.
