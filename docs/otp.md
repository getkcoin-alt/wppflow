# Free OTP: one-time codes on WhatsApp for your website or app

A company's website or app asks Scriwo to send a one-time code to one of its users on WhatsApp, and to check what the user typed.
It is free on every plan (Free included), set up in **Developers → Free OTP** in about two minutes, and needs no sender ID, no
template approval and no per-message fee, because the code is sent from **the company's own linked WhatsApp number**, the way
WhatsApp Web sends a message. Scriwo links numbers as devices; this is not the official WhatsApp Business API, and nothing here
says it is.

## The page

One page, five cards, in the order a person needs them. A choice shows at once (the page works out what the server will answer, starts the preview at the same time as the save, and puts the old values back with the reason if the save is refused):

1. **What is the code for?** Sign in, Sign up, Password reset, Payment, Delivery, Booking, Account change, Verify my number. One tap
   sets the wording and the usual digits, time and tries. *Fine-tune* holds the name in the message (the company's name unless
   changed), the language (English, हिन्दी, العربية), digits (4 to 8), how long a code works (1 minute to 1 hour), tries (1 to 10)
   and the wait before another code (15 seconds to 5 minutes). The message is shown as a WhatsApp bubble as it will read.
2. **Where do the codes come from?** One of the company's linked numbers (the first connected one unless another is chosen). The page
   notices a number being linked by itself.
3. **Try it yourself.** A real code from that number to a phone typed in, the delivery tick, the code typed back, and the time it took.
4. **Connect your site.** *Your server*: a secret key (shown once), the code to paste (Node.js, Python, PHP, Java, cURL, or the fields
   of a no-code HTTP step) with the real key and address filled in. *Web widget*: the websites it may run on, a public key, one
   script tag, and the server's check of the proof. Optional *Get notified*: one webhook address.

5. **Or let your coding agent do it.** One tap copies a prompt for Claude Code, Cursor, Copilot or any coding agent, with everything chosen
   above in it (see *The prompt for a coding agent*). The same button sits at the top of the page.

Below: the free allowance used, what became of the latest codes (numbers masked), and a switch that pauses all codes.
Owners and administrators only; other teammates are told who sets it up. The rest of Developers (API tester, SDK samples, API keys,
webhooks) remains part of the Business plan and is one quiet note under Free OTP on the other plans.

## The API (a company's own server)

Base address: the app's own (`https://app.scriwo.com/api/otp`), which forwards to the server. Authenticate with a **secret key**:
`Authorization: Bearer otp_sk_live_...` (or `otp_sk_test_...`). Keys are kept as a hash; they are shown once.

| Call | Body | Answer |
|---|---|---|
| `POST /send` | `{ phone, reference?, template?, locale? }`, optional `Idempotency-Key` header | `201 { id, state: "sent", expiresIn, resendAfter, to }` (the number masked); `202` with `state: "uncertain"` when WhatsApp did not confirm (the code is still valid, and is never sent twice by Scriwo) |
| `POST /verify` | `{ id, code }` or `{ phone, code }` (the latest code for that number) | `200 { valid: true, id, phone, reference, verifiedAt, secondsToVerify }` or `200 { valid: false, id, reason, attemptsLeft? }`; a wrong, late or repeated code is an answer, not an error |
| `GET /requests/:id` | | what became of a code (never the code) |
| `POST /proof/verify` | `{ proof }` | `{ valid, id, phone, reference, mode }` once; see the widget |

`reason` is one of `wrong_code`, `expired`, `too_many_attempts`, `already_used`, `superseded`, `not_sent`. A code works once; a new
code for the same number replaces the old one; after the allowed tries the code is locked, even for the right answer.

**Test keys** (`otp_sk_test_`, `otp_pk_test_`) send nothing and always use the code `123456`, and use none of the allowance, so a
developer can build and run automated tests without a phone. A test key cannot check a live code and a live key cannot check a
test code.

### Errors

Every error is `{ status: "error", code, message, fix, retryAfter? }`: what happened, and what to do, in plain words.

| `code` | HTTP | Meaning |
|---|---|---|
| `missing_key`, `invalid_key`, `wrong_key_kind` | 401, 401, 403 | no key, an unknown or revoked key, a public key where a secret one is needed (or the reverse) |
| `invalid_phone`, `invalid_code`, `invalid_reference`, `invalid_template`, `invalid_locale`, `invalid_idempotency_key`, `invalid_request`, `missing_request` | 400 | the request cannot be used |
| `same_number` | 400 | the phone is the one the codes are sent from (a number cannot receive its own code) |
| `origin_not_allowed` | 403 | widget only: the page is not on the key's list of websites |
| `invalid_proof` | 400 | widget only: the proof is not one Scriwo made |
| `not_on_whatsapp` | 422 | the number has no WhatsApp: offer another way (this attempt does not use the allowance) |
| `resend_too_soon`, `too_many_requests`, `busy`, `rate_limited` | 429 | wait `retryAfter` seconds |
| `quota_exceeded` | 429 | the free allowance is used up until `resets` |
| `no_number_connected`, `number_offline` | 503 | link or reconnect the sending number |
| `delivery_failed` | 502 | WhatsApp refused the message; the code is void and the attempt does not use the allowance |
| `otp_paused`, `otp_suspended`, `otp_unavailable` | 403, 403, 503 | switched off by the company, by Scriwo for the company, or on the whole platform |
| `request_not_found` | 404 | no such code (or one made with the other kind of key) |

## Limits

| What | Limit |
|---|---|
| Free allowance, every plan | 100 codes a day (UTC) and 1,000 a month per company; the platform can set another figure for one company (`otp_settings.daily_limit` / `monthly_limit`) or for everyone (`OTP_DAILY_LIMIT`, `OTP_MONTHLY_LIMIT`) |
| One phone number | 3 codes in 10 minutes and 10 a day, and the company's own wait before another (default 30 s) |
| One sending number | about 20 codes a minute |
| One secret key | 120 calls a minute; before the key is looked up, 600 a minute per caller |
| A code | 4 to 8 digits, valid 1 minute to 1 hour (use case decides), 1 to 10 tries |
| Records | rows are removed after 30 days; a code's hash is dropped as soon as it is used, expired or locked |

Attempts that fail before a message is sent (not on WhatsApp, number offline) do not use the allowance. The studio's own test
counts, so the test button cannot be used to flood a number.

## Webhook events (any plan)

One address per company, set up in the Free OTP page: HTTPS on a public address. Scriwo calls it for `otp.sent`, `otp.delivered`,
`otp.verified`, `otp.failed` (too many tries, delivery failed), `otp.expired` and `otp.test`, signed like every Scriwo webhook
(`X-Scriwo-Signature`: HMAC-SHA256 of the timestamp, a dot and the raw body, with the secret shown once). The payload is
`{ id, phone, phoneMasked, reference, template, mode, source, ... }`. **The code is never in an event.** The full phone number is,
because it goes only to the company's own address and the company needs to know which of its users it is about.
An OTP address hears only `otp.*`; the Business-plan webhooks hear everything else and nothing new, and do not list OTP addresses.

## The prompt for a coding agent

Step 5 of the page builds a prompt from the page's own data (`components/developer/otp/agentPrompt.ts`, a pure function with tests). The
person pastes it into their coding agent while it is working in their project, and the agent adds the OTP step: a small server module,
the two endpoints the front end calls, the screens, tests, `.env.example` and a README note.

**What is in it:** the use case and where it belongs in a project (each of the eight differs: a sign-in creates the session only after
`valid: true`; a payment checks that the `reference` that comes back is this payment's; an account change sends the code to the current
number); the name in the message, language, digits, expiry, tries and resend wait; the free allowance and the per-phone limits; whether a
number is linked and what is still to do (with an instruction to build against a test key meanwhile); the keys on the account by name
and start only; the exact `send` and `verify` calls with their answers; what to do for every error code; how to build it; the web widget
with the websites the key works on; the webhook address, its headers and how to verify its signature; the rules (server-side check
only, no secrets in code, no codes or full numbers in logs, no retry loops, rate-limit your own endpoint); and how to test with a test
key and when it is done.

**What is never in it: a secret key.** A key pasted into a chat stays in its history, and agents write what they are given into source
files. The prompt tells the agent to read `SCRIWO_OTP_SECRET_KEY` from the environment (and `SCRIWO_OTP_WEBHOOK_SECRET`, which was also
shown once), and the card tells the person to put the key they copied in step 4 there. A widget key made during the visit may be in it,
because a public key is meant to be in a web page; a revoked one is not. A test in the suite fails if a secret key ever appears.

The prompt can be copied at any time. While the setup is incomplete the card lists what is left, and the prompt itself says so and tells
the agent to use a test key; when a number is linked, a real code has worked and a key exists, the prompt says the setup is complete. If
the browser will not let the page use the clipboard, the button says so and the prompt is opened for selecting.

## The web widget

```html
<script src="https://app.scriwo.com/otp.js"></script>
<script>
  ScriwoOTP.verify({
    key: "otp_pk_live_...",          // a public key, safe in a page
    phone: "+971501234567",          // optional: the person only types the code
    country: "AE",                   // optional: lets people type 050 123 4567
    locale: "ar",                    // optional: en, hi or ar (default: the company's, then the browser's)
    reference: "cart-77",            // optional: comes back to your server with the proof
    onVerified: function (r) { /* r.proof: send it to your server */ },
    onClose: function (r) { /* r.verified: false if the person gave up */ },
  });
</script>
```

`ScriwoOTP.verify` returns a promise too (`{ proof, id, phone }`, or `null` if closed). The widget has no dependencies, draws
itself in a shadow root (so the page cannot break it, and it cannot break the page), reads right to left in Arabic, traps focus,
closes with Escape and returns focus, follows light and dark, and is a sheet from the bottom on a phone. Its styles are
attached as a constructable stylesheet, so a page policy that forbids inline styles does not break it (tested with `style-src 'none'`).

**Public keys** work only from the websites listed on the key (the `Origin` of the request; a script can fake that, so it only
keeps honest mistakes and other people's pages out; the real limits are below). A test public key works from anywhere.
One device may ask for 12 codes an hour and one public key for 120 in all (checking codes: 120 an hour per device), on top of the
per-phone and per-company limits.
A public key cannot call the secret API.

**The proof.** When a visitor gets the code right, the page is given a proof: the request, the company and the time, signed by
Scriwo, valid for ten minutes and for one use. It tells the page nothing. The company's server sends it with its secret key to
`POST /api/otp/proof/verify` and Scriwo answers yes or no, once, so a page cannot claim a verification it did not do. A company with
no server uses the `otp.verified` webhook instead.

## What is kept out of the inbox

OTP messages leave from the company's own number, so they also exist in that phone's WhatsApp and come back to Scriwo as echoes, in
history and in the chat list. Left alone, each person who got a code would become a chat and a contact (eating the contact
allowance) and the code would be stored in the message tables. `services/otp/guard.js` recognises an OTP message by the id WhatsApp
gave it, by its exact text (the code is in it), and by a short note made just before sending, and the three places that import
messages (`handleIncomingMessage`, `handleAckEvent`, `syncConversations`) leave it out. A person who **replies** to a code appears in the
inbox as an ordinary customer. The codes do appear in that number's own WhatsApp app: that is why the page says to use a number you
do not use with customers if you can.

## Safety, in one place

- The wording is fixed. Only the company's name (letters, numbers, spaces, `& - '`; no dots, links or symbols) and the code change, so
  the free service cannot carry an offer, a link or a warning that is not ours.
- Credentials of their own (`otp_keys`), never `api_keys`: an API key counts as a manager on routes that do not check scope, and a key that
  may only send and check codes must be able to do nothing else. Every other route answers 401 to an OTP key, and the OTP API
  answers 401 to an API key.
- A code is stored only as an HMAC tied to its request (dropped once the code is used), compared in constant time. It is never in a status answer or a webhook event. Phone numbers are shown masked in the activity list.
- Scriwo can suspend OTP for one company (`otp_settings.suspended_reason`) or switch it off everywhere (`OTP_ENABLED=false`).
  Keys, settings and webhook changes are written to the company's audit log.
- **WhatsApp can restrict a number that sends many automated messages.** Pacing, the daily allowance and fixed wording lower the risk;
  they do not remove it. The page says so in plain words next to the choice of number.

## Not included

SMS or voice fallback, WordPress/WooCommerce plugins and language SDK packages, a captcha on the widget, an OTP section in the
platform admin console, custom message text, a marketing page on the website.

## Where it lives

Backend `src/services/otp/` (`templates`, `otpService`, `keys`, `guard`, `events`, `proof`, `config`), `src/routes/otpRoutes.js` (the
API), `otpWidgetRoutes.js` (the widget), `otpSetupRoutes.js` (the page), migration `050_otp.js`. App `src/components/developer/otp/`,
`public/otp.js`. Tests: backend `otp-templates`, `otp-service`, `otp-guard`, `otp-webhooks`, `otp-widget`; app `otp_studio`,
`otp_snippets`, `agent_prompt`, `predict`, `developer_lock`.
