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

Checked again on 22 October 2026, after the platform admin was given the choice of plan.

| Website says | Status | Evidence |
|---|---|---|
| Free: one account, one number | Test | The number limit is 1 and the second number is refused; a teammate can't be invited (`plans-admin.test.js`, `ai-assistant.test.js`) |
| Starter: up to 3 numbers; shared inbox, assign and resolve, private notes and @mentions, contacts CSV, themes | Test | Limit of 3 set from the plan; the inbox features are covered in the table above and are open on every plan |
| Starter has no broadcasts, automations, audit log or API | Test | Locked by plan in the server and the screens (`plans-admin.test.js`, `ai-assistant.test.js`) |
| Growth: up to 10 numbers; adds broadcasts, automations, audit log | Test | Limit of 10 set from the plan; the three are open on Growth and above |
| Growth: saved replies, desktop and offline alerts | Code | Built and working, but deliberately open on **every** plan: alerts protect customers from a missed message, and saved replies are a small convenience. The page lists them under Growth, so Free and Starter get more than it promises |
| Business: up to 25 numbers; scoped API keys, signed webhooks | Test | Limit of 25 set from the plan; keys and webhooks are locked below Business |
| Business: API tester and SDK samples | Code | The Developers guide is readable on every plan; only creating keys and webhooks is locked |
| Enterprise: custom number limit | Test | The platform admin must type the limit; no default is guessed |
| Onboarding call, dedicated onboarding, help connecting your systems | Service | Not software |
| The platform admin chooses the plan when creating a company, and can change it later | Test | Required, one of the five, with the plan's number limit filled in and editable; changing it takes effect at once, removes nothing, and says what a smaller plan leaves the company with (`plans-admin.test.js`, `platform_plans.test.tsx`) |
| Companies see their own plan and what it includes | Test | "Your plan" card in Team, System (`platform_plans.test.tsx`) |
| Companies on the original "Workspace" plan | Kept | Any plan name that is not one of the five keeps every feature, so nothing already working stops. They can be moved to a plan from the platform screen |
| Self-service sign-up | Fixed | It used to create a "Workspace" company with every feature and 5 numbers, which skipped the pricing page entirely. It now creates a Free company: one person, one number. Set `ALLOW_PUBLIC_SIGNUP=false` on the server to turn sign-up off |

## Not software

"Onboarding call for your team", "Dedicated onboarding" and "Help connecting your systems" are services, not
features. Online payments are not live (`PAYMENTS_LIVE = false`); every plan is set up by the onboarding team.
