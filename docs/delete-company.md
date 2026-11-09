# Deleting a company (platform console)

Platform console, Companies: every company has **Delete…**. It shows what the company has, asks for its name to be typed, and then
removes the company and everything of it for good. Below the list, **Deleted companies** shows what has been deleted, by whom and when.
It exists mainly to clear out test companies; it works on any company that is allowed to be deleted (see "When it is refused").

## What happens, in this order

1. **A look, which changes nothing.** `GET /api/admin/companies/:id/deletion` counts what the company has (people, numbers, contacts,
   conversations, messages, files, broadcasts, automations, leads) and says whether it may be deleted. The screen asks again every time
   it is opened, because what a company has changes (a payment can be recorded).
2. **The name is typed.** The button stays off until the company's name is typed in full (capitals and spaces do not matter). The server
   checks it again; a wrong name does nothing, not even suspend the company.
3. **It is suspended** and its live connections end, so nobody works in it meanwhile.
4. **Its WhatsApp numbers** are unlinked from the phones, stopped, and their saved logins deleted. A number that cannot be unlinked (the
   phone is off, or it runs on another worker) is named in the answer: its records still go, and the phone keeps listing it under
   Linked devices until someone removes it there.
5. **Its stored files** (photos, videos, voice notes, documents, and their previews) are removed from the storage bucket. Only the
   company's own folder (`<company id>/`) is touched. If this fails, nothing else has been deleted yet: the company is left suspended and
   the same button can be pressed again.
6. **In one step:** the eight tables that refer to a company without cascading are cleared (`webhook_deliveries`, `webhook_endpoints`,
   `automation_executions`, `api_keys`, `canned_replies`, `early_receipts`, `invitations`, `refresh_tokens`); a record of the deletion is
   written; the company's row is deleted, which removes the other fifty-eight tables that have a company column (contacts,
   conversations, messages, attachments, broadcasts, automations, leads, pipelines, labels, notes, AI usage, knowledge, real-estate
   data, Free OTP settings, keys and requests, audit events, and so on); and the people who belonged to no other company are deleted
   with their sign-ins, Google links and mail links. Someone who is also in another company stays, in that company.

The platform administrator is never deleted.

## When it is refused

- **The company that runs the platform** (`tenant_scriza`), and any company the platform administrator is a member of.
- **A company with billing records on record**: payments recorded by hand, online payments, invoices, refunds or auto-payment
  arrangements. Those records have to be kept (GST invoices among them), so such a company can be **suspended** but not deleted. The screen
  says what it has.

The refusal is made before anything is touched, and again inside the final step in case a payment was recorded meanwhile.

## What is kept

One row in `deleted_companies` per deletion: the company's id, name, plan, owner's name and address, when it was created, the numbers
above (how many people, numbers, contacts, messages, files ...), who deleted it and when. Never a message, a contact or a file. The
platform's own audit log (Scriza's) also gets a `company.deleted` line.

## The API (platform administrator only)

| Call | Answer |
|---|---|
| `GET /api/admin/companies/:id/deletion` | `{ company, counts, blockers: [], canDelete }`; 404 if there is no such company |
| `POST /api/admin/companies/:id/delete` with `{ "confirmName": "..." }` | `{ deleted, removed, peopleRemoved, numbersNotUnlinked }`; 400 for a wrong name, 409 when refused, 502 if the files could not be removed (nothing else was deleted) |
| `GET /api/admin/deleted-companies` | `{ companies: [...] }`, newest first |

It is a POST with a body rather than a DELETE, which some proxies strip.

## Things to know

- A **database backup** taken before the deletion still holds the data until it expires. Deleting a company does not rewrite backups.
- Jobs already waiting in the message queue for a deleted company find nothing and fail harmlessly.
- The storage deletion lists and deletes the company's folder with the same calls the rest of the app uses on the bucket. Real storage was
  not exercised in the tests (a stand-in that pages and records what it was asked was); the first deletion of a company with files in
  production is the first time it meets the real bucket.

## Where it lives

Backend `src/services/companyDeletion.js`, `deleteTenantMedia` in `src/services/mediaService.js`, the routes in `src/routes/adminRoutes.js`,
migration `051_deleted_companies.js`. App `src/components/platform/DeleteCompanySheet.tsx`, `DeletedCompanies.tsx`, the button in
`PlatformAdmin.tsx`. Tests: backend `company-deletion` (every table with a company column is empty afterwards; the other company keeps
every row; the refusals; a storage failure), app `delete_company`.
