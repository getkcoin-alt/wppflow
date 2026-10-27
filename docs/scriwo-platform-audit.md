# Scriwo platform audit: core, industry solutions, white-label

Written 27 October 2026 from the code in `wppflow` (app and website, branch `scrappy/vigilant-pasteur-ap8elj`) and
`wppflow-backend` (API, same branch), both at the commit that follows backend `1acdcf3` / app `fae6947`. Everything marked
**verified** was read in the code or run. Where something could not be verified here it says so.

Companion files: `docs/industry-solutions-progress.md` (what is done, what is next, how to resume) and
`docs/white-label-foundation.md` (the staged reseller design).

## 1. How the system is built (verified)

| Layer | What it is | Where |
|---|---|---|
| API | Node 22, Express 4, Socket.IO, PostgreSQL 16, Redis/BullMQ (message outbox only) | `wppflow-backend/src` |
| Background work | One `setInterval` (every 4 s) in `services/domainJobs.js` runs the `pump*` functions with `Promise.allSettled`. Each job *claims* work with `UPDATE ... WHERE x IS NULL RETURNING` so two servers never do the same item twice | `domainJobs.js`, `leadService.pumpLeadReminders` |
| Migrations | 29 numbered files registered in `db/migrate.js`; additive; run in a transaction with a lock timeout; destructive rollback is disabled on purpose | `db/migrations/*.js`, `db/migrate.js` |
| App | React 19, Vite, TanStack Query. **No router**: `App.tsx` (1,213 lines) holds `view` + `tab` state; the sidebar, phone tab bar and command palette are all driven by one `NAV` array | `src/App.tsx`, `components/layout/navigation.ts` |
| Website | Next.js 15, separate project in `website/`, reads the public plan catalogue | `website/` |
| Tests | Backend: 51 files, every file gets a disposable PostgreSQL database (`scripts/test.mjs`). App: Vitest + Testing Library, 42 files. CI runs both | `tests/`, `src/__tests__/`, `.github/workflows/ci.yml` |

## 2. Capabilities that already exist (verified)

### Identity, tenancy and permissions
- **Tenants** are rows in `tenants` (`id`, `name`, `plan` (a name), `status`, `sessions_limit`, `currency`, `ai_daily_limit`, subscription columns). Users belong to tenants through `memberships(role, category, status)`; roles are `owner`, `admin`, `agent`; `users.is_superadmin` marks platform staff.
- Every request goes through `authenticateToken` then `requireTenantContext`, which resolves the tenant **from the signed token and the user's active membership**, never from a client field alone: an `X-Tenant-Id` header is honoured only if the user has an active membership in that tenant (`middleware/auth.js`).
- `isManager(req)` (owner/admin/super admin/API key) is the one visibility rule shared by inbox, leads and tasks (`services/access.js`, `leadService.visibleTo`).
- **Isolation is by convention, not by the database**: every query carries `tenant_id`. There is no row-level security. `tests/tenant-isolation.test.js` proves the inbox; `leads.test.js` checks that another company's pipeline step is refused. Coverage of the other tables is by their own tests, not by one generic guard. New code has to follow the convention and be tested for it.

### Plans and entitlements
- Plans live in the database (`plans`, `plan_prices`, migration 018) and are cached in memory (`services/plans.js`). A plan carries a list of **feature keys** from a fixed set: `broadcasts, automations, leads, audit, api, ai`.
- `requireFeature(key)` guards routes; `planView(tenant)` is sent to the browser in `GET /api/workspace/capabilities`; the app locks screens from it. Ticking or unticking a feature for a plan tells the affected companies and fires `plan:changed` on the tenant's socket room (`services/planNotices.js`), and open browsers re-read capabilities (`hooks/useInboxRealtime.ts`).
- Subscription state, grace period (7 days), Razorpay, GST invoices and website checkout exist and are tested.

### Shared inbox and CRM
- Multi-user inbox with assignment, resolve, private notes, @mentions, labels, saved replies, number-scoped visibility; reply-time reports with a configurable target (`report_settings.sla_minutes`) and a list of chats still waiting (`reportService.teamResponse(...).waiting`).
- **Sales pipeline** (`016_leads.js`, `leadService.js`): one pipeline per company (`pipelines.tenant_id` is unique), stages (`open`/`won`/`lost`), `leads` (contact, owner, `value`, `source`, `expected_close`, `stage_changed_at`, `closed_at`), `lead_tasks` (follow-ups with one-time reminders and escalation to managers), `lead_activities` (every move, owner change and value change is recorded).
- **A `real_estate` pipeline template already exists** (`PRESETS.real_estate`: New enquiry, Contacted, Viewing booked, Offer made, Negotiation, Deal closed, Lost). It only renames stages.
- Lead owner and chat assignee are kept in sync in both directions (`syncChatOwner`, `syncLeadOwner`).
- Automation rules (keyword, first message, after hours; actions reply, assign, tag, opt-in/out, create lead) with a per-message execution record in `automation_executions` (`status` is `pending`, `completed`, `skipped` or `failed`).
- Notifications (`notifications` table with a `dedupe_key`, live push over the user's socket room), an audit log (`audit_events`), signed webhooks for `message.received` and `message.status`, scoped API keys (`inbox`, `contacts`, `sessions`).

### Riwo AI
- `services/aiService.js`: OpenRouter free models or Claude; per-company daily allowance reserved *before* the call and given back on failure; plan gate (`ai` feature) and an owner switch. Customer text is passed inside tags as data. Outputs are text for a person to read: nothing is sent automatically.
- Existing helpers: `conversationContext` (last 40 messages, internal notes kept apart), `suggestReply`, `summarize` (with mood), `suggestLead`, `improveText`, `translateText`.
- **Limitation:** structured output is parsed with line regexes (`parseLeadSuggestion`); there is no JSON schema validation and no check that extracted facts really appear in the chat.

## 3. What does not exist (verified absent)

| Missing | Evidence |
|---|---|
| Any property, listing or inventory data | no table, route or service; the only match for "property" in `src/` is the word in an AI summary prompt (`aiService.js`) |
| Appointments or viewings, calendar links | no table; only `lead_tasks` follow-ups |
| Per-company time zone | `tenants` has no `timezone`; the browser decides what "today" is |
| Anything between "plan feature" and "everyone" for a vertical | `FEATURE_LABELS` is the only module switch and it is per plan, not per company |
| Resellers, partners, parent/child tenants | no table; `users.is_superadmin` is the only elevated flag |
| Branding, custom domains | one `APP_URL`, one fixed CORS list, one logo in the bundle |
| Lead/viewing webhook events | webhook events are `message.received` and `message.status` only |
| Arabic or right-to-left in the app | app is English only (the website has Arabic and Hindi pages) |

## 4. Architectural limits that matter for this work

1. **One pipeline per company** (`UNIQUE (tenant_id)`). Real estate can live inside it, but a company cannot run a sales and a lettings pipeline separately. Not changed in this work.
2. **`leads.value` is one number** in the company's currency (`AED` or `INR`). It is a hypothetical amount while a lead is open and the recorded deal amount once it is won. Real estate reports must say which of the two they show.
3. **Currency is per company**, only AED and INR are accepted by `setCurrency`. Properties and budgets need their own currency fields and must never be compared across currencies.
4. **Plan features are a closed list**, per plan. Industry solutions need a per-company switch that the platform admin (and later a reseller) controls, with a version, independent of the plan. A plan feature key is the wrong tool; a small table is the right one.
5. **No generic job queue**: domain jobs are a polling loop. That is adequate and consistent (claim-then-act), so new jobs follow the same shape rather than adding infrastructure.
6. **`App.tsx` is a monolith** with local tab state. A new module is added by extending `NAV`, `UserSubTab` and one render block, as Pipeline was.

## 5. Risks to current customers, and how this work avoids them

| Risk | Mitigation |
|---|---|
| A migration on the shared production database | Additive only: new tables, no `ALTER` on existing tables, no data rewrites. Migrations are not run in production by this work; deploy needs explicit approval |
| Changing core behaviour while adding a vertical | Real estate lives in `src/solutions/real-estate/` and `src/components/realestate/`. Core files change only to *mount* it (router, capabilities field, `NAV` entry, job list). Core never imports real-estate data |
| A company seeing a module it never bought | Server: `requireSolution("real_estate")` on every route. App: nav entry hidden unless the capabilities say the solution is active. Default for every existing company is **off** |
| Cross-company data leaks in new tables | Every new table has `tenant_id`; every query filters on it; ids from the client are looked up with the tenant, never trusted alone; explicit cross-tenant tests |
| AI inventing listings, prices or availability | Matching is deterministic SQL/JS over the company's own records; AI only drafts text and may only mention listings the server inserts; every draft is checked and shown as a draft |
| Duplicate alerts or reminders | Alerts have a unique key while open; scans claim work in the database; viewing creation is idempotent and conflict-checked inside a transaction |

## 6. The smallest viable plan (and what was built)

| Slice | Acceptance criteria | Status |
|---|---|---|
| S1 Solution registry and entitlements | A registry names the available solutions; the platform admin can switch one on or off per company; the company is told; the server rejects calls when it is off; capabilities tell the app; default off; cross-tenant tested | see progress file |
| S2 Real-estate qualification | A lead can carry a validated qualification profile; type, intent, budget and currency, areas, property types, bedrooms, timeline, source, status, next action; stage history stays in the core activity log | see progress file |
| S3 Inventory and deterministic matching | Properties are company-owned records with a unique reference, status, price, currency, verification date, authorised URL and approved media; matching returns each property with the reasons it fits and warnings; nothing is invented | see progress file |
| S4 Viewings | Booking with agent and property conflict checks, idempotent create, correct time zones, confirm, reschedule, cancel, complete, reminders and follow-ups through the existing task system | see progress file |
| S5 Revenue Leak Detector | Six real conditions detected from real rows; one alert per condition while open; auto-resolved when fixed; managers notified once; value shown as *pipeline (hypothetical)* separate from *won (recorded)* | see progress file |
| S6 Riwo for real estate | Qualification extraction validated against the chat; deterministic missing-information and next-action hints; drafts that can only cite approved listings | see progress file |
| S7 App | Native-feeling screens behind the entitlement; platform admin switch | see progress file |
| S8 White-label | Staged design only (`white-label-foundation.md`); nothing claimed as built | design |

## 7. Explicitly out of scope here

Other industries, a generic plugin framework, a second pipeline, calendar integrations that need customer credentials
(Google/Microsoft), sending WhatsApp messages automatically from a workflow, reseller billing, custom-domain routing and
TLS, and Arabic/RTL in the app. Each is listed with its prerequisite in the progress file.
