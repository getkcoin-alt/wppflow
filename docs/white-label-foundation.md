# White-label and reseller layer: staged design

**Status: design only. Nothing in this document is built.** There is no partner table, no partner role, no branding, no
custom domain and no reseller billing in the code today. This file exists so the next stage can start from the real
codebase instead of from a guess, and so nobody sells a feature that is not there.

Written 27 October 2026 against `wppflow` (app, website) and `wppflow-backend` (API), branch
`scrappy/vigilant-pasteur-ap8elj`. Read it with `docs/scriwo-platform-audit.md` (what exists) and
`docs/industry-solutions-progress.md` (what was built for industry solutions, which is the layer this one sits above).

## 1. Words used here

| Word | Meaning |
|---|---|
| **Platform** | Scriwo itself. Platform staff are `users.is_superadmin`. |
| **Company** (tenant) | One customer workspace: a brokerage, a clinic, a shop. A row in `tenants`. It owns its chats, leads, listings. |
| **Partner** (reseller) | A business that sells Scriwo to companies under its own name. **Not a company.** It has no inbox, no leads and no WhatsApp numbers of its own. |
| **Solution** | An industry layer switched on per company (`tenant_solutions`). Real estate exists. |

The important decision: **a partner is a different kind of thing from a company, not a company with extra powers.** If a
partner were a tenant, every query that is scoped by `tenant_id` today would quietly become a way for a partner to read
its customers' conversations. Keeping them apart means a partner can be given *management* of companies without being given
their *data*.

## 2. What already exists that this builds on (verified)

- `tenants` rows with a plan, a status, a numbers limit, a currency; `memberships` with roles `owner / admin / agent`.
- `users.is_superadmin` and a platform console: companies, plans, subscriptions, books, support access.
- `tenant_solutions`: a per-company switch with a version, an audit entry and a notice to the company's managers when it
  changes. This is the right place for "what a partner may switch on".
- `audit_events`, `notifications`, per-company plan features and limits, scoped API keys.
- One fixed `APP_URL` and one CORS list in the API (`config/env.js`); links in emails are built from it
  (`services/passwordReset.js`, `mailer.js`). **This is the part that has to change for custom domains.**

## 3. What is missing (verified absent)

No partner or parent concept anywhere; no `tenants.partner_id`; no branding fields; no domain table; no way to build an
email link for any host other than `APP_URL`; no wholesale price or partner invoice; no partner-scoped role in
`middleware/auth.js`.

## 4. The stages

Each stage is shippable alone, adds tables and columns only (no rewrites of existing data), and is useless-but-harmless if
the next stage never happens. Do them in order.

### Stage 0: today (no code)

A partner asks Scriwo staff to create a company, pick a plan and switch a solution on. Staff do it in the platform
console. This works now and is the honest answer for the first partners. **Recommended until at least three partners
exist.**

### Stage 1: partners own companies

- Table `partners(id, name, status, contact_email, created_at)`; nullable `tenants.partner_id`.
- A partner staff login is a user with a row in `partner_members(partner_id, user_id, role)`. It is **not** a `memberships`
  row, so the existing tenant checks (`requireTenantContext`) still refuse it everywhere. A new `requirePartnerContext`
  resolves the partner from the signed token plus an active `partner_members` row, the same way tenant context works now.
- A partner console, **management only**: list its companies; create a company (inside a ceiling, below); suspend or
  restore one; see **counts** (numbers linked, leads, messages this month) and subscription state. A partner **never**
  receives conversation, contact, lead or listing content. Usage is counted by the platform and shown as numbers.
- Ceilings: `partner_entitlements(partner_id, solution_key, max_companies?)` and a plan allow-list. A partner can switch
  on only what the platform has allowed it, and only inside its own companies. `setSolution` already audits and notifies; it
  gains the acting partner in the audit record.
- Every partner action is written to `audit_events` with `partner_id`, and visible to the platform.

### Stage 2: branding

- Fields on `partners`: display name, logo (an uploaded, size-limited, type-checked image), two colour tokens, support
  email, mail "from" name. **Tokens only, never free CSS or HTML**, so a partner cannot inject script into a page that
  other people sign in on.
- The app reads branding from a public `GET /api/branding?host=` that returns only those fields. The sign-in page, the
  header and the emails use it. A company without a partner sees Scriwo.
- Email templates take the partner's name and support address. The "from" address stays on a platform-verified domain
  until the partner's own domain is verified for sending (separate step, below).

### Stage 3: custom domains

This is the stage with real risk. Requirements before building:

1. A `partner_domains(partner_id, host, verified_at, tls_status)` table and a **DNS ownership check** (a TXT record the
   partner must publish) before a host is accepted. No unverified host is ever served.
2. A TLS provider that issues certificates for customer hostnames (for example Vercel domains, or Cloudflare for SaaS).
   This is an infrastructure and cost decision, not a code one, and it needs credentials the platform owner holds.
3. The API must stop treating one `APP_URL` as the world: build email links from the **verified host of the partner**, never
   from the request's `Host` or `Origin` header (host-header poisoning in a password-reset mail is the classic failure).
4. CORS becomes a lookup against verified hosts instead of a fixed list; the refresh cookie is scoped per host; a sign-in on
   one partner domain must not be accepted on another.
5. Sending mail from a partner's domain needs SPF, DKIM and a verified Resend domain per partner.

### Stage 4: money

Wholesale price per plan, partner invoices, who is the merchant of record, GST treatment of a reseller margin and of a
partner invoicing its own customers. **None of this should be designed without the accountant** who has not yet signed off
the existing invoice fields (open item in `docs/website-claims-audit.md`). Razorpay is live; nothing here may touch the live
account without explicit approval.

### Stage 5: provisioning API and support access

A partner-scoped API key to create companies from the partner's own system (same ceilings, rate-limited, audited). Partner
support staff reading a company's data must be an explicit, time-limited grant by that company's owner, logged, and
revocable; the platform console's existing support access should be reviewed for how it records consent before it is
copied to partners.

## 5. Isolation rules (apply at every stage)

1. A partner token can never be used on a tenant route, and a tenant token can never be used on a partner route.
2. A partner sees only companies with its own `partner_id`. A guessed id from another partner returns not found, not forbidden.
3. A partner never receives message, contact, lead, listing or viewing content, in any response, export or notification.
4. A company cannot change its own `partner_id`, plan ceiling or solution switch past what the partner allowed.
5. Suspending a partner suspends the management of its companies, not their inboxes; customers keep working while the
   platform decides what to do. (Decision for the owner: see below.)
6. Platform staff can see and act on everything and every such action is audited.

## 6. Tests that must exist before each stage ships

| Stage | Tests |
|---|---|
| 1 | partner A cannot list, read, suspend or create inside partner B's companies; tenant token refused on partner routes and the reverse; no content fields in any partner response (checked by walking the JSON); ceilings refuse a solution the platform did not allow; audit rows carry the partner |
| 2 | branding returns only the allowed fields; a script or style payload in a field is rejected or escaped; an oversized or non-image logo is refused; a company with no partner gets Scriwo |
| 3 | an unverified host serves nothing; a reset mail's link uses the partner's verified host even when the request claims another `Host`/`Origin`; cookie from host A is refused on host B |
| 4 | invoices carry the right party; rounding and GST match the accountant's worked examples |
| 5 | a partner key cannot exceed its ceilings; a support grant expires and is audited |

## 7. Decisions needed from the owner

1. Who is the merchant of record when a partner's customer pays: Scriwo, or the partner?
2. If a partner stops paying, are its companies suspended, moved to the platform, or left running?
3. Does a partner see company names and owner emails, or only counts? (Recommended: names and owner email, no content.)
4. Is a company allowed to belong to more than one partner? (Recommended: no, one at a time.)
5. Which TLS route is acceptable (cost, vendor), and who holds the credentials?

## 8. What this layer does not need

No separate deployment per partner, no copy of the app per partner, and no change to how industry solutions work: a solution
is still a per-company switch, and a partner is just one more party allowed to flip it inside limits.
