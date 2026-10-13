# WppFlow

WhatsApp-style team inbox backed by [wppflow-backend](https://github.com/getkcoin-alt/wppflow-backend). React, TypeScript, Vite, TanStack Query/Virtual and Socket.IO.

## Local development

Use Node 22+. Start the compatible backend and configure the public local URLs from .env.example; no secret belongs in a VITE\_ value.

```sh
npm ci
npm run dev
```

Local API/socket defaults point to localhost:8080. On Vercel, /api and /health use the existing backend rewrite; Socket.IO uses the dedicated backend URL.

```sh
npm test
npm run lint
npm run build
```

## Real-data interface

Login/workspace membership, sessions, contacts, CSV import/export, conversation history, private notes, assignment/resolve, canned replies, campaigns, keyword rules, team invitations, audit, measured summaries, API keys/test requests and webhook configuration use saved backend data. Loading, empty, unavailable and error states are visible. Access tokens stay in memory; refresh credentials are HttpOnly cookies.

The old production mock dataset and simulated API/webhook screens were removed. Store orders/LTV and unsupported telemetry remain explicitly unavailable. This is not a complete pixel-exact WhatsApp clone, and unsupported provider actions are not claimed to work.

## Production release hold

Main pushes normally publish through Vercel. scripts/release-check.mjs now skips production publication while the canonical backend is unavailable, old, or not reporting a healthy apiContract: 3. It intentionally returns exit code 0 to hold publication and 1 to continue, following Vercel's ignored-build convention. The unit tests cover both directions. Missing environment context fails closed. Previews are allowed.

The old live interface is intentionally retained until the backend's backed-up migration and device smoke tests are approved. Once the compatible backend is verified, retry the held deployment. See the backend release checklist for the complete sequence.
