import type { OtpKey, OtpOverview, OtpTemplate } from "../../../services/api";

// The prompt a person pastes into their coding agent (Claude Code, Cursor, Copilot, Codex, Windsurf ...) so that the agent sets up
// Scriwo Free OTP in their project. It carries every choice made on the page, the exact API, and the rules a careful engineer would
// follow. It never carries a secret key: a key pasted into a chat ends up in its history, and agents love to write what they are given
// into source files. The agent is told to read the key from an environment variable, and the page says where the person puts it.

export const SECRET_ENV = "SCRIWO_OTP_SECRET_KEY";
export const PUBLIC_ENV = "SCRIWO_OTP_PUBLIC_KEY";
export const WEBHOOK_ENV = "SCRIWO_OTP_WEBHOOK_SECRET";
export const BASE_ENV = "SCRIWO_OTP_BASE_URL";

export interface AgentPromptInput {
  overview: Pick<OtpOverview, "settings" | "templates" | "locales" | "keys" | "usage" | "limits" | "webhook" | "ready">;
  /** where the API is: the app's own address on a hosted app, the backend's on a developer machine */
  base: string;
  /** where the widget script is served from */
  appBase: string;
  /** a widget key made during this visit. A public key is meant to be in a web page, so it may be in the prompt. Never a secret one. */
  publicKey?: string;
}

/** 300 -> "5 minutes", 3600 -> "1 hour", 90 -> "90 seconds" */
export function durationText(seconds: number): string {
  const unit = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
  if (seconds > 0 && seconds % 3600 === 0) return unit(seconds / 3600, "hour");
  if (seconds > 0 && seconds % 60 === 0) return unit(seconds / 60, "minute");
  return unit(seconds, "second");
}

// where in a project each use case belongs, and what a correct version of it looks like
const PLACE: Record<string, { where: string; reference: string }> = {
  login: {
    where: "the sign-in flow: phone number, then code, then signed in. Find the account that owns the verified phone number and only then create the session. A session is never created before /verify says valid.",
    reference: "the user's id, if it is known at that point (it comes back with the check)",
  },
  signup: {
    where: "the sign-up flow: verify the phone number before the account is created or activated. Record the number as verified on your server only after /verify says valid.",
    reference: "the id of the sign-up or pending account",
  },
  reset: {
    where: "the password-reset flow: a valid code proves the person controls the phone, for this one reset only. Then let them choose a new password, and tie that step to the same session so the proof cannot be used elsewhere.",
    reference: "the id of the reset request",
  },
  payment: {
    where: "the step just before a payment or transfer is completed. Complete it only after /verify says valid for this very payment, and check that the reference that comes back is this payment's.",
    reference: "the payment or order id (required here: it ties the code to the payment)",
  },
  delivery: {
    where: "the handover of an order. The customer receives the code and gives it to the courier, who types it into your system, which checks it with /verify before marking the order delivered.",
    reference: "the order or delivery id (required here)",
  },
  booking: {
    where: "the confirmation of a booking (table, appointment, ticket). Send the code when it is requested and confirm the booking only after /verify says valid.",
    reference: "the booking id",
  },
  change: {
    where: "a sensitive change to an account (a new phone number, email or address). Send the code to the CURRENT phone number on file, and apply the change only after /verify says valid.",
    reference: "the id of the pending change",
  },
  verify: {
    where: "wherever the project collects a phone number and wants to know it is the person's own. Mark it verified on your server only after /verify says valid.",
    reference: "the id of whatever the number belongs to",
  },
};

const describeKey = (k: OtpKey) => `${k.name} (${k.kind}, ${k.mode}, starts ${k.prefix}…${k.allowedOrigins.length ? `, allowed on ${k.allowedOrigins.join(" ")}` : ""})`;

/** What is still missing on the Scriwo side, in the owner's words. Empty when everything is ready. */
export function whatIsMissing(ready: AgentPromptInput["overview"]["ready"]): string[] {
  const missing: string[] = [];
  if (!ready.number) missing.push("link a WhatsApp number to send the codes from");
  if (!ready.tested) missing.push("try one real code from the page");
  if (!ready.key) missing.push("create a key");
  return missing;
}

export function buildAgentPrompt({ overview, base, appBase, publicKey }: AgentPromptInput): string {
  const { settings, templates, locales, usage, limits, webhook, ready } = overview;
  const template: OtpTemplate | undefined = templates.find((t) => t.key === settings.template);
  const title = template?.title ?? settings.template;
  const place = PLACE[settings.template] ?? PLACE.verify;
  const language = locales.find((l) => l.key === settings.locale);
  const api = `${base.replace(/\/$/, "")}/api/otp`;
  const live = overview.keys.filter((k) => !k.revokedAt);
  const secretKeys = live.filter((k) => k.kind === "secret");
  const publicKeys = live.filter((k) => k.kind === "public");
  // a widget key made in this visit is only used while it is still one of the live keys
  const pageKey = publicKey && publicKeys.some((k) => publicKey.startsWith(k.prefix)) ? publicKey : "";
  const missing = whatIsMissing(ready);
  const complete = missing.length === 0;
  const widgetOrigins = [...new Set(publicKeys.flatMap((k) => k.allowedOrigins))];
  const perDay = usage.today.limit;
  const month = usage.month.limit.toLocaleString("en-US");

  const out: string[] = [];
  const add = (...lines: string[]) => out.push(...lines);

  add(
    `# Add WhatsApp one-time codes to this project with Scriwo Free OTP`,
    ``,
    `You are a coding agent working in the user's project. Set up **${title}** verification by one-time code on WhatsApp: the app asks for a phone number, Scriwo sends a code from the company's own WhatsApp number, the person types it, and the app asks Scriwo whether it is right. Scriwo makes the code, keeps it hashed, expires it, counts the tries and limits the resends. **You write none of that.** Everything you need is in this prompt; do the work in the project instead of asking about what is already here.`,
    ``,
    `## 1. What to build`,
    ``,
    `Use case: **${title}**${template?.blurb ? `: ${template.blurb}` : ""}`,
    `It belongs in ${place.where}`,
    ``,
    `1. Look at the project first: its language, framework, how it makes HTTP calls, how the flow above works today. Match its style and structure. Add no new dependency unless there is no other way.`,
    `2. Add a small server-side module that talks to Scriwo (two calls, below), and the two server endpoints or actions the front end needs: "send me a code" and "check this code".`,
    `3. Add the screens: a phone field, then a code field with a resend button that counts down.`,
    `4. Write the tests (section 10), add the environment variables to \`.env.example\`, and add a short note to the README on how to go from test keys to live ones.`,
    ``,
    `## 2. Scriwo setup the owner has chosen (fixed on Scriwo's side, do not hard-code it)`,
    ``,
    `- Name shown in the message: **${settings.brandResolved || settings.brand}**`,
    `- Language of the message: **${language ? `${language.name} (${language.key})` : settings.locale}**. The other languages are \`en\`, \`hi\` and \`ar\`; pass \`"locale"\` to \`/send\` to use one for a single code.`,
    `- The code: **${settings.codeLength} digits**, valid for **${durationText(settings.ttlSeconds)}**, **${settings.maxAttempts} tries**, and at least **${durationText(settings.resendSeconds)}** between two codes to the same number. Size the code field for ${settings.codeLength} digits and make the resend button wait for \`resendAfter\`.`,
    `- Sent from: the company's own WhatsApp number (${ready.number ? "linked" : "not linked yet"}). It is not the official WhatsApp Business API: Scriwo links the number the way WhatsApp Web does.`,
    `- Free allowance for the whole company: **${perDay} codes a day** and **${month} a month**. One phone number can be sent **${limits.perPhoneWindow} codes every ${limits.perPhoneWindowMinutes} minutes** and ${limits.perPhoneDay} a day.`,
    `- Codes are currently **${settings.enabled ? "switched on" : "paused"}** in Scriwo${settings.enabled ? "" : " (the owner can switch them on under Developers, Free OTP)"}.`,
    ``,
    `## 3. Status of the Scriwo setup`,
    ``,
  );
  if (complete) add(`Complete. A number is linked, a real test code has worked, and a key exists. The project only needs the key in its environment.`);
  else
    add(
      `Not complete yet. Still to do on the Scriwo page (Developers, Free OTP) by the owner: ${missing.join("; ")}.`,
      `Meanwhile build and test with a TEST key (section 4): it needs no linked number. Tell the user clearly, when you finish, what is left for them to do.`,
    );
  add(
    ``,
    `## 4. Keys and addresses`,
    ``,
    `- API address: \`${api}\` (put it in \`${BASE_ENV}\`, with this value as the default).`,
    `- **Secret key: read it from the environment variable \`${SECRET_ENV}\`, on the server only.** It is not in this prompt on purpose. Never write it into source code, a front-end bundle, a mobile app, a log, an error message, a test fixture or git. Add \`${SECRET_ENV}=\` (empty) to \`.env.example\`, and tell the user to put their real key in their environment or secret store. They copied it when they created it (Scriwo, Developers, Free OTP, Connect your site, "Create my key"); they can make another there.`,
    `- Keys on the account now: ${secretKeys.length || publicKeys.length ? live.map(describeKey).join("; ") : "none yet. The user creates one on the same page."}`,
    `- **Test keys** start with \`otp_sk_test_\`. They send nothing, always accept the code \`123456\` and use none of the allowance; their send answer also carries \`"test": true\` and the code itself, for your tests only. Use one in development and in automated tests. **Live keys** start with \`otp_sk_live_\`: production only.`,
    ``,
    `## 5. The API: two calls`,
    ``,
    `Every request sends \`Authorization: Bearer $${SECRET_ENV}\` and \`Content-Type: application/json\`. Answers are JSON with \`"status": "success"\` or \`"status": "error"\`.`,
    ``,
    `### POST ${api}/send`,
    ``,
    `Body: \`{"phone": "+971501234567", "reference": "<optional>", "locale": "<optional: en | hi | ar>"}\``,
    `- \`phone\`: a full international number with its country code. Normalise whatever the person typed to that form before calling.`,
    `- \`reference\`: up to 80 characters of your own, returned when the code is checked and in webhooks. Use ${place.reference}.`,
    `- Optional header \`Idempotency-Key: <a new UUID for this user action>\`. If your call fails on the network and you retry with the same key, the same code is returned instead of a second message.`,
    `- Answer (201): \`{"status":"success","id":"otp_...","state":"sent","mode":"live","channel":"whatsapp","to":"+971•••••4567","expiresIn":${settings.ttlSeconds},"resendAfter":${settings.resendSeconds}}\`. Keep \`id\`: it is needed to check the code.`,
    `- Answer (202) with \`"state": "uncertain"\`: WhatsApp did not confirm the message. It may still arrive. Let the person type the code, and do not send another until \`resendAfter\` has passed.`,
    ``,
    `### POST ${api}/verify`,
    ``,
    `Body: \`{"id": "otp_...", "code": "${"482913".slice(0, settings.codeLength).padEnd(settings.codeLength, "0")}"}\`. (Or \`{"phone": "+971...", "code": "..."}\` to check the latest code sent to that number.)`,
    `- Right: \`{"status":"success","valid":true,"id":"otp_...","phone":"+971501234567","reference":"...","verifiedAt":"...","secondsToVerify":12}\``,
    `- Wrong: HTTP 200, \`{"status":"success","valid":false,"id":"otp_...","reason":"wrong_code","attemptsLeft":${Math.max(settings.maxAttempts - 1, 0)}}\`. A wrong, late or repeated code is an answer, not an HTTP error.`,
    `- \`reason\` is one of \`wrong_code\`, \`expired\`, \`too_many_attempts\`, \`already_used\`, \`superseded\`, \`not_sent\`.`,
    `- A code works **once**. A newer code for the same number replaces the older one. After ${settings.maxAttempts} wrong tries the code is locked, even for the right answer.`,
    ``,
    `### What each problem means for your app`,
    ``,
    `Every error has \`code\`, \`message\`, \`fix\` and sometimes \`retryAfter\` (seconds). Log \`code\` and \`message\`; never show the person anything about keys or Scriwo's setup.`,
    ``,
    `| code | HTTP | What your app does |`,
    `|---|---|---|`,
    `| \`invalid_phone\` | 400 | Ask for the number again, with its country code. |`,
    `| \`not_on_whatsapp\` | 422 | This person has no WhatsApp. Offer the project's other way to sign in or confirm. There is no SMS fallback. |`,
    `| \`resend_too_soon\`, \`too_many_requests\`, \`busy\`, \`rate_limited\` | 429 | Wait \`retryAfter\` seconds and show a countdown. Do not retry in a loop. |`,
    `| \`quota_exceeded\` | 429 | The free allowance is used up until \`resets\`. Tell the person to try later, and log it at error level so the owner sees it. |`,
    `| \`no_number_connected\`, \`number_offline\`, \`otp_paused\`, \`otp_suspended\`, \`otp_unavailable\`, \`delivery_failed\` | 503, 403, 502 | A problem on the sending side. Show "we cannot send a code right now, try again shortly" and log it at error level so the owner sees it. |`,
    `| \`missing_key\`, \`invalid_key\`, \`wrong_key_kind\` | 401, 403 | A configuration mistake. Log it loudly; show a generic error. |`,
    `| verify \`valid:false\` with \`wrong_code\` | 200 | "That is not the code", with \`attemptsLeft\` tries left. |`,
    `| verify \`valid:false\` with \`expired\`, \`too_many_attempts\`, \`superseded\`, \`not_sent\` | 200 | Offer "send a new code". |`,
    `| verify \`valid:false\` with \`already_used\` | 200 | Treat as not verified. Never sign in twice with one code. |`,
    ``,
    `## 6. How to build it`,
    ``,
    `- **Server module.** \`sendCode(phone, reference)\` and \`checkCode(id, code)\` that call the two endpoints with the project's HTTP client, read \`${SECRET_ENV}\` and \`${BASE_ENV}\` from the environment, send \`Idempotency-Key\`, set a timeout of about 10 seconds, and return a small result your handlers can branch on (\`sent\`, \`uncertain\`, \`wait(n)\`, \`no_whatsapp\`, \`failed\`; \`valid\`, \`wrong(attemptsLeft)\`, \`new_code_needed\`).`,
    `- **Two endpoints or actions** in the app, for the browser to call. The browser never talks to Scriwo with the secret key. Keep the code's \`id\` on the server, tied to the user's session or pending record, rather than trusting one the browser sends back.`,
    `- **After \`valid: true\`**: do, on the server, whatever the verification was for (create the session, mark the number verified, confirm the payment, and so on). That check is the only proof. A flag set by the browser is not.`,
    `- **The screens.** Phone field (country code visible or defaulted). Code field: \`inputmode="numeric"\`, \`autocomplete="one-time-code"\`, ${settings.codeLength} digits, submit by itself on the last digit if the project's style allows. A "Send again" button that counts down from \`resendAfter\` and uses \`retryAfter\` from errors. Clear messages for each row of the table above. Make it work with the keyboard and a screen reader.`,
    `- **Your own limits.** Anyone can type any phone number, so an open "send a code" endpoint lets strangers make the company's WhatsApp number message people. Rate-limit it per IP and per session, and use the project's CAPTCHA or CSRF protection if it has one. Scriwo limits per phone number and per company too, but your endpoint is the first line.`,
    ``,
  );

  // the widget
  add(
    `## 7. Optional: the ready-made web widget (a website with no screens to build)`,
    ``,
    `If this is a website, you may use Scriwo's widget for the phone and code screens, and write only the server's check:`,
    ``,
    "```html",
    `<script src="${appBase.replace(/\/$/, "")}/otp.js"></script>`,
    `<script>`,
    `  ScriwoOTP.verify({`,
    `    key: "${pageKey || `<your widget key, from ${PUBLIC_ENV}>`}",${appBase !== base ? `\n    api: "${base}",` : ""}`,
    `    // phone: "+971501234567",  // if the page already knows the number, the person only types the code`,
    `    // country: "AE",           // lets people type a local number such as 050 123 4567`,
    `    locale: "${settings.locale}",`,
    `    // reference: "...",         // up to 80 characters, comes back with the check`,
    `    onVerified: function (r) { /* send r.proof to YOUR server */ },`,
    `    onClose: function (r) { /* r.verified is false if the person gave up */ },`,
    `  });`,
    `</script>`,
    "```",
    ``,
    `- The widget key (\`otp_pk_...\`) is public and safe in a page. It works only on the websites listed on it: ${widgetOrigins.length ? widgetOrigins.map((o) => `\`${o}\``).join(", ") : "none yet. The owner creates one under Developers, Free OTP, Connect your site, Web widget, naming the website's address. A test widget key (`otp_pk_test_`) works from anywhere and sends nothing."}.`,
    `- The widget hands the page a **proof** (\`r.proof\`), which says nothing by itself. Send it to your server, and have the server confirm it: \`POST ${api}/proof/verify\` with the secret key and \`{"proof": "otp_proof_..."}\`. The answer is \`{"valid": true, "phone": "...", "reference": "..."}\`. A proof works once, within 10 minutes. Only then sign the person in. Never take the browser's word for it.`,
    ``,
  );

  // the webhook
  if (webhook)
    add(
      `## 8. Webhook (the owner already set an address)`,
      ``,
      `Scriwo calls \`${webhook.url}\` for \`otp.sent\`, \`otp.delivered\`, \`otp.verified\`, \`otp.failed\`, \`otp.expired\` and \`otp.test\`. If the project needs them, implement that endpoint; if not, leave it.`,
      `- The body is JSON: \`{"id": "...", "event": "otp.verified", "payload": {"id": "otp_...", "phone": "+971...", "phoneMasked": "...", "reference": "...", "template": "${settings.template}", "mode": "live", "source": "api"}}\`. The code is never in an event.`,
      `- Verify every call: the headers \`X-Scriwo-Timestamp\` (Unix seconds) and \`X-Scriwo-Signature\` (hex). The signature is the HMAC-SHA256, with the webhook secret from \`${WEBHOOK_ENV}\`, of \`<timestamp>.<raw request body>\`. Compare in constant time, reject a timestamp more than 5 minutes old, and answer 2xx quickly. The secret was shown once when the owner set the address; it is not in this prompt.`,
      ``,
    );
  else
    add(`## 8. Webhook`, ``, `None is set and none is needed. (The owner can add one under Developers, Free OTP: Scriwo then tells your server when a code is sent, delivered, verified, failed or expired.)`, ``);

  add(
    `## 9. Rules you must not break`,
    ``,
    `1. The code is checked on the server, with the secret key, and only a \`valid: true\` answer counts.`,
    `2. The secret key lives only in the server's environment: not in front-end code, a mobile app, git, logs, tests or this chat.`,
    `3. Never log a code, a key, or a full phone number (mask all but the last 4 digits).`,
    `4. Do not show or return the code anywhere. \`123456\` is a test-mode value for tests only.`,
    `5. Do not hide an unreliable send behind a retry loop. Obey \`retryAfter\`, and never send two codes for one user action.`,
    `6. Do not reveal whether an account exists if the project does not already.`,
    `7. Do not change Scriwo's settings from code. Digits, expiry, tries, language and the name in the message are chosen on the Scriwo page.`,
    ``,
    `## 10. Tests and "done"`,
    ``,
    `- Unit tests with the two HTTP calls mocked: sent, uncertain, each error row above, valid, wrong with \`attemptsLeft\`, expired, already used.`,
    `- One end-to-end test (or script) against the real API with a **test key**: send, check \`123456\` (valid), check \`000000\` on a new code (wrong, with tries left), check \`123456\` twice (the second is \`already_used\`). It sends no WhatsApp message and costs no allowance.`,
    `- A quick check from a terminal, with a test key (sends nothing): \`curl -X POST ${api}/send -H "Authorization: Bearer $${SECRET_ENV}" -H "Content-Type: application/json" -d '{"phone":"+971501234567"}'\``,
    `- Done means: the flow works end to end with a test key; the secret key is read only from the environment; no secret in the repository; the tests pass; \`.env.example\` and the README are updated.`,
    ``,
    `When you finish, tell the user in plain words: what you changed and where; the environment variables to set (\`${SECRET_ENV}\`${pageKey || publicKeys.length ? `, \`${PUBLIC_ENV}\`` : ""}${webhook ? `, \`${WEBHOOK_ENV}\`` : ""}); how to switch from the test key to the live key; and ${complete ? "that nothing is left to do on the Scriwo side" : `what is still to do on the Scriwo side (${missing.join("; ")})`}.`,
  );
  return out.join("\n");
}

