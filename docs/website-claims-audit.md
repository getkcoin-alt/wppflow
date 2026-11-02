# What the website promises, and what backs it

Checked on 22 October 2026 against the code and the automated tests; updated on 25 October 2026 for task board 1.2. "Test" means a named automated test
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
| "Forgot password?" on the sign-in page emails a one-hour, single-use link; the answer is the same whether or not the address has an account; a reset signs out every device and sends a "password changed" notice | Test | `password-reset.test.js`, `password_reset.test.tsx` |
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

**Built since** (25 October, task board 1.2): reply-time reports and a leaderboard, round-robin and least-busy
assignment of new chats, follow-ups on chats with no lead and escalation of overdue ones (see "Built since the
pipeline"). **Not built yet:** win-rate reports, "no reply in two days" alerts on a lead, broadcasts to a step, lead
webhooks and an API key scope for leads, custom fields, more than one pipeline. The pricing page does not mention the
pipeline yet.

## Scriwo Real Estate (industry solution)

Added on 27 October 2026. **The website says nothing about it and should keep saying nothing until it is deployed and a pilot
brokerage has used it.** Every line below is covered by an automated test; none has been seen in production. Details and
limits: `docs/industry-solutions-progress.md`.

| Behaviour | Evidence |
|---|---|
| Off for every company until the platform admin switches it on; the switch is audited, tells the company's owners and admins, and the navigation item appears live. The server refuses every route while it is off or when the plan lacks Leads | `solutions.test.js`, `real_estate_core.test.tsx` |
| A company can never read or write another company's profiles, listings, viewings or alerts, whatever id it sends | `real-estate-leads.test.js`, `real-estate-viewings.test.js`, `real-estate-leaks.test.js` |
| A lead carries one validated qualification (type, intent, budget and currency, areas, types, bedrooms, timeline, status, next action) | `real-estate-leads.test.js`, `real_estate_qualification.test.tsx` |
| Matching is by rule, not by AI: a listing must be available and fit purpose, currency, budget maximum, bedrooms, type and area; every match says why, warns about what to check, and says how many were left out and why | `real-estate-pure.test.js`, `real-estate-leads.test.js` |
| Arabic and English are matched without translation (alef, diacritics and Latin accents folded) | `real-estate-pure.test.js` |
| A viewing cannot clash for the agent, the property or the client; pressing twice books once; the time is kept in the zone it was booked in, correct across daylight-saving changes; a reminder and a follow-up are created; an ICS file can be downloaded | `real-estate-viewings.test.js`, `real_estate_screens.test.tsx` |
| The confirmation message is text for a person to send. Nothing is sent to WhatsApp automatically | `real-estate-viewings.test.js`, browser run |
| Six revenue leaks are found from real rows; one alert per leak while open; fixed leaks close themselves; managers are told once; a batch above ten is one summary | `real-estate-leaks.test.js` |
| Money is labelled: open pipeline and at-risk are **hypothetical** (what leads are marked at); only **won** is **recorded**. No figure is shown as revenue that is not | `real-estate-leaks.test.js`, `real_estate_screens.test.tsx` |
| Riwo may propose a qualification, but every field needs a word-for-word quote found in the chat; drafts may mention only approved, fresh listings and the server rejects any price, figure or link of its own; the person edits and saves | `real-estate-ai.test.js`, `real_estate_qualification.test.tsx` |

**Not built, so not to be claimed:** calendar sync (Google or Microsoft), automatic WhatsApp confirmations, import from
Property Finder or Bayut, Arabic or right-to-left screens, a second pipeline, white-label or reseller features (design only:
`docs/white-label-foundation.md`).

## Welcoming people from other countries (automation)

Added on 28 October 2026 (Growth and above for the automation; "Let Riwo chat" also needs Riwo, which is Growth and above).
**On the website since 2 November 2026** (Riwo page, "Welcome people from abroad" under what Riwo can do on its own). Every line is covered by an automated test and a browser run on a disposable database; none has
been seen with a real WhatsApp number.

| Behaviour | Evidence |
|---|---|
| A rule can start on "a number from another country writes", with the company's own country (or several) chosen once; numbers from there are left alone. The country is read from the number's calling code | `auto-chat.test.js`, `abroad_recipe.test.tsx` |
| A number that cannot be placed (too short or long, a local number, a WhatsApp linked id or a group id) is never taken for a foreigner | `auto-chat.test.js` |
| By default only a first message counts, so someone who has been chatting for months is not welcomed as a stranger | `auto-chat.test.js` |
| The welcome (hello, "how did you find us: AI, website, social media or word of mouth?", a person will be in touch) is the company's own text, sent word for word, once, before any AI is involved | `auto-chat.test.js` |
| "Let Riwo chat": until a teammate replies, Riwo answers short questions in a sentence or two, **only** from text the company wrote about itself. It never sees private notes. A reply that contains a figure, link or address that is not in the company's text, is too long, or is not in the expected form is **not sent**: the company's own hand-over words go instead, once, and the team is told | `auto-chat.test.js` |
| It stops for good when a teammate (or the phone's owner) writes in the chat, when the chat is closed, after a day of quiet, or after the number of replies the rule allows; a private note does not count as a reply | `auto-chat.test.js` |
| If Riwo is switched off, not in the plan, or the day's allowance is used up, nothing is sent, the rule records that it chose not to speak, and the team is told. Each answer is one request from the daily Riwo allowance | `auto-chat.test.js` |
| When a customer says how they found the company, the answer is checked against the company's list and saved on their contact as a tag such as "Found us: Website" | `auto-chat.test.js`, browser run |
| Repeating or retrying a message never repeats the welcome or the answer | `auto-chat.test.js` (with the retry paths broken on purpose to prove it) |
| The screen: one card and one form, with the country worked out from the linked number, the welcome already written, and one thing left for the company to write | `abroad_recipe.test.tsx`, browser run on desktop, phone and dark |

**Limits to state honestly.** Riwo's answers are checked, not guaranteed: on a free model the wording can still be clumsy,
and Riwo can only be as right as the text the company gave it. The company's text and the customer's messages are sent to
the AI provider (free models may keep them; the app already says so). Replies go out through the same unofficial WhatsApp Web
link as everything else, and only to people who wrote first. The welcome tells people they can ask "me" questions; Riwo says
it is an automated assistant if asked, but a company that must disclose automation up front should say so in its welcome.
Not built: a different rule per country, answers from a document or a website, hand-over to a named teammate.

## Signing up and signing in with Google (28 October 2026)

Needs the Google client id and secret on the server (`docs/google-signin.md`); without them the button is hidden. Every line
is covered by an automated test and a real-browser run (only Google's own sign-in page was simulated).

| Behaviour | Evidence |
|---|---|
| "Get started free" and "Buy" on the pricing page (rupees) open the app's sign-up with the plan carried along; dirhams and Enterprise still go to the contact form | `signup.test.ts` (website) |
| The sign-up page says which plan was chosen; Free goes straight in; a paid plan opens its payment (priced by the server) once the person is in | `google_signin.test.tsx`, `billing_page.test.tsx`, browser run |
| "Continue with Google" is shown only when the server has it set up; a refusal or cancellation is explained in plain words | `google-auth.test.js`, `google_signin.test.tsx` |
| The identity is checked (one-time state, nonce, PKCE, audience, issuer, expiry, verified e-mail) before anyone is signed in; the client secret never reaches the browser | `google-auth.test.js` (each check broken on purpose) |
| A new Google person gets a Free workspace, never a paid one; an existing person with the same verified e-mail is joined to their account; a disabled account stays out; sign-up switched off blocks new people only | `google-auth.test.js` |

**Not proven:** a real sign-in with Google. That needs the client id and secret on the live server and Google's consent screen in production mode.

## Plans

Checked again on 25 October 2026 (first on 22 October, after the platform admin was given the choice of plan).

| Website says | Status | Evidence |
|---|---|---|
| Free: one account, one number | Test | The number limit is 1 and the second number is refused; a teammate can't be invited (`plans-admin.test.js`, `ai-assistant.test.js`) |
| Starter: up to 3 numbers; shared inbox, assign and resolve, private notes and @mentions, contacts CSV, themes | Test | Limit of 3 set from the plan; the inbox features are covered in the table above and are open on every plan |
| Starter has no broadcasts, automations, audit log or API | Test | Locked by plan in the server and the screens (`plans-admin.test.js`, `ai-assistant.test.js`) |
| Growth: up to 10 numbers; adds broadcasts, automations, audit log | Test | Limit of 10 set from the plan; the three are open on Growth and above |
| Growth: saved replies, desktop and offline alerts | Code | Built and working, but deliberately open on **every** plan: alerts protect customers from a missed message, and saved replies are a small convenience. The page lists them under Growth, so Free and Starter get more than it promises |
| Business: up to 25 numbers; scoped API keys, signed webhooks | Test | Limit of 25 set from the plan; keys and webhooks are locked below Business |
| Business: API keys, webhooks, API tester and SDK samples | Test | The whole Developers module is locked on Free, Starter and Growth: it stays in the navigation with a lock, opens a page that names the Business plan and what it adds, and nothing behind it is shown or asked of the server. Owners and administrators get "See the plans"; other teammates are told to ask the owner. Pipeline, Broadcasts and Automations carry the same lock in the navigation on plans without them. `developer_lock.test.tsx` |
| Enterprise: custom number limit | Test | The platform admin must type the limit; no default is guessed |
| Onboarding call, dedicated onboarding, help connecting your systems | Service | Not software |
| The platform admin chooses the plan when creating a company, and can change it later | Test | Required, one of the five, with the plan's number limit filled in and editable; changing it takes effect at once, removes nothing, and says what a smaller plan leaves the company with (`plans-admin.test.js`, `platform_plans.test.tsx`) |
| Companies see their own plan and what it includes | Test | "Your plan" card in Team, System (`platform_plans.test.tsx`) |
| Companies on the original "Workspace" plan | Kept | Any plan name that is not one of the five keeps every feature, so nothing already working stops. They can be moved to a plan from the platform screen |
| Growth: Riwo, the AI reply assistant (with a daily allowance per company) | Test | Locked below Growth by the server and the screens. Each company has a daily allowance (server default 300, or the number the platform admin agrees); `ai-assistant.test.js`, `plans-admin.test.js` |
| Riwo translates into 15 languages | Code | The list in `src/services/ai.ts` has 15; the page says the same |
| Growth: sales pipeline | Test | Enforced (Growth and above). Mentioned on the pricing page (Growth), the features pages and the home page since 2 November 2026 |
| AI usage is part of the subscription | Test | The company's "Your plan" card shows today's Riwo use against its allowance, when it resets, and the month so far; the platform admin sees each company's use and can agree a different daily allowance when adding a company or changing its plan, with the change in the audit log (`ai-assistant.test.js`, `plans-admin.test.js`, `platform_plans.test.tsx`) |
| Self-service sign-up | Fixed | It used to create a "Workspace" company with every feature and 5 numbers, which skipped the pricing page entirely. It now creates a Free company: one person, one number. Set `ALLOW_PUBLIC_SIGNUP=false` on the server to turn sign-up off |

## Subscription terms: what the legal pages promise, and what the product does

The terms of service, the refund and cancellation policy and the pricing page describe a subscription. Payments can be
recorded by the platform admin (an invoice or a payment link) or, once the Razorpay keys are set, made online by the
company; either way the period paid for gives the company its renewal date. Built on 25 October 2026
(`subscriptionService.js`, migration 017; online payment in `billingService.js`, migration 020).

| The pages say | Status | What the product does |
|---|---|---|
| Paid plans are billed monthly or annually, in advance | Test | Each company has a billing cycle and a period (start and renewal date), set by recording a payment; the payments are kept with plan, amount and reference (`subscription.test.js`) |
| The plan renews at the end of each period, or we send an invoice or payment link before each period | Test, partly | Owners see "Renews on" in Your plan; owners and administrators get an in-app notice once, 14 days before; the platform list shows who renews in 14 days. The invoice or payment link itself is still sent by hand |
| If a payment fails or is overdue we may suspend paid features after notice | Test | Updated 25 October (owner decision: seven days' grace). The company is flagged and told when it is overdue; seven days after the renewal date its paid features switch off and it has what Free has; nothing is deleted and paying brings everything back at once (`subscription.test.js`, `plan-catalogue.test.js`) |
| Cancel at any time; the plan stays active until the end of the period paid for | Test | "Change at period end" to Free: the plan stays until the renewal date, then the company is on Free; its conversations and numbers are kept |
| Upgrades take effect straight away | Test | Changing the plan applies at once (`plans-admin.test.js`). Paying online for a bigger plan credits the unused days of the current one; a payment recorded by hand is invoiced as agreed (`billing.test.js`) |
| Downgrades take effect from the next billing period | Test | A smaller plan can be scheduled for the end of the period; paying for the next period names the plan it is for |
| Accounts are activated within one working day | Service | Not software |
| 30 days' notice before a price change | Service | Not software |

Staff never see billing. Owners and administrators see the plan, cycle and dates, every payment and every invoice (task board decision 6).

## AI usage in the subscription

| Behaviour | Evidence |
|---|---|
| Your plan shows Riwo requests today against the allowance, whether it is the plan's or agreed for the company, when it starts again, and the month so far | `ai-assistant.test.js`, `platform_plans.test.tsx` |
| The platform list shows each company's Riwo use (today, this month) and its allowance, or that Riwo is not in its plan | `plans-admin.test.js`, `platform_plans.test.tsx` |
| The platform admin can agree a daily allowance when adding a company or changing its plan, with the old value in the audit log | `plans-admin.test.js` |

## Online payment, invoices and plan limits

Built on 25 October 2026 (task board 1.2). Everything here is covered by an automated test **against a simulated
Razorpay**. Nothing has been run against Razorpay itself: online payment stays off until the keys exist
(`/health` shows `payments.configured`).

| Behaviour | Status | Evidence |
|---|---|---|
| Monthly and yearly prices are read from the database; a year costs ten months; the platform admin edits them without a release | Test | `plan-catalogue.test.js`, `plans-admin.test.js`, `plan_catalogue.test.tsx`, `platform_plans.test.tsx` |
| The price, the credit for unused days and the 18% GST are worked out on the server; the browser never says what something costs | Test | `billing.test.js` |
| A payment activates a plan once, however many times the browser and the webhook report it, in either order; a wrong amount, currency or company, a tampered signature and a failed payment activate nothing | Test | `billing.test.js` (the checks were broken on purpose to confirm the tests fail) |
| A webhook with a bad signature is refused; the same event twice does nothing the second time | Test | `billing.test.js` |
| A lost webhook is recovered by a job that asks Razorpay | Test | `billing.test.js` |
| GST invoices: gapless numbers, CGST + SGST when the buyer is in the seller's state and IGST elsewhere, PDF, only the company's own invoices | Test | `billing.test.js`. The accountant still has to confirm the fields and the service code |
| An invoice number is at most 16 characters (CGST Rule 46): `SCZ/26-27/00001`, a new series each April. It was 17 characters (`SCZ/2026-27/00001`) until 26 October 2026, which Rule 46 does not allow; no invoice had been issued | Test | `billing-settings.test.js` |
| An invoice states "Tax payable on reverse charge: No." and the GST rate it was issued at | Test | `billing-settings.test.js` |
| Autopay is opt-in and for monthly plans only; one charge is one period | Test | `billing.test.js` |
| AED: "Online payment in AED is coming soon" on the pricing page and in the plan comparison | Code | `website/src/content/plans.ts`, `PlanCompare.tsx` |
| A plan can limit contacts and broadcasts started in a month; the limit is enforced on the server and warned about from 80%; a customer's message is never refused | Test | `plan-limits.test.js`, `plan_limits.test.tsx`. No plan has a limit set today and the pricing page advertises none |
| The pricing page's FAQ "Can I pay online?" and "How do I buy a plan?" | Code | They say online purchase works in India when the server reports it is switched on, and say it is being added when it is not (`website/src/app/pricing/page.tsx`) |

## Buying from the website (rupees, India)

Built on 26 October 2026. A visitor chooses a paid plan on the pricing page, fills in the company and invoice details,
pays through Razorpay and gets a workspace, with no account made beforehand. Everything below is covered by automated
tests **against a simulated Razorpay**, and by a browser run through the real website and backend with the same
simulation. Nothing has been run against Razorpay itself.

| Behaviour | Status | Evidence |
|---|---|---|
| Starter, Growth and Business can be bought online in rupees. Free, Enterprise and anything in AED are still set up by the team | Test | `website-checkout.test.js`, `PricingGrid` |
| The price, the CGST + SGST or IGST split and the period are worked out on the server from the plan prices and the billing settings; the browser cannot name a price | Test | `website-checkout.test.js` |
| Nothing is created for a buyer until Razorpay has confirmed the payment: no company, no user, no invoice, no email | Test | `website-checkout.test.js` |
| A confirmed payment makes the company, its owner, the billing details, the tax invoice, the setup email and a receipt in one transaction, once, whether the browser check, the signed webhook or the reconciliation job gets there first | Test | `website-checkout.test.js` |
| A wrong signature, a payment for another amount or order, and a failed payment set nothing up | Test | `website-checkout.test.js` |
| An email that already has an account is turned away before any money is taken; if one appears while the buyer is paying, no company is attached to it, the order is flagged for a person and shown under the buyer's company name in Online payments and the billing audit | Test | `website-checkout.test.js`, `online_payments.test.tsx` |
| The terms and the refund policy must be ticked, and when is recorded on the order | Test | `website-checkout.test.js` |
| A visitor can start 12 orders per 30 minutes; there is a ceiling on orders for the whole site; a hidden field turns bots away | Test | `website-checkout.test.js` |
| The success page asks for the order's status with a token only the buyer's browser was given | Test | `website-checkout.test.js` |
| A plan renamed in Subscriptions is still the plan a company has (companies keep their plan by name; plans are now found by code or current name, and two plans cannot share a name). Before this, a company that paid after a rename was treated as unrestricted | Test | `website-checkout.test.js` |
| Terms, shipping policy, FAQs and `llms.txt` say accounts are made on payment when bought online | Code | `website/src/app/terms`, `shipping-policy`, `content/faqs.ts` |
| Known gap: a refund or a chargeback does not remove access by itself (as in the app); a ₹1 or test purchase still uses a number in the real invoice series | Known gap | |
| Known gap: no UAE (AED) online payment, and no Free plan sign-up from the website; both still go through the contact form | Known gap | |

## Subscriptions module (platform admin)

Built on 26 October 2026. Platform admin, **Subscriptions** tab.

| Behaviour | Status | Evidence |
|---|---|---|
| Rates: monthly and yearly prices in INR and AED, whether GST is added to or included in the price, whether a plan is for sale; a preview of what a customer pays at the current GST rate | Test | `subscriptions_module.test.tsx`, `plan-catalogue.test.js` |
| Services & limits: name, WhatsApp numbers, people, contacts, broadcasts a month and the included features. Rates and services save separately, so one cannot overwrite the other | Test | `subscriptions_module.test.tsx`, `plans-admin.test.js` |
| Invoice & tax: service code (SAC), GST rate, invoice prefix, whether an upgrade credits unused days, and the seller's name, GSTIN (checksum checked), address and billing email. The seller's state is read from the GSTIN | Test | `billing-settings.test.js`, `subscriptions_module.test.tsx` |
| Changing the service code, the GST rate, the GSTIN or the prefix asks for confirmation first | Test | `subscriptions_module.test.tsx` |
| An invoice that has already been issued keeps the seller details, the service code and the GST rate it was issued with; the next one uses the new settings, and the numbering carries on across a new prefix | Test | `billing-settings.test.js` |
| Ticking or unticking a module for a plan locks or unlocks it at once for every company paying for that plan: the server refuses the module's routes, and the screens show the lock. A company switched to Free by a late payment is not affected, because its access did not change | Test | `plan-modules.test.js` |
| The owners and administrators of those companies get one notification saying what was switched on or locked, that nothing was deleted, and which plan to choose to get a locked module back. Agents are not notified; companies on other plans hear nothing; a change to prices, limits or the name alone tells nobody | Test | `plan-modules.test.js` |
| An open browser looks at its plan again when the server says it changed (and after a reconnect or when the tab returns), so a lock or unlock appears without a refresh | Test | `plan_live.test.tsx` |
| Before saving, Services & limits says what will be locked or switched on, for how many companies, and that their owners are told; after saving, how many people in how many companies were told | Test | `subscriptions_module.test.tsx` |
| Change history lists every plan change and every invoice-setting change, newest first, with who changed it and from what to what | Test | `billing-settings.test.js`, `subscriptions_module.test.tsx` |
| The website's pricing page, home page starting price, city pages, `llms.txt`, `llms-full.txt` and the price data for search engines read the prices, number limits, tax mode and GST rate from the product, looking again every five minutes. If the product cannot be reached they fall back to the list in `website/src/content/plans.ts` | Test | `website/src/__tests__/catalogue.test.ts`. The fallback prices must be kept equal to the product's by hand |
| Still written by hand on the website: each plan's feature list, "who it is for", and every sentence elsewhere that quotes a price ("from AED 299 / ₹2,499" in the comparison pages, the general FAQ, the blog, the free-CRM page, the Arabic and Hindi pages and the terms). They do not change when a rate is edited | Known gap | `website/src/content/` |
| Not built: adding a brand-new plan. The five plans are fixed; their prices, limits and features are editable | Known gap | |

## Built since the pipeline

| Behaviour | Evidence |
|---|---|
| Coloured labels, filters by label, New chat for a typed number, contact names that keep WhatsApp's name apart | `labels-and-names.test.js`, `labels_names_newchat.test.tsx` |
| Reply-time reports: median and 90th percentile, share inside a target, leaderboard, waiting chats, CSV, daily summary for owners | `reports.test.js`, `reports_page.test.tsx` |
| Waiting and overdue chat filters, pinned chats, "is writing a reply" warning, follow-ups on chats with no lead, escalation | `inbox-followups.test.js`, `inbox_followups.test.tsx` |
| Number health: heartbeat, failed and waiting sends, alerts to the owner and managers | `number-health.test.js`, `batch3_screens.test.tsx`. The heartbeat asks WhatsApp Web's `isConnected()`; to be watched on the live server |
| Automatic assignment of new chats: in turn or least busy, away switch, hours, limits, returning customers | `assignment-rules.test.js`, `batch3_screens.test.tsx` |
| Platform console: totals, every company's number health, billing audit, support access written down and readable by the company | `platform-console.test.js`, `batch3_screens.test.tsx` |
| Summaries say how the customer sounds | `ai-assistant.test.js`, `riwo.test.tsx` |

## What to build next

1. **Plan allowances for Riwo** in the plan table (for example Growth, Business and Enterprise each with their own
   daily number) and shown on the pricing page. Today every plan with Riwo shares one server default, and the free
   OpenRouter models cap the whole account (50 requests a day without credit, 1,000 with $10), far below the sum of
   what companies may ask.
2. **Pricing page and features pages**: add the sales pipeline to Growth, and a pipeline feature page.
3. **Move saved replies and desktop alerts to Growth**, or keep them open on every plan and say so: the page lists
   them under Growth, but they work on every plan.
4. **Reminders by email** to owners, and a weekly list of renewals and overdue companies to the sales inbox. Today
   the reminders are in the app only.
5. **Switch on online payment**: Razorpay test keys, the test-mode run, live keys; then change the pricing FAQ and the
   terms wording. **AED online payment** waits for the international gateway.
6. **A staging smoke test and a restore drill** for the database backup.

## Not software

"Onboarding call for your team", "Dedicated onboarding" and "Help connecting your systems" are services, not
features. Online payment in rupees works when the Razorpay keys are set on the server (the website flag `PAYMENTS_LIVE` is still
false and only controls the older banner; whether Buy buttons show is decided by the server); AED, Free and Enterprise are
set up by the onboarding team and payments are recorded by hand.


## AI-first home, Autopilot, Sales assistant, hand-off and white-label (website update, 2 November 2026)

New pages and copy: `/features/ai-today-home`, `riwo-autopilot`, `ai-sales-assistant`, `ai-handoff-and-disclosure`,
`whatsapp-sales-pipeline`, `team-reports-and-assignment`, `/white-label`, the home page's "AI that does the work" section, the
Riwo page's "When you switch it on", the Growth and Enterprise plan lists and the FAQs. Fixed on the same day: the Riwo page,
its steps and FAQ said "Riwo never sends anything to a customer on its own", which stopped being true when Autopilot and the
Sales assistant were built; they now say the default (a person sends) and the optional exceptions. The counts on the home and
security pages are now 74 backend test files and 608 app tests.

| Website says | Status | Evidence |
|---|---|---|
| Today is the first screen: waiting chats with mood, one-line summary and a prepared reply; follow-ups, numbers needing care, reply-time performance; a morning brief; a setup coach; Ask Riwo in plain words (opens screens and fills things in, never acts silently) | Test | `home.test.js`, `ai-prep.test.js`, `ai-brief.test.js`, `ai-command.test.js`, `today.test.tsx`, `command_palette.test.tsx`. Prepared replies and the brief need Riwo (Growth and above); the screen itself is on every plan |
| Riwo prepares in the background from the daily allowance and a person's click always goes first | Test | `ai-router.test.js` (background work uses half of a provider's limit), `ai-prep.test.js` |
| Owners can switch Riwo off for the whole company | Test | `ai-assistant.test.js`. There is **no** separate switch for preparation alone in the screens, so the site does not claim one |
| Autopilot is off until an owner turns it on; it sends only a saved reply word for word, or clears a thank-you; never in groups, in a chat a teammate owns or answered lately, when the customer sounds unhappy or urgent, to someone who said stop, twice in a few hours, or past a daily limit; every action is listed and can be undone | Test | `autopilot.test.js` |
| Everything Riwo sends ends with a line saying it is automated and how to reach a person; "human" (English, Arabic, Hindi, Hinglish) stops Riwo, notifies the team and puts the chat first | Test | `handoff.test.js`, `auto-chat.test.js` |
| Private mode limits Riwo to providers that do not keep or train on messages; free providers may keep what they are sent | Test | `ai-router.test.js` |
| Sales assistant: welcome plus the first question, up to six questions asked word for word, answers kept, a lead made after the first answer, pricing/quote/proposal requests (English, Arabic, Hindi, Hinglish) handed over before the model is asked with the company's formal message, lead moved to Proposal (never backwards), requirements in a private note, team notified, follow-up task, works without the model | Test | `sales-assistant.test.js` (each rule broken on purpose), `sales_recipe.test.tsx` |
| "Read my website" drafts the about text and questions from the company's public pages, leaves out prices, and is checked by the owner before use | Test | `website-reader.test.js` (private addresses, redirects and the price filter each broken on purpose), `sales_recipe.test.tsx` |
| Reply-time reports, leaderboard, daily owner summary, round-robin or least-busy assignment, follow-ups on chats, labels and filters | Test | `reports.test.js`, `assignment-rules.test.js`, `inbox-followups.test.js`, `labels-and-names.test.js`, `reports_page.test.tsx` |
| Growth includes the AI features, the pipeline, assignment and reports; Free and Starter list none of them | Test | `plans-admin.test.js`; `website/src/__tests__/content.test.ts` checks the pricing copy. Reports are open on every plan in the product (like saved replies), so Free and Starter get more than the page promises |

**White-label.** The site now offers white-label and reseller partnerships (`/white-label`, the FAQ, Enterprise, the footer and
`llms.txt`). **It is an offer made through a conversation, not a feature.** The product has no partner role, no branding fields,
no custom domains and no partner billing (`docs/white-label-foundation.md`, "design only"). What exists today is Stage 0: our
team creates each client's company, picks the plan and switches industry layers on, and every company's data is separate. So the
page promises only that, says that branding, domains and pricing are "agreed with our team" and that we tell the partner "what is
available today", and lists branding, domain and billing as topics rather than features. `content.test.ts` fails if the wording
turns into "self-serve", "instantly", "in minutes", "one click" or "unlimited". Before anyone is told they can have their own
logo, domain or partner billing, Stages 1 to 3 of that document have to be built.

**Still not on the website, on purpose:** Scriwo Real Estate (not deployed to a pilot), the Arabic and Hindi pages (`/ar`, `/hi`
have not been updated and still describe the earlier product), and any claim that a model "learns" from chats (it does not: Riwo
reads the text the company wrote, and the website it points to, and nothing is trained).


## Scriwo Homes (property agencies), 2 November 2026

Decision (owner, after advice from a peer): real estate in Dubai is the first vertical. The same app is served at
`homes.scriwo.com`; the address decides the name and words on the sign-in page, which screen a new workspace opens on, and what
sign-up sets up. New: `/homes` on the website (header, footer, `llms.txt`), `website/src/content/homes.ts`.

| Website says | Status | Evidence |
|---|---|---|
| Signing up at homes.scriwo.com opens a property workspace: the real-estate layer on, the property pipeline (New enquiry, Contacted, Viewing booked, Offer made, Negotiation, Deal closed, Lost), a 14-day Growth trial with no card, and the Property assistant as a ready-made rule | Test | `vertical.test.js`, `automation-rules.test.js`, `vertical_homes.test.tsx` |
| After the trial the workspace stays; seven days later the paid features switch off, nothing is deleted | Test | `vertical.test.js` (uses the existing renewal-date and grace rule, so the trial needs no new billing code) |
| The AI never states a price, availability or a return; pricing goes to a person; every automated message is recorded; data can be exported | Test | `sales-assistant.test.js`, `real-estate-ai.test.js`, `accountability-export.test.js` |
| Not claimed, because not built: calendar sync, automatic WhatsApp confirmations, Property Finder or Bayut import, Arabic screens | Checked | `content.test.ts` fails if the page says otherwise |

**Known limits.** The vertical is chosen by the address the visitor signs up on (and by a field the browser sends), so anyone can
ask for the trial from any address: it is a free trial for everyone who asks, rate-limited like any sign-up. "Continue with
Google" is hidden on `homes.scriwo.com` until that address is registered as a redirect URI with Google (Google returns to one
registered address). Not seen with a real agency yet. `/homes` says "we are onboarding our first agencies".


### Scriwo Homes: 14-day trial, sign-up first, and the real-estate dashboard (update, 2 November 2026)

Owner's decisions: the trial stays 14 days for everyone (no two-month offer for early agencies); on the website a plan or the
trial both go to sign-up first; people with a real-estate business land on a real-estate dashboard.

| Website says | Status | Evidence |
|---|---|---|
| "Start a 14-day free trial" (pricing page, Growth card; Scriwo Homes page) signs the visitor up first; the workspace then starts on Growth for 14 days with no card, and the person chooses a plan inside the app | Test | `vertical.test.js` ("the 14-day trial from the website"), `vertical_homes.test.tsx`, website `signup.test.ts` |
| After the trial the workspace keeps working on Free and nothing is deleted | Test | `vertical.test.js` (the existing renewal date and grace rule) |
| Sign-up asks "What does your company do?"; choosing real estate gives the property workspace and the same trial from any address | Test | `vertical.test.js`, `vertical_homes.test.tsx` |
| A company with the real-estate layer opens on the property dashboard when someone signs in (any address); other companies open on the general home | Test | `vertical_homes.test.tsx` |
| Same price: the real-estate layer, pipeline and assistant come with Growth and above | Test | `plans-admin.test.js`; the page quotes no price of its own |
| "Riwo does not decide the budget or close the deal": it asks, records and hands over; pricing and proposals go to a person | Test | `sales-assistant.test.js`, `real-estate-ai.test.js` |
| Data: separate per agency, role-based on the server, export at any time, tamper-evident record of automated messages | Test | `tenant-isolation.test.js`, `accountability-export.test.js` |

**Not promised, on purpose.** The brief asked for "100% data protection surety". The page does not say that: no software can promise
it, and a written guarantee would make the company liable for more than anyone can control. It states what the product does and
says that once an export leaves Scriwo, protecting that copy is the customer's job. `content.test.ts` fails if "100%",
"guarantee" or "surety" appear on the page, or if the founding "two months" offer returns.

**Known limit.** Anyone can start a trial, and a person who makes a second workspace gets a second trial; sign-ups are
rate-limited like any other. The main menu already lists Features, Scriwo Homes, Riwo AI, Industries, Pricing, Developers,
White-label and Guides, and a test keeps that order.


## Knowledge base, Riwo sales agent and describe-it-in-your-words (3 November 2026)

Built, and on the website only as described here. Evidence is the named tests; nothing has been seen with a real customer conversation,
a real provider or a real company website.

| Behaviour | Status | Evidence |
|---|---|---|
| The owner adds up to five websites; Riwo reads them page by page (robots.txt obeyed, private addresses refused), writes what the company does and lists its products, and an owner's notes are added | Test | `knowledge-base.test.js`, `knowledge_agent.test.tsx` |
| Refresh reads a site again and updates only what changed; a page taken down is forgotten; an unchanged site costs no Riwo request; sites are re-read every 24 hours | Test | `knowledge-base.test.js` (each rule broken on purpose) |
| Riwo is given the profile, the notes and the pages that match what the customer wrote; every answer is checked against that text | Test | `knowledge-base.test.js`, `riwo-agent.test.js` |
| The Riwo sales agent talks from the knowledge base from the very first message, learns what the customer needs, and works toward one of four closes | Test | `riwo-agent.test.js` |
| Prices go to a person unless the company lets Riwo repeat the prices on its website; an invented price or link is never sent; a second try, then a person; ready customers and unanswerable questions are handed over with a summary | Test | `riwo-agent.test.js` (the figure check, the price gate and the hand-over each broken on purpose) |
| "Describe it in your own words": Riwo asks up to three questions, then drafts an agent that passes the same checks; nothing is saved or switched on | Test | `agent-draft.test.js`, `knowledge_agent.test.tsx` |

**Not claimed.** That Riwo "closes sales" by itself: it moves the customer to the next step and a person finishes the sale. That it
"learns" or "trains" from chats: it reads the website and notes, nothing else. That it works for any website: sites that only show
their words after loading scripts cannot be read.
