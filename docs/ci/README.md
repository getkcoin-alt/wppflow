# CI/CD pipeline

```
 pull request ──▶ GitHub Actions "CI" (lint, types, tests, build) ──▶ review ──▶ merge to main
                                                                                    │
 Vercel preview deployment for every branch/PR                                      ▼
                                                    Vercel production deploy ──▶ scripts/release-check.mjs
                                                                                    │
                                                                       backend healthy & apiContract matches?
                                                                          yes ▼                 no ▶ build held
                                                            https://wppflow-beige.vercel.app
```

## Continuous integration (`.github/workflows/ci.yml`)

Runs on every pull request and every push to `main`: `npm run lint`, TypeScript type-check, `npm test` (Vitest) and
`npm run build`.

**Make it a gate (one-time, GitHub settings):** Settings → Branches → add a rule for `main` that requires a pull request
and the status check **Frontend checks**. Vercel deploys production when `main` moves, so this keeps broken code out.

## Continuous deployment (Vercel Git integration)

- Every branch and pull request gets a preview URL; `main` is published to production automatically.
- `vercel.json` runs `scripts/release-check.mjs` as the ignore step: production is held while the backend at
  `https://srv1628639.hstgr.cloud/health` is unreachable or reports a different `apiContract`.
- `/api/*` and `/health` are proxied to the backend; no secrets belong in `VITE_*` variables.
- Roll back from the Vercel dashboard (Deployments → Promote a previous deployment).

## Changes that touch both repositories

Merge the backend first and wait until its deploy log shows `Deployed` (see the backend `docs/ci/README.md`), then merge
this repository.
