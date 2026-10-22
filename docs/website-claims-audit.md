# What the website promises, and what backs it

Checked on 22 October 2026 against the code and the automated tests. "Test" means a named automated test
that fails if the behaviour breaks. "Code" means the behaviour is implemented and was read in the code, with
no dedicated test yet.

## Features

| Website says | Status | Evidence |
|---|---|---|
| Live inbox with no refresh; gaps after a dropped connection are caught up; a periodic check repairs what the live feed missed | Test | `inbox-sync.test.js`, `realtime_cache.test.ts`; the periodic repair is `syncService.js` |
| Opening a chat loads its earlier WhatsApp history | Test | `history-on-open.test.js` |
| Groups shown as groups; status updates kept out of customer chats | Test | `groups-and-status.test.js` |
| Staff see their own number's chats plus chats assigned to them; owners see everything; enforced on the server | Test | `tenant-isolation.test.js`, `company-staff-flow.test.js`, `number-filter.test.js` |
| Assign and resolve; assignee notified in the app and on the desktop | Test | `notifications.test.js`, `company-staff-flow.test.js` |
| Private notes are never sent to the customer; @mentions notify the teammate | Test | `notifications.test.js` |
| Broadcasts only to opted-in contacts, consent re-checked before each send | Test | `runtime-regression.test.js` ("Campaigns require opt-in…") |
| Delays between broadcast messages | Code | `campaignRoutes.js` never allows less than 4 seconds |
| Contacts: CSV import and export, opt-in status | Test | `csv.test.ts`, `runtime-regression.test.js` |
| Keyword automations (reply or assign) and saved replies | Test | `runtime-regression.test.js` ("Keyword automation executes once…") |
| One company, many numbers, with a per-company limit | Test | `company-staff-flow.test.js` |
| Alert when a linked phone goes offline | Test | `notifications.test.js`, `session-lifecycle.test.js` |
| Removing a number unlinks it and deletes its saved login; leftover browsers are cleaned up | Test | `session-removal.test.js`, `browser-process.test.js`, `profile-isolation.test.js` |
| Roles, suspend (live sessions drop at once), audit log | Test | `company-staff-flow.test.js`, `team-management.test.js` |
| Passwords are never emailed; single-use links that expire | Test | `company-staff-flow.test.js`, `team-management.test.js`, `invite_setup.test.tsx` |
| Scoped API keys; revoke one at a time | Test | `company-staff-flow.test.js`, `runtime-regression.test.js` |
| Signed webhooks | Code | `webhookService.js` signs every delivery with `X-Scriwo-Signature`; no dedicated test yet |
| Access tokens kept in memory; refresh cookie is HttpOnly; sign-in attempts rate limited | Code | `api.ts`, `authRoutes.js`, `rateLimiter.js` |
| Deploys check health and roll back on their own; the database is backed up before a change | Code | `scripts/deploy.sh`. The backup is best-effort: it is skipped, with a log line, if `pg_dump` is missing on the server |
| "N backend test suites and N frontend tests run on every change" | Fixed | The site said 25 and 61; the real numbers are 30 and 146. Corrected in `website/src/lib/site.ts` |

## Plans

| Website says | Status | Evidence |
|---|---|---|
| Free: one account, one number | Fixed | The number limit already held. The one-person limit was not enforced; it is now (`plans.js`, `ai-assistant.test.js`) |
| Starter has no broadcasts, automations, audit log or API | Fixed | Before this phase the plan was only a label: a Starter company could use everything. Those features are now locked by plan, in the server and in the screens |
| Growth adds broadcasts, automations, desktop and offline alerts, audit log | Fixed | Broadcasts, automations and the audit log are enforced. Alerts are deliberately not locked, because they protect customers from a missed message |
| Business adds API keys, webhooks, API tester and SDK samples | Fixed | API keys and webhooks are enforced; the guide and samples stay readable on every plan |
| Companies on the original "Workspace" plan | Kept | Any plan name that is not one of the five keeps every feature, so nothing already working stops |

## Not software

"Onboarding call for your team", "Dedicated onboarding" and "Help connecting your systems" are services, not
features. Online payments are not live (`PAYMENTS_LIVE = false`); every plan is set up by the onboarding team.
