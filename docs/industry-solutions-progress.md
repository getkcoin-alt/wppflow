# Industry solutions: progress, handoff and how to resume

Written 27 October 2026. Branch `scrappy/vigilant-pasteur-ap8elj` in both repos (`wppflow` app and website,
`wppflow-backend` API). **Nothing here is deployed.** The migrations (029, 030, 031) have not been run against production,
and no company has the solution switched on. See section 6 for what an operator has to do.

Companion files: `docs/scriwo-platform-audit.md` (the verified starting point and the risks) and
`docs/white-label-foundation.md` (a staged design for resellers; **not built**).

## 1. The idea, in one paragraph

Scriwo Core (shared WhatsApp inbox, contacts, broadcasts, automations, the sales pipeline, reports, billing) is the
default product and is unchanged for every existing company. An **industry solution** is an optional layer that a
platform admin switches on for one company. The first one is **Scriwo Real Estate** for UAE brokerages. A solution
reuses Core's leads, chats, tasks, notifications and AI; it adds its own tables, routes and screens; Core only *mounts* it.

## 2. What exists now

| Slice | What it is | Where |
|---|---|---|
| Registry + entitlements | A manifest per solution; a per-company switch with settings and a version; default **off**; switching on or off is audited, tells the company's managers, and refreshes open browsers. The solution API needs the switch **and** the plan features it is built on (`requires: ["leads"]`) | backend `src/solutions/registry.js`, `entitlements.js`, `routes/solutionRoutes.js`, migration `030_industry_solutions.js`; app `hooks/useSolutions.ts`, `components/platform/SolutionsSheet.tsx` |
| Qualification | One validated profile per lead: lead type, intent, budget and currency, areas, property types, bedrooms, timeline, source, status, next action. Stage history stays in Core's activity log | `src/solutions/real-estate/profile.js`, `components/realestate/QualificationSection.tsx` |
| Inventory + matching | Company-owned properties with a unique reference, status, price, currency, verification date. A **deterministic** matcher returns each property with the reasons it fits, warnings, and how many were left out and why. Nothing is invented | `properties.js`, `matching.js`, `text.js`, `PropertiesView.tsx` |
| Viewings | Book, confirm, reschedule, cancel, complete, no-show. Conflict checks for agent, property and client inside a transaction with advisory locks; an idempotency key; DST-correct time zones; a reminder and a follow-up task in Core's task list; an ICS file; a confirmation text for a person to send (never auto-sent) | `viewings.js`, `time.js`, `BookViewingSheet.tsx`, `ViewingsView.tsx` |
| Revenue Leak Detector | Six real conditions from real rows: nobody owns the lead, follow-up overdue, customer waiting for a reply, no next step, lead gone quiet, automation failing. One open alert per condition; auto-resolved when fixed; snooze; a 7-day quiet period after "not a problem"; managers told once; a batch summary above 10; a 5-minute scan claimed in the database | `leaks.js`, `RevenueView.tsx`, job `pumpRealEstate` in `services/domainJobs.js` |
| Honest money | Open pipeline and at-risk are labelled **Hypothetical** (what leads are marked at). Only **Won** is **Recorded**. The screen says so in words | `RevenueView.tsx`, `leaks.js` |
| Riwo for real estate | Qualification **proposal**: every field must be backed by an exact quote that is found in the chat, amounts are cross-checked, the person edits and saves. Draft replies may mention only approved, fresh listings through `[[REF:x]]` markers; the server rejects any figure, price or link of its own. Nothing is sent | `ai.js`, `aiService.askAboutConversation`, `QualificationSection.tsx` |
| Hub in the app | A "Real estate" item in the navigation **only** when the solution is active; Revenue, Properties and Viewings tabs; the lead sheet and pipeline show qualification and matches | `RealEstateHub.tsx`, `navigation.ts`, `App.tsx` |

Database (migration `031_real_estate.js`): `re_lead_profiles`, `re_properties`, `re_viewings`, `re_alerts`,
`re_scan_state`. Entitlements: `tenant_solutions` (migration 030). Every table has `tenant_id`; every query filters on it.
No existing table was altered.

API (all under `/api/solutions/real_estate`, all behind `requireSolution`): `/meta`, `/overview`, `/alerts`
(+ `/scan`, `/:id/resolve|dismiss|snooze`), `/leads` (create), `/leads/:id/profile` (GET/PUT), `/leads/:id/matches`,
`/leads/:id/next-actions`, `/leads/:id/viewings`, `/leads/:id/ai/qualification`, `/leads/:id/ai/draft`, `/properties`
(+ `/:id`, `/:id/verify`), `/viewings` (+ `/:id`, `/:id/calendar.ics`, `/:id/confirm|complete|no-show|cancel|reschedule`).

Settings a company may change (all have defaults): time zone (Asia/Dubai), days before a listing needs checking again (14),
viewing length (45 min), minutes a new lead may wait for an owner (15), minutes a follow-up may be overdue (60), hours a
lead may have no next action (4), days without activity before "gone quiet" (7).

## 3. Rules the code follows (keep them)

1. **Core stays universal.** Real estate lives in `src/solutions/real-estate/` and `src/components/realestate/`. Core
   files change only to mount it (router, `capabilities.solutions`, a `NAV` entry, one job). Core never imports real-estate data.
2. **Default off.** A company sees nothing, and the server refuses every solution route, until the platform admin switches it on.
3. **Every query has `tenant_id`; ids from the client are looked up together with it.** There is no row-level security
   in the database, so this convention is the only guard: new code must follow it and be tested for it.
4. **AI proposes, a person decides.** Extraction needs quotes found in the chat; drafts can only reference approved listings
   the server inserts; nothing is sent by AI.
5. **No invented numbers.** If there is no data the screen says so. Hypothetical money is never shown as revenue.
6. **Background work is claim-then-act** (`UPDATE ... WHERE x IS NULL RETURNING`), like Core's reminders.
7. **Migrations are additive.** Tables only.

## 4. How to add the next industry

1. Make a folder `src/solutions/<key>/` with a `manifest.js` (key, name, version, `requires`, settings with defaults and checks).
2. List the manifest in `src/solutions/registry.js`. There is no plugin discovery on purpose.
3. Add routes behind `requireSolution("<key>")`, mount them in the solutions router, and add tables in a new numbered
   migration with `tenant_id` on every table.
4. Add a `NAV` entry shown only when `capabilities.solutions` includes the key, and a hub component.
5. Write the tests first for: default off, off after switching off, cross-company refusal, permission by role.
6. Do **not** copy real estate wholesale: reuse leads, tasks, notifications and `askAboutConversation`.

Do not build other industries speculatively. Real estate has not yet been used by a real brokerage.

## 5. Verification record (real results from this session)

Backend: `node scripts/test.mjs`, one disposable PostgreSQL database per file.

| Check | Result |
|---|---|
| Backend full suite | 616 tests in 58 files: 616 pass, 0 fail, 0 skipped (the later 19 are the "other countries" automation, below) |
| App unit tests (Vitest) | 517 tests in 46 files: 517 pass, 0 fail |
| App typecheck (`tsc --noEmit`) and production build | Both clean. The production build succeeds (the existing chunk-size notice is unchanged). oxlint exits 0: 16 warnings, all in files that existed before this work, none in the new ones |
| Website typecheck and tests | Typecheck clean; 38 tests in 3 files pass (the website was not changed in this work) |
| Browser run, real backend, desktop | 10 of 10 steps pass: sign up and switch the solution on, nav item appears, leak check finds leaks, properties through the form, lead qualified, matches with reasons, viewing booked with message and nothing sent, a clash refused with the reason, viewing confirmed, funnel from real activity, snooze |
| Browser run, mobile (390 px) and dark | 10 of 10 steps pass in each |
| Mutation checks | Critical lines were broken on purpose and the tests caught every one (isolation, matching exclusions, idempotency, conflict checks, alert dedupe, quote validation, name isolation, scroll-into-view) |

What the browser runs found and fixed: an Arabic customer name dragged its whole sentence backwards; a booking refusal hid
behind the sheet's buttons; a phone cut the area name off; "1 listing meet". Each now has a test.

Known test-premise lessons (so they are not repeated): AI is rate limited to 20 a minute per person, so later AI tests use
a different manager; assigning a lead counts as activity, so "no next step" tests need their own lead.

## 6. What an operator must do before anyone can use it

1. Review the four migrations (029 password resets, 030 solutions, 031 real estate, 032 automation chats). All are additive.
2. Deploy backend first, wait for `/health` to report `032_automation_chats`, then the app (the same order as before). **This
   needs the owner's go-ahead; it has not been done.**
3. In the platform console, open the company, choose **Solutions**, switch Scriwo Real Estate on. The company's owners and
   admins get a notice and the navigation item appears live.
4. The company needs the **Leads** plan feature (the solution requires it). The switch screen warns when the plan lacks it.
5. Set the time zone and thresholds if the defaults (Dubai, 45 minutes, and so on) do not fit.
6. Rotate the shared AI provider key (still on the earlier open list); Riwo features need `ai` on the plan and an owner switch.

## 7. Not built, and what each needs

| Not built | Why not yet | Needs before it can be |
|---|---|---|
| Calendar sync (Google/Microsoft) | Needs each user's consent and OAuth credentials | An OAuth app, a consent screen, token storage and a privacy review. Today: an ICS file the person adds themselves |
| Sending viewing confirmations by WhatsApp automatically | Scriwo's WhatsApp link is the unofficial WhatsApp Web engine; a bulk or scripted message risks the customer's number | A consent policy per contact, and ideally the official WhatsApp Business API. Today: a text to copy and send |
| Portal import (Property Finder, Bayut) | No credentials or agreements; scraping is not acceptable | A partner API agreement. Today: add listings through the form |
| RTL layout and Arabic UI | Whole app is English-only; Arabic *data* is handled (names, searches, quotes) | A translation and layout project for the app as a whole |
| Second pipeline (sales and lettings apart) | Core allows one pipeline per company | A Core change, not a real-estate one |
| Two-factor sign-in, SSO | Not part of this work | Separate project |
| White-label / reseller | See `docs/white-label-foundation.md`, design only | Owner decisions in that file |
| A real run with a real brokerage, a real WhatsApp number or a real Razorpay payment | Not possible from this environment | Staging with a pilot company |

## 8. Known limitations (honest list)

- **One pipeline per company.** Real estate sits inside it; lettings and sales cannot be separate pipelines yet.
- **Lead value is one number.** It is a hypothetical amount while a lead is open and the recorded amount once won; the
  screen labels which it is, but a company that never fills in values sees zeros.
- **"Customer waiting" alerts cover only chats tied to an open lead** and use the company-wide reply target.
- **Matching is rule-based on purpose**: hard requirements (available, purpose, currency, budget maximum, bedrooms,
  type, area) exclude; budget minimum and timeline only warn. It will not find a "similar" listing outside what the lead
  said. That is a choice, not an oversight.
- **Listing availability is only as true as the last confirmation.** The screen shows how old it is; stale listings are
  marked and drafts refuse them.
- **Row-level tenant isolation is by convention and tests, not by the database.** Isolation of the new tables is tested
  (cross-company reads, writes and ids) but a future query that forgets `tenant_id` would not be stopped by PostgreSQL.
- **Free AI models vary in quality**; the quote check protects the data, not the wording.
- **No real-world use yet.** Everything above is verified by tests and a browser run on a disposable database, not by a customer.

## 9. Next priorities

1. Deploy to staging, switch the solution on for one pilot brokerage, and watch the leak list for a week before
   changing thresholds. Real alerts will tell us which of the six conditions matter.
2. Property import by CSV (the most common first ask from brokers), reusing the form's validation.
3. Staff time off, so a viewing is not booked on an agent's day off.
4. A weekly owner summary of leaks and viewings through the existing daily-report mail.
5. Only then: calendar sync, official WhatsApp, a second industry, or the first white-label stage.

## 10. Added afterwards: welcome people from other countries (28 October 2026)

A recipe in Automations, not an industry solution: when a number from another country writes for the first time it gets the
company's own welcome (with "how did you find us: AI, website, social media or word of mouth?"), and Riwo can then answer
short questions, only from text the company wrote, until a teammate replies. What it is and how it is checked is in
`docs/website-claims-audit.md` ("Welcoming people from other countries").

- Backend: `src/services/countries.js` (calling codes, who is foreign), `autoChat.js` (the held conversation, the answer
  check, when it stops), `aiService.chatForBusiness`, trigger `foreign_number` and action `ai_chat` in `automationRules.js` /
  `automationService.js`, `GET /api/automations/context`, migration `032_automation_chats.js` (one table, additive).
- App: `components/user/AbroadRecipe.tsx`, a card and two ready-made rules in Automations.
- Tests: backend `auto-chat.test.js` (19, with the critical lines broken on purpose to prove they fail); app
  `abroad_recipe.test.tsx` (14). A real-browser run on desktop, phone and dark passes 11 of 11 steps: set it up, a
  stranger from the UK is welcomed once, Riwo answers the price and records "Found us: Website", an unanswerable question is
  handed over once, a teammate's reply silences Riwo.
- Not done: nothing here has run with a real WhatsApp number or a real model; the browser run used a scripted stand-in
  for the model. Riwo needs the Growth plan or above, the owner's AI switch, and a provider key on the server.

## 11. Added afterwards: profile pictures in the inbox (28 October 2026)

**Fault:** contacts' pictures were not shown in the inbox. The pictures were read from `contact.profilePicThumbObj.eurl`, a
property the WhatsApp library marks deprecated (WhatsApp Web now keeps pictures in a separate store, so it is usually empty),
and when it was filled it held a signed address that stops working within days. Nothing asked WhatsApp for the real
picture, and a chat created by an incoming message never got one at all.

**Fix (backend `avatarService.js`, route `/api/avatars/:kind/:id`, migration `033_profile_pictures.js`; app `ui/Avatar.tsx`):**
the app is now given the server's own address for each picture. The server asks WhatsApp for the current picture with the
recommended call (`getProfilePicFromServer`), fetches the image, keeps it (a week for a picture, half a day for "none"), and
serves it. Asking is gentle: one question at a time per number with a pause, a short queue, and one lookup however many
browsers ask. The address is signed per chat (a browser cannot send a sign-in token with an image); a wrong signature is
answered like a chat that does not exist. Only ordinary https addresses on WhatsApp's own hosts are fetched, redirects are
refused, and the bytes must really be a small JPEG, PNG or WebP. If WhatsApp is unreachable the last picture is still shown.
The Contacts list now shows pictures too (it only ever showed initials).

**Checked:** backend `avatars.test.js` (15 tests, with each safeguard broken on purpose); app `avatar.test.tsx` (6); a real
browser run in which one customer has a picture and the others do not (the picture really decodes, the others show
initials, Contacts shows it too).

**Not checked, and why it matters:** this has not run against a real WhatsApp number. It depends on `getProfilePicFromServer`
returning an address for the people who allow it; people who hide their picture from non-contacts will still show initials,
which is correct. Pictures are loaded when a chat scrolls into view, so a long list fills in gradually the first time and is
instant afterwards.

Totals after this change: backend 631 tests in 59 files, 0 failed; app 523 tests in 47 files, 0 failed; typecheck, lint and production build clean.
