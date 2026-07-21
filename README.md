# Billify

A free, no-signup invoice generator that runs entirely in your browser. Create, customize, and download professional invoices as PDF — no account required.

**Live site:** [billify.me](https://billify.me)

---

## Features

- **No signup required** — open the editor and start invoicing immediately; no account, no email, no friction.
- **Client-side only** — all invoice data stays in your browser's `localStorage`; nothing is sent to a server.
- **12 invoice templates** — Modern, Classic (free tier) plus Minimal, Clean, Bold, Executive, Corporate, Startup, Freelancer, Agency, Consulting, Creative (Pro).
- **Multi-currency** — 157 ISO 4217 currency codes with locale-correct symbols and decimal precision via `Intl.NumberFormat`.
- **Structured tax handling** — VAT / GST / Sales Tax / MwSt / Custom labels, country presets (UK, DE, FR, AU, CH), seller/buyer tax IDs, and EU reverse-charge support.
- **Client-side PDF generation** — powered by jsPDF + jspdf-autotable, with Unicode (CJK, Arabic, Hebrew, Cyrillic, Greek) font fallback.
- **CSV export** — spreadsheet-ready, RFC-4180 compliant, formula-injection neutralized (opens safely in Excel / Google Sheets / Numbers).
- **Logo upload** — PNG / JPEG / WebP up to 1 MB, persisted in a dedicated `localStorage` side-key.
- **Invoice history** — recent invoices saved locally; reload to continue editing.
- **Freemium billing** — Free: 3 invoices/month, 2 templates. Pro (€9/mo or €6.58/mo annual): unlimited invoices, all 12 templates.
- **Programmatic SEO** — 30 profession landing pages, 7 competitor-comparison pages, 4 format-export pages, plus author/E-E-A-T pages and a tax-compliance guide.
- **Self-hosted, cookieless analytics** — Umami, same-origin, PII-free (stores only aggregate page views + named events).
- **Security-hardened API** — Stripe checkout via a stateless Express server with JWT signing, CSRF double-submit cookies, per-IP rate limiting, origin validation, and a 30-minute checkout-redeem window.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router, `output: 'export'` static export) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + Radix UI primitives |
| PDF | jsPDF + jspdf-autotable |
| Payments | Stripe Checkout (subscriptions) |
| Billing API | Express (Node.js), stateless, JWT-based |
| Analytics | Umami (self-hosted, PostgreSQL-backed) |
| Deployment | Docker (nginx + api + umami + postgres), Traefik via Coolify |
| Testing | Playwright |

---

## Architecture

Billify is a **privacy-first, client-side application**. The entire invoice editor runs in the browser:

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (billify.me)                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js static export (served by nginx)              │  │
│  │  • Invoice editor (React)                             │  │
│  │  • jsPDF → PDF generation (in-browser)                │  │
│  │  • localStorage ← all invoice data, logos, history    │  │
│  │  • Stripe client → redirect to Checkout               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ (Stripe Checkout only)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API (billify-stripe-api)                           │
│  • POST /create-checkout-session                            │
│  • POST /verify-session, /refresh-token, /validate-token    │
│  • POST /webhook (Stripe events)                            │
│  Stateless — no database, no invoice storage                │
└─────────────────────────────────────────────────────────────┘
```

- **No backend database for invoices.** Every invoice, logo, and history entry lives in the user's `localStorage`. The Express API exists solely to mediate Stripe Checkout and sign/verify plan JWTs.
- **Static export.** `next.config.mjs` uses `output: 'export'`; the built site in `dist/` is served by nginx, which also reverse-proxies `/api/stripe/*` to the API container.
- **Plan enforcement is client-side** by design (the privacy model resists making the backend authoritative over invoice creation). The free-tier cap and Pro template unlock are gated client-side; a signed JWT (7-day exp) from the API is the proof of Pro status.

---

## Quick Start

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
# → http://localhost:3000

# 3. Production build (static export to dist/)
npm run build

# 4. Serve the production build
npm start
```

The Stripe API is only needed for checkout flows in production. For local development of the editor, PDF, and SEO pages, the Next.js dev server alone is sufficient.

---

## Project Structure

```
invoicepro/
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── app/                # The invoice editor (main application)
│   │   ├── pricing/            # Pricing page (Free / Pro)
│   │   ├── templates/          # Template gallery
│   │   ├── invoice-template-for/[profession]/  # 30 profession SEO pages
│   │   ├── compare/[slug]/     # 7 competitor-comparison SEO pages
│   │   ├── invoice-template/[format]/          # 4 format-export SEO pages
│   │   ├── authors/[id]/       # E-E-A-T publisher pages
│   │   ├── guides/             # Long-form content (tax compliance guide)
│   │   ├── privacy/            # Privacy policy
│   │   └── security/           # Security disclosure page
│   ├── components/             # React components (+ ui/ Radix primitives)
│   ├── data/                   # Programmatic-SEO content sources
│   │   ├── professions.ts      # 30 profession landing-page definitions
│   │   ├── comparisons.ts      # 7 competitor comparisons
│   │   ├── formats.ts          # 4 format-export pages
│   │   └── authors.ts          # Publisher/author identity
│   ├── hooks/                  # React hooks (subscription, history, storage…)
│   ├── lib/                    # pdf, site config, SEO, plan-limits, embed
│   ├── types/                  # Core domain types (Invoice, templates, currency)
│   └── assets/                 # Fonts (Noto Sans for Unicode PDF fallback)
├── api/                        # Stateless Stripe Express server
│   ├── stripe-server.js        # Checkout, JWT, webhook endpoints
│   ├── plan-limits.json        # Single source of truth for plan caps
│   └── Dockerfile
├── docker-billify/             # nginx image (serves dist/ + proxies /api)
├── docker-compose.yml          # nginx + api + umami + postgres
├── deploy/                     # Standalone nginx config
├── tests/                      # Playwright test suite
└── scripts/                    # OG image generator
```

---

## Configuration

### Next.js (client)

The client reads one optional build-time variable for analytics:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami website ID. If unset, the analytics snippet is omitted. |

### Stripe API (`api/.env`)

The Express server requires these environment variables (see `api/.env` for a template):

| Variable | Required | Description |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | yes | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | yes | Stripe webhook signing secret (`whsec_...`) |
| `JWT_SECRET` | yes | Random 256-bit string for signing plan JWTs |
| `STRIPE_PRICE_PRO_MONTHLY` | prod | Pro monthly price ID |
| `STRIPE_PRICE_PRO_YEARLY` | prod | Pro annual price ID |
| `STRIPE_PRICE_TEAM_MONTHLY` | prod | Team monthly price ID (Team is collapsed to Pro) |
| `STRIPE_PRICE_TEAM_YEARLY` | prod | Team annual price ID |
| `SUCCESS_URL` | no | Defaults to `https://billify.me/app` |
| `CANCEL_URL` | no | Defaults to `https://billify.me/pricing?canceled=true` |
| `PORT` | no | Defaults to `3000` |
| `NODE_ENV` | no | Set to `production` for live mode |

In production the price-ID env vars are **required** — the server fails fast on boot if they're missing. In dev mode, test price IDs are used as a fallback.

### Docker / Coolify

The full stack is defined in `docker-compose.yml` (four services on the `coolify` network):

1. **nginx** — serves the Next.js static export from `/dist` and reverse-proxies `/api/stripe/*` to the API container. Traefik labels route `billify.me` / `www.billify.me`.
2. **api** — the Express Stripe server.
3. **umami-db** — PostgreSQL 16 (named `umami-db` to avoid a DNS collision with Coolify's internal `postgres` alias).
4. **umami** — self-hosted Umami analytics, routed at `analytics.billify.me`.

Additional secrets for the Umami/Postgres stack (set via Coolify env or a `.env` file): `POSTGRES_PASSWORD`, `DB_PASSWORD`, `UMAMI_SALT`.

```bash
# Build and start the full stack
docker compose up -d --build

# Or standalone (without Coolify):
docker compose --env-file api/.env up -d --build
```

---

## Testing

Tests are written with **Playwright** and live in `tests/`. The suite covers unit-level domain logic (types, crypto, currency formatting), end-to-end editor flows, PDF rendering, CSS pipeline integrity, marketing-claim verification, programmatic-SEO page generation, and visual regression.

```bash
# Install Playwright browsers (first run only)
npx playwright install

# Run the full suite against a local dev server
npm run dev          # in one terminal
npx playwright test  # in another

# Run against the live site
TEST_URL=https://billify.me npx playwright test

# Run a specific spec
npx playwright test tests/e2e-app.spec.ts

# View the HTML report
npx playwright show-report test-report
```

Configuration is in `playwright.config.ts` (Chromium desktop + mobile projects, traces on first retry, screenshots on failure). The convenience script `run-tests.sh` runs the visual-regression and e2e specs against the live site.

---

## License

MIT
