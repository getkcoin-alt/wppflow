# Scriwo website

The public marketing site for Scriwo (www.scriwo.com). The product app lives in the repository root; this is a separate Next.js app deployed as its own Vercel project.

Next.js 15 (App Router, every page statically generated), React 19, TypeScript and Tailwind, with the same design tokens as the app.

```sh
cd website
npm ci
npm run dev        # http://localhost:3001
npm run typecheck
npm test
npm run build
```

## How content works

Pages are generated from typed data in `src/content/`:

| File | Pages |
| --- | --- |
| `features.ts` | `/features/[slug]` (with HowTo and FAQ structured data) |
| `industries.ts` | `/industries/[slug]` |
| `cities.ts` | `/whatsapp-crm/[city]` (UAE and India location pages) |
| `compare.ts` | `/compare/[slug]` |
| `blog.ts` | `/blog/[slug]` |
| `plans.ts` | `/pricing` |
| `faqs.ts` | Home page FAQ and `llms.txt` |

Add an entry and the page, sitemap, footer links and `llms.txt` update themselves. `npm test` checks that every cross-link points to a page that exists and that city pages are not copies of each other.

Only publish facts that are true for the product. Prices live in `plans.ts` (monthly, before tax); a `null` price shows as "Custom". The tests check that the FAQ quotes the same prices.

## Contact form and payments

Until online payments are approved (`PAYMENTS_LIVE` in `src/content/plans.ts`), every plan button opens `/contact` with the plan pre-filled. The form posts to `/api/public/contact` on this site. `next.config.ts` forwards that to the backend (`BACKEND_URL`), which saves the enquiry in `website_leads` and emails `LEADS_EMAIL`. The platform admin can list enquiries at `GET /api/admin/leads`.

## Deploying on Vercel

1. Create a new Vercel project from this repository with **Root Directory** set to `website`.
2. Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` and `BACKEND_URL` (see `.env.example`). `NEXT_PUBLIC_WHATSAPP_NUMBER` is optional.
3. Move the app to `app.scriwo.com` before pointing `www.scriwo.com` at this project. The step-by-step is in section 2 of `../docs/website-plan.md`.
