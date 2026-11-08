# First-enquiry onboarding

The first goal is a useful conversation, rather than switching on features.

- The welcome overlay offers Connect my WhatsApp number immediately for an owner with no connected number. Connected owners and staff get Open my inbox. The tour and Skip remain available; closing the guide never marks a reply complete.
- Today puts first-enquiry setup above the work list until a human reply has a delivery receipt. It explains how to send an enquiry from another number, reply in the inbox, and what makes the step complete. No message is sent by onboarding itself.
- The team step counts accepted active memberships, not invitations. Single-seat plans do not require a second seat.
- Trial limits are intentionally three numbers, while paid Growth allows ten. This change does not alter plans, prices, trial duration or quotas.

## Backend contract and measurement

GET /api/home adds a manager-only activation object:

    { hasDeliveredReply, firstReplyAt, setup: { steps, done, total } | null }

Steps are connect, reply, and (where the current effective plan permits multiple people) team. The old setup field and its original keys remain for older clients. New clients prefer activation.setup; an explicit null means completed, not a reason to show the old checklist. Frontend and backend may be released independently.

A qualifying reply is an app-created outgoing message attributable to a human, in a one-to-one conversation with an earlier customer message, and with status delivered or read. Notes, imported outgoing history, groups, broadcasts/newsletters, queued sends, failures and bot sends do not count. Every lookup is tenant-scoped. Staff receive neither the company setup nor activation snapshot.

firstReplyAt is the creation time of the earliest currently qualifying reply, **not its delivery time**. This is a snapshot derived from existing records, not an immutable event log: deleting source records can change it. It can establish first-value progress but does not measure acquisition attribution, historical conversion, time-to-delivery, weekly retention or teammate participation. Those need a separate event/cohort project. No customer messages, names or phone numbers are sent to external analytics.

## Verification

Backend: tests/activation.test.js checks exclusions, receipt transitions, solo plans, tenant isolation and staff access. Existing tests/home.test.js keeps the legacy setup contract covered.
Frontend: today.test.tsx checks the first-enquiry action and explicit completion; welcome_verify.test.tsx checks immediate start and staff routing. Run npm test, npm run lint and npm run build. Backend npm test requires a disposable local PostgreSQL server; GitHub CI supplies one.

No browser or live customer messages are used for this change. Touch/visual QA remains outstanding.
