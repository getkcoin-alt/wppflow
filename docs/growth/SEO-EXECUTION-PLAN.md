# Scriwo search visibility: conservative implementation

Date: 4 November 2026. Base: aeafba7b8f61336120d288cefc7e5460d3baebd0.
Source: the uploaded SEO Improvement Plan (a strategy document, explicitly not a measured GSC audit), current website/product code, and read-only Google Search Console via HYPD.

## Baseline and interpretation

SEARCH-BASELINE-2026-11-04.json records the actual queries and executed date range. The domain property reports 4 clicks, 56 impressions, 7.14% CTR and position 19.91 for 28 October–4 November, web search, data_state=all. Dates after the estimated finalized-through date of 1 November are provisional. Do not add query or page rows to estimate property totals; Google withholds anonymized queries and page totals can be counted differently.

URL Inspection confirms the homepage and /blog/best-whatsapp-crm-uae-india are indexed with matching user/Google canonicals. The guide has 23 impressions, zero clicks and position 9.30 in this small provisional sample. /riwo has 6 impressions; the automobile-dealers page has 10. These are clues for useful content, not statistically established CTR problems or proof of product-market fit. The data contains October crawls; this record does not independently establish the launch date.

The correct sitemap was downloaded on 3 November and reports zero errors/warnings. Another submission, /sitemap.xml. (with a trailing dot), has one error. The sitemap's indexed=0 field does not override the PASS verdicts from URL Inspection. HYPD is read-only: the erroneous Search Console submission has not been removed.

## Priority decisions and changes

| Priority | Audit recommendation | Action |
|---|---|---|
| P0 | Verify measurement/indexing before claims | Recorded real GSC baseline and two index inspections; retained working robots, canonical host, hreflang and verification settings |
| P0 | Clean sitemap | Preserve the current sitemap generator and add an exact permanent redirect from the malformed trailing-dot address; remove the erroneous submission in Search Console when managing that account |
| P0 | Preserve current SEO/AEO/GEO | Capture 82 rendered pages; enforce existing titles, H1s, canonical links, robots metadata, hreflang and schema identities in CI |
| P1 | Improve commercial conversion | Correct stale contact-first instructions in homepage/FAQs and AI summaries; Free CTA now opens free signup; remove unsupported Free-plan keyword-automation claims |
| P1 | Improve existing search-intent coverage | Enrich the already-indexed buying guide with a practical evaluation section and contextual links; retain its title, description, URL and initial answer |
| P1 | Make AI answers accurate and useful | Shared signup facts in human-visible FAQs and both AI-readable references; add an explicit draft-versus-automation explanation to Riwo with handover and setup links |
| P2 | Publish useful educational content | Add two concrete guides: testing a WhatsApp CRM before purchase, and dealership enquiry-to-test-drive follow-up; no invented integration, results or customer testimonials |
| P2 | Contextual internal linking | Render links inside relevant article sections, expose them in llms-full, and link the dealership guide from the existing industry guide block via its industry tag |

## Intent map: preserve existing pages rather than duplicate them

| PDF proposal | Existing destination kept |
|---|---|
| /whatsapp-crm | /whatsapp-crm plus /features/whatsapp-team-inbox |
| /ai-whatsapp-chatbot | /riwo plus /features/ai-sales-assistant |
| /whatsapp-marketing | /features/whatsapp-broadcast |
| /whatsapp-automation | /features/whatsapp-automation |
| /whatsapp-business-api | /compare/scriwo-vs-whatsapp-api-platforms: explain fit; never present linked-device Scriwo as the official API |
| Real-estate landing page | /industries/real-estate and /homes, with their existing separate purposes |
| AiSensy alternative | /compare/aisensy-alternative |

## Deliberately preserved

No existing public URL removed or renamed; no existing title, H1, canonical, hreflang, crawler permission, verification code, structured-data entity ID or tracking event removed. Retain all existing comparison and location pages, Article/Breadcrumb/Organization/SoftwareApplication/FAQ markup and sitemap machinery. The Free-page description is corrected because it advertised automations unavailable on that plan; it is not a speculative CTR rewrite. No ratings, fabricated reviews, unverified customer results, mass-produced city pages or unsupported official-API promises added.

The buying guide has an actual content update date; no blanket sitemap freshness changes. llms.txt is retained as a reference format, not claimed to be a ranking requirement. Google's AI guidance says normal SEO fundamentals apply, with no extra schema or special files required: https://developers.google.com/search/docs/appearance/ai-features . Sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap . No ranking, indexing speed or AI recommendation can be guaranteed.

## Validation and release

1. `npm ci --prefix website`, `npm run typecheck --prefix website`, `npm test --prefix website`, `npm run build --prefix website`.
2. `python3 scripts/seo-regression.py`: compare the new rendered output to docs/growth/SEO-INVARIANTS.json. Run automatically in website CI after the build. Intentional future title/H1 changes require review before explicitly recapturing the baseline.
3. HTTP smoke tests on the production build: canonical host/robots, sitemap includes both new guides, existing indexed guide still returns 200 with its original canonical, new guides have one H1 and Article/Breadcrumb schema, exact sitemap-typo redirect, and signup instructions agree between visible pages and both text references.
4. Merge only after CI passes. Verify Vercel production and the canonical www.scriwo.com pages. The existing IndexNow workflow runs on website changes; it is a discovery hint, not proof of indexing or AI citation.
5. No browser used. Field Core Web Vitals, actual mobile visual performance, final GA4 attribution and live user conversions are not measured by this change.

## Follow-up plan

- First 7–14 days: check discovery/index inspection for the two new guides, watch existing page/query impressions with the same definitions, and check trial clicks. Do not infer a win/loss from a handful of searches or same-day provisional data.
- Days 15–30: compare complete weekly cohorts. Inspect referring queries for the buying guide and Riwo. Consider a one-page snippet experiment only after enough relevant impressions exist; change one variable, retain the original and record dates.
- Days 31–60: add one product walkthrough from a verified real setup and one original industry workflow based on customer questions; assess search-driven signup/activation attribution and real mobile field data. Publish comparison updates only after verifying competitor claims.
- Days 61–90: expand the industry that generates activated teams, update content from real sales/support questions, and seek relevant editorial coverage without purchased links. Add new commercial URLs only when they have a genuinely different intent and substantial original material.

Separate work: deeper signup-to-retention analytics, provider/API strategy, verified customer case studies and white-label implementation. None is represented as completed by these website changes.
