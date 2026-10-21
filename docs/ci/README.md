# Frontend CI/CD Automated Deployment Pipeline

WppFlow Frontend uses an automated CI/CD pipeline that automatically builds and deploys to the live server on Vercel whenever code is pushed to `main`.

## Pipeline Architecture

```
Git Push to main ──▶ Vercel Git Hook ──▶ scripts/release-check.mjs ──▶ TypeScript & Vite Build ──▶ Live Edge CDN
                                                    │
                                         Verifies Live Backend
                                          (apiContract: 3)
```

## How It Works

1. **Trigger**: Every push or merge to branch `main` on `github.com/getkcoin-alt/wppflow`.
2. **Release Guard Check (`scripts/release-check.mjs`)**:
   - Queries `https://srv1628639.hstgr.cloud/health`.
   - Confirms the backend is online, database is connected, and `apiContract` is 3.
   - Prevents shipping mismatched client bundles if the backend is undergoing major maintenance.
3. **Automated Production Build**:
   - Executes `npm run build` (`tsc -b && vite build`).
   - Produces optimized client assets in `dist/`.
4. **Instant Live Deployment**:
   - Deployed globally on Vercel Edge CDN at `https://wppflow-beige.vercel.app`.
   - Reverse proxies `/api/*` and `/health` to `https://srv1628639.hstgr.cloud`.

