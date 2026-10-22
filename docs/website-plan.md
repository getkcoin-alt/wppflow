# Scriwo website plan

Marketing website for www.scriwo.com, aimed at the UAE and India. Code lives in `website/`; this document is the strategy behind it.

## 1. Goal and current state

- **Goal:** be the site Google, AI Overviews, ChatGPT, Gemini and Perplexity find and cite for "WhatsApp CRM / shared WhatsApp inbox / team WhatsApp" searches in the UAE and India. Turn visitors into demo requests and plan sign-ups.
- **Payments:** not live yet. Every plan button opens `/contact` with the plan filled in. The enquiry is saved in the backend (`website_leads`) and emailed to `LEADS_EMAIL`. When the payment gateway is approved, set `PAYMENTS_LIVE = true` in `website/src/content/plans.ts`, then swap the plan buttons for checkout.
- **Prices (set October 2026):** Free for one account with one WhatsApp number; Starter AED 299 / ₹2,499 (3 numbers), Growth AED 799 / ₹6,999 (10), Business AED 1,699 / ₹14,999 (25), Enterprise custom. Monthly, before VAT/GST, with no per-message fees. Sales WhatsApp: +91 91191 12999. Every account is set up by the onboarding team; the website has no sign-in link (people get theirs by email).
- **Built now (62 static pages):** home, features (10), industries (8), UAE and India city pages (16), comparisons (3), pricing, contact, security, developers, about, guides (4), privacy, terms, sitemap, robots, `llms.txt`, Open Graph image.

## 2. Domains

Decided: the dashboard moves to `app.scriwo.com`, and the website takes `www.scriwo.com` (`scriwo.com` redirects to `www`).

DNS for scriwo.com is on Cloudflare; the Vercel team is `gitkcoin`. Today the `wppflow` project (the dashboard) holds `scriwo.com` (redirecting to `www`) and `www.scriwo.com`. Do these steps in order so nobody is locked out:

1. **Vercel → project `wppflow` → Settings → Domains → Add** `app.scriwo.com`.
2. **Cloudflare → scriwo.com → DNS → Add record:** type `CNAME`, name `app`, target `cname.vercel-dns.com`, proxy status **DNS only** (grey cloud). Wait until Vercel shows the domain as valid, then sign in at https://app.scriwo.com to check.
3. **Backend:** deploy this branch's backend, or set `APP_URL=https://app.scriwo.com` on the server and restart. New invite and set-password emails then link to the app. The backend already accepts requests from `app.scriwo.com`.
4. **Website:** in Vercel, create a project from `getkcoin-alt/wppflow` with **Root Directory** `website`, after this branch is merged to `main`. Set `NEXT_PUBLIC_SITE_URL=https://www.scriwo.com`, `NEXT_PUBLIC_APP_URL=https://app.scriwo.com` and `BACKEND_URL=https://srv1628639.hstgr.cloud`. Check the preview URL.
5. **Switch:** remove `www.scriwo.com` and `scriwo.com` from `wppflow`, then add them to the website project (`scriwo.com` redirecting to `www.scriwo.com`). Old emailed links (`/?invite=...`) are forwarded to `app.scriwo.com` by the website.

## 3. Information architecture

```
/                         Home: product, pillars, how it works, features, industries, locations, FAQ
/features                 Feature hub
/features/[slug]          10 feature pages: points, HowTo, FAQ
/industries               Industry hub
/industries/[slug]        8 industry playbooks
/whatsapp-crm             Locations hub (UAE | India)
/whatsapp-crm/[city]      16 city pages (6 UAE, 10 India)
/compare, /compare/[slug] Honest comparisons
/pricing                  Plans, "Price on request" until prices are set
/contact                  Lead form (demo, quote, plan, partner, support)
/security, /developers, /about, /privacy, /terms
/blog, /blog/[slug]       Guides
/sitemap.xml, /robots.txt, /llms.txt, /opengraph-image
```

**Internal linking:** home links to every hub. Feature pages link to the industries that use them and to the next three features. Industry pages link to their features and cities. City pages link to their industries, the core features and nearby cities. Guides link to related features. The footer links to every hub, every feature, every industry and the main cities. `npm test` fails if any cross-link points to a missing page.

## 4. Keyword map

| Intent | UAE | India | Page |
| --- | --- | --- | --- |
| Category | WhatsApp CRM UAE, WhatsApp CRM Dubai | WhatsApp CRM India | `/`, `/whatsapp-crm/*` |
| Team inbox | shared WhatsApp inbox, WhatsApp team inbox | same | `/features/whatsapp-team-inbox` |
| Multi-user | multiple users one WhatsApp, WhatsApp for team | same | `/compare/scriwo-vs-sharing-one-phone`, `/features/multiple-whatsapp-numbers` |
| Assignment | WhatsApp chat assignment, WhatsApp lead distribution | same | `/features/chat-assignment` |
| Broadcast | WhatsApp broadcast software Dubai | bulk WhatsApp software India (opted-in only) | `/features/whatsapp-broadcast` |
| Automation | WhatsApp auto reply for business | same | `/features/whatsapp-automation` |
| Monitoring | monitor employee WhatsApp chats (ethical framing: business numbers, owner visibility) | same | `/features/multiple-whatsapp-numbers`, `/security` |
| Developers | WhatsApp API for developers, WhatsApp webhook | same | `/developers`, `/features/whatsapp-api-and-webhooks` |
| Alternatives | WhatsApp API alternative, WhatsApp Business app for teams | same | `/compare/*` |
| Vertical | WhatsApp CRM real estate Dubai, WhatsApp for clinics UAE | WhatsApp for coaching institutes, WhatsApp for jewellery shop | `/industries/*` |
| Local | WhatsApp CRM Abu Dhabi, Sharjah, Ajman, RAK | Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Pune, Ahmedabad, Surat, Jaipur, Udaipur, Kolkata | `/whatsapp-crm/[city]` |
| Seasonal (next) | Ramadan, Eid, Dubai Shopping Festival, GITEX | Diwali, Navratri, wedding season, sale days | planned landing pages |

## 5. AEO and GEO (AI answer engines)

- Every page opens with a plain answer in its first paragraph, marked `data-speakable` and referenced by Speakable schema.
- Every guide starts with "The short answer": one quotable paragraph.
- Structured data in use: Organization, WebSite, SoftwareApplication, FAQPage, HowTo, BreadcrumbList, Service with City and GeoCoordinates, Article, ContactPage. Add `offers` with prices once pricing is published.
- `/llms.txt` summarises the product, its facts, every feature, industry, city and guide. It also states clearly that Scriwo is not the WhatsApp Business API and is not affiliated with Meta, so assistants describe it accurately.
- `robots.txt` allows all crawlers, including AI ones: citation is the goal.
- Entity consistency: use the same name, description and "UAE and India" positioning everywhere: site, Google Business Profile, LinkedIn, G2, Capterra, Product Hunt and press.

## 6. Content rules (E-E-A-T)

- Only true product facts. The source of truth is the product brief and `website/src/lib/site.ts` (test counts).
- No invented reviews, testimonials, customer logos, awards or user counts. Add real ones, with permission, as they come in.
- Comparisons only against things we can describe accurately. Named-competitor pages (Wati, Interakt, AiSensy, Respond.io, Gallabox, Zoko) need each claim checked against the competitor's current public pages, with the date.
- Never imply a Meta partnership or use the WhatsApp logo. Footer and terms carry the independence notice.
- Privacy notice and terms are plain-language drafts: have them reviewed against the UAE PDPL and India's DPDP Act 2023 before launch.

## 7. Design system

The same tokens as the app (`src/index.css`): "Pearl" light and "Obsidian" dark themes, emerald brand, champagne-gold accent, Inter with Instrument Serif italic for emphasis. Glass header, 24–32px radii, hairline borders and soft shadows. Motion respects reduced-motion settings. The hero uses a drawn, themed inbox preview, not a screenshot, so it stays sharp and light. Mobile has a sticky bottom bar with "Plans" and "Book a demo".

Accessibility: skip link, labelled navigation, breadcrumbs with `aria-current`, `<details>` FAQs that work without JavaScript, form errors tied to fields, visible gold focus ring, and AA contrast in both themes (light mode uses a deeper gold).

## 8. Launch checklist

- [ ] Domain move done (section 2); `app.scriwo.com` live; old emailed links still work
- [ ] Vercel project for `website/` with env vars from `.env.example`
- [ ] Backend deployed with migration `012_website_leads`; `LEADS_EMAIL` set; one live test enquiry received
- [ ] Privacy and terms reviewed
- [ ] Google Search Console and Bing Webmaster Tools: verify, submit `sitemap.xml`
- [ ] Google Business Profile (if there is a registered office), with the same name and description
- [ ] Rich Results Test on home, a feature, a city and a guide
- [ ] Lighthouse on mobile: target 95+ in every category

## 9. Analytics plan

- Vercel Web Analytics (cookieless) for traffic by page, country and referrer.
- Conversion events: `contact_submit` (with interest and plan), `demo_click`, `plan_choose`, `whatsapp_click`, `sign_in_click`.
- Weekly: enquiries by source page and country (`website_leads.source_page`, `country`). Monthly: Search Console clicks and impressions by page group (features, industries, cities, guides).
- Watch AI referrals (chatgpt.com, perplexity.ai, gemini.google.com) as their own channel.

## 10. Roadmap

1. **Next:** Arabic (right-to-left) and Hindi versions with `hreflang` (`en-AE`, `ar-AE`, `en-IN`, `hi-IN`); yearly billing option; real screenshots and a 60-second product video.
2. Seasonal landing pages: Ramadan and Eid, Diwali, Dubai Shopping Festival, GITEX, wedding season.
3. Interactive tools: pricing calculator, ROI calculator, "which plan fits" quiz.
4. Verified named-competitor comparison pages, and alternative pages.
5. Customer stories from the UAE and India, with permission.
6. Online checkout once the payment gateway is approved.
7. Lead inbox screen in the app for the platform admin (the API is already there).

## 11. Visual asset prompts

- **Hero:** "Over-the-shoulder view of a Dubai real-estate sales team in a glass office at dusk, Burj Khalifa softly out of focus, laptops showing a dark, elegant chat inbox, warm gold rim light, emerald accents, cinematic, 35mm, shallow depth of field."
- **India:** "Owner of a Mumbai jewellery store reviewing team chats on a tablet beside the counter, warm brass light, rich textures, editorial photography."
- **Clinic:** "Front desk of a modern Abu Dhabi dental clinic, receptionist answering patient messages on a desktop, clean white and emerald palette, natural light."
- **Product video:** "Twenty-second screen capture: a message arrives live, is assigned to a teammate, a private note with an @mention is added, and the chat is resolved. Dark theme, smooth zooms, gold cursor highlight."
- **3D:** "Minimal 3D map of the UAE and India connected by a glowing gold arc, obsidian background, emerald pins on Dubai, Abu Dhabi, Mumbai, Delhi and Bengaluru."

## 12. Guide (blog) plan: 250+ topics

Publish two good guides a week instead of many thin ones. Each guide gets a short answer, original local detail, and links to one to three features.

**Team setup and management (40)**
how to manage WhatsApp for a sales team · multiple people on one WhatsApp number: options compared · WhatsApp Business app vs a team inbox · how to hand over a WhatsApp chat · what happens to chats when an employee leaves · WhatsApp roles for owners, admins and staff · setting up WhatsApp for a new branch · running WhatsApp across Dubai and India offices · WhatsApp for remote sales teams · WhatsApp shift rotas for evenings and weekends · how to monitor team WhatsApp ethically · WhatsApp SLAs for small teams · measuring first-reply time · tracking unassigned chats · private notes vs internal WhatsApp groups · @mentions for faster escalation · onboarding a new salesperson on WhatsApp · WhatsApp etiquette guide for staff · writing saved replies that sound human · WhatsApp templates for follow-ups · resolving vs archiving chats · WhatsApp audit logs: why owners need them · security checklist for business WhatsApp · what to do when a phone goes offline · linking a number by QR safely · WhatsApp Web vs a team inbox · keeping WhatsApp history after a phone change · CSV import for WhatsApp contacts · cleaning a WhatsApp contact list · consent and opt-in records · WhatsApp for founders handing over sales · managing personal vs business numbers · WhatsApp groups for customers: when to use them · status updates for business · desktop notifications that don't distract · keyboard shortcuts for WhatsApp power users · phone-first workflows for field staff · team WhatsApp KPIs · weekly WhatsApp review meeting agenda · scaling from 3 to 30 WhatsApp numbers

**Broadcasts, automation and number health (30)**
avoid a WhatsApp ban when broadcasting · how to collect WhatsApp opt-ins · warming up a new business number · pacing campaigns safely · segmenting broadcast lists · writing a broadcast people reply to · unsubscribe wording · festival broadcast calendar for the UAE · festival broadcast calendar for India · keyword auto-replies that help · auto-reply for after hours · price list auto-reply · location auto-reply · when not to automate · measuring campaign replies · reactivating old leads politely · broadcast vs WhatsApp group vs status · what to do if your number is restricted · building a backup number plan · WhatsApp campaign mistakes · A/B testing broadcast messages · personalisation at scale · image vs text broadcasts · sending catalogues on WhatsApp · WhatsApp for event invitations · WhatsApp for payment reminders · polite follow-up cadence · Ramadan messaging do's and don'ts · Diwali offer messages that convert · wedding-season campaigns

**Industries (64: 8 industries × 8 topics)**
For each of real estate, clinics, education, travel, e-commerce, auto dealers, jewellery and insurance: lead response playbook · follow-up scripts · team structure · handover rules · broadcast ideas · compliance and privacy notes · KPIs to track · a week-in-the-life example

**Location guides (48: 16 cities × 3)**
For each city page: WhatsApp business culture in {city} · best practices for {top industry} in {city} · {city} seasonal calendar for WhatsApp campaigns

**Developers and integrations (25)**
WhatsApp webhooks explained · verifying webhook signatures · scoped API keys · connecting WhatsApp to Google Sheets · to Zoho CRM · to HubSpot · to Salesforce · to Shopify · to WooCommerce · to Tally/ERP · sending order updates · CSV automation · building a lead router · idempotent webhook handlers · retry strategies · logging and monitoring integrations · rate limits · testing with the API tester · SDK samples walkthrough · migrating from spreadsheets · two-way sync patterns · webhook security checklist · building dashboards from webhooks · syncing contacts nightly · event-driven follow-ups

**Comparisons and buying guides (25)**
best WhatsApp CRM in the UAE: what to look for · best WhatsApp CRM in India: buyer's guide · team inbox vs WhatsApp Business API · linked-device tools vs official API: trade-offs · questions to ask a WhatsApp CRM vendor · total cost of WhatsApp tools in AED · total cost in INR · free vs paid WhatsApp tools · security questions to ask · data ownership questions · plus verified named-competitor comparisons and alternative pages (15)

**Seasonal and calendar (20)**
Ramadan · Eid al-Fitr · Eid al-Adha · UAE National Day · Dubai Shopping Festival · GITEX · Expo-season events · back to school (UAE) · Diwali · Navratri · Dhanteras · Akshaya Tritiya · Indian wedding season · Republic Day sales · Independence Day sales · Holi · Onam · Pongal · year-end sales · new financial year (India)

Total: 252 topics. Location and industry series are templates: publish an entry only when it has real local detail, not just a different city name.
