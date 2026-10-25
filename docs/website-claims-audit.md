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

## Broadcasts and automations

Reworked on 22 October 2026. Every line below is covered by an automated test.

| Behaviour | Evidence |
|---|---|
| A broadcast is written in three steps (message, audience, review), from ten ready-made messages, with a live preview and the audience counted before anything is sent | `broadcast_wizard.test.tsx`, `broadcast-easy.test.js` |
| A message with an unfilled [blank] or an unknown {{field}} is refused; {{first_name}}, {{name}} and {{company}} are filled in per person, and a contact known only by phone number is greeted as "there" | `broadcast-easy.test.js`, `broadcast_utils.test.ts` |
| Send now, schedule, or save a draft; sending checks the number is connected and that someone would receive it; an earlier broadcast can be copied | `broadcast-easy.test.js` |
| The owner can record permission, with a confirmation, for contacts nobody has decided on; a customer's STOP is never overridden | `broadcast-easy.test.js` |
| A CSV `optin` column records permission and never undoes a STOP; a file without tags no longer wipes a contact's tags | `broadcast-easy.test.js`, `csv.test.ts` |
| Customers manage their own permission: STOP takes them off broadcasts (the chat stays open for staff) and SUBSCRIBE puts them on | `automation-rules.test.js` |
| 14 ready-made rules in four groups, in English, Arabic and Hindi keywords; every one passes the same checks as a hand-made rule; they start paused | `automation-rules.test.js`, `automations_screen.test.tsx` |
| Rules start on keywords (contains, whole word or exact), a first message, or a message outside opening hours, and can reply, assign, tag, or record permission | `automation-rules.test.js` |
| Safety: one automatic reply per message, a wait between repeats, six an hour at most per chat, and group chats are never answered | `automation-rules.test.js` |
| A saved rule can be edited; rules saved before this behave as they always did | `automation-rules.test.js`, `automations_screen.test.tsx` |

**Not yet proven live.** STOP and SUBSCRIBE work on messages that arrive. Nothing here sends to WhatsApp in tests: delivery is the existing, separately tested path.

## Sales pipeline

Added on 25 October 2026 (Growth and above). The website calls Scriwo a "WhatsApp CRM"; this is the part of that
claim that is about selling. Every line is covered by an automated test.

| Behaviour | Evidence |
|---|---|
| A lead is one sales opportunity for one contact; a contact has only one open lead at a time, and the lead keeps the name, number and value if the contact is deleted | `leads.test.js` |
| Leads are added from a chat in one tap, from a contact (one or many), by a rule for new customers or for people who ask for a quote, and never from a group chat | `leads.test.js`, `contacts_pipeline.test.tsx`, `lead_sheets.test.tsx` |
| A board with a step per column (with counts and values), a list, and a Today list of follow-ups; steps can be renamed, reordered and added, and templates for real estate, car dealers and clinics rename them without moving a lead | `leads.test.js`, `pipeline_screen.test.tsx`, `lead_sheets.test.tsx` |
| Moving a lead is recorded; a lost lead asks why; winning, losing and reopening work; reopening is refused if the contact has another open lead | `leads.test.js`, `pipeline_screen.test.tsx` |
| Visibility matches the inbox: managers see every lead; staff see leads they own and leads on their own numbers | `leads.test.js` (including a check that the tests fail if this rule is removed) |
| The lead's owner and the chat's assignee are the same person, whichever is changed, and the new owner is told | `leads.test.js` |
| A follow-up reminds its person once when due; moving the time reminds again; won, lost and deleted leads send no reminders | `leads.test.js` |
| Riwo can suggest a title, value, next step and follow-up for a new lead; nothing is saved until a person confirms, and the customer's number is never sent | `ai-assistant.test.js`, `lead_sheets.test.tsx` |
| Part of the Growth plan and above; locked screens and server both enforce it | `ai-assistant.test.js`, `plans-admin.test.js` |

**Not built yet** (phase 2): reports for managers (win rate, first-reply time, leaderboard), round-robin assignment,
"no reply in two days" alerts, broadcasts to a step, lead webhooks and an API key scope for leads, custom fields,
more than one pipeline. The pricing page does not mention the pipeline yet.

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
