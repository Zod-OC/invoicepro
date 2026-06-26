# Programmatic SEO: Industry Landing Pages — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Ship 30+ programmatic SEO landing pages at `/invoice-template-for/[profession]/` that target low-competition, high-intent search terms like "invoice template for electrician". Each page embeds a real, useful editor (the Billify invoice builder) and links back to the main app.

**Architecture:** Static-generated pages using a single `ProfessionPage` component driven by a data file of 30 professions. Each page has:
1. SEO-optimized H1 + meta tags
2. 600–1,200 words of genuinely useful, profession-specific copy
3. **An embedded, pre-filled invoice editor** (the actual Billify `/app` page, iframe-embedded with URL params)
4. 2–3 cross-links to related professions
5. Schema.org FAQPage + BreadcrumbList JSON-LD

**Tech Stack:** Next.js 14.2.15 (App Router, static export, `output: 'export'`), React 18, Tailwind CSS 3, TypeScript 5.

**Key Insight:** Billify's tagline "No signup. Data stays in browser" is the moat. The embedded editor proves it: a visitor can use the tool without leaving the SEO page and without ever creating an account. No other invoice tool can copy this without breaking their subscription model.

---

## Strategic Context

From the GTM research (see commit history):
- **Top opportunity:** `invoice generator no signup` (~500–1,500/mo, KD <15) — **near-zero competition**
- **Highest volume opportunity:** `invoice template for [profession]` (100–2,000/mo each, KD <20) — programmatic goldmine
- **Reference competitor:** Invoice Simple generates 200+ of these pages, drives 100K+ organic visits/mo
- **Conversion pattern:** SEO copy → embedded tool (instant value) → user downloads PDF → may return

**This is not about competing for the head term "invoice generator" (owned by invoice-generator.com, 2M visits/mo). It's about owning the long tail of profession-specific, no-signup, no-watermark searches.**

---

## Constraints & Invariants

1. **NO signup flow** — these pages must never prompt the user to create an account
2. **NO watermarks** — free tier on the embedded editor is the same as the real `/app` page
3. **Privacy claim must be verifiable** — embedded editor uses localStorage, not our servers
4. **Mobile-first** — most freelancer traffic is mobile
5. **No regressions** — all 54 existing Playwright tests must still pass
6. **Coolify deployment is automatic** — push to `master` (the repo's default branch) → webhook → redeploy
7. **No backend changes** — pages are pure static export
8. **Embed isolation is engineered, not free** — same-origin iframes share `localStorage`/cookies with `/app`; embed mode must namespace all storage keys (`billify_embed_*`), disable both paywall gates, and skip auto-save (see Task 4)

---

## File Structure

```
src/
├── app/
│   ├── invoice-template-for/
│   │   └── [profession]/
│   │       └── page.tsx                          # Dynamic route, 30 pages
│   ├── sitemap.ts                                # Auto-generates sitemap from data file
├── data/
│   └── professions.ts                            # 30 profession entries: slug, name, h1, copy sections, related slugs
├── components/
│   ├── EmbeddedEditor.tsx                        # Iframe wrapper for /app with prefilled params
│   ├── ProfessionPage.tsx                        # Reusable template for profession pages
│   └── CrossLinks.tsx                            # "Related invoices for: [X], [Y], [Z]"
└── lib/
    └── seo.ts                                    # Metadata, JSON-LD helpers
public/
└── og-images/
    └── invoice-template-[slug].png               # 1200x630 OG image per page
```

---

## Data Model: `src/data/professions.ts`

Each profession is one object. 30 objects total. Format:

```typescript
export interface Profession {
  slug: string;                    // "electrician" → /invoice-template-for/electrician
  name: string;                    // "Electrician"
  pluralName: string;              // "Electricians" (for H1 "Electrician Invoice Templates")
  h1: string;                      // "Free Electrician Invoice Template — No Signup"
  metaDescription: string;         // 150-160 chars, SEO-optimized
  introParagraph: string;          // 80-120 words, sets context
  whatToInclude: string[];         // 5-8 line item suggestions
  industryTips: string;            // 200-300 words on industry-specific invoice advice
  faq: { question: string; answer: string }[];  // 3-5 Q&A pairs
  relatedSlugs: string[];          // 2-3 other profession slugs
  defaultLineItems: {              // Pre-fills the embedded editor
    description: string;
    quantity: number;
    rate: number;
  }[];
  defaultTaxRate: number;          // e.g. 0 (US most states), 19 (DE), 20 (UK)
  defaultCurrency: 'USD' | 'EUR' | 'GBP';
}
```

---

## Task 1: Create Profession Data File (Foundation)

**Objective:** Define the 30 profession data entries that drive all 30 landing pages.

**Files:**
- Create: `src/data/professions.ts`

**Why this first:** Every other task consumes this data. It is the single source of truth. Get it right and the rest is mechanical.

**Step 1: Define the TypeScript interface**

Create `src/data/professions.ts` with the `Profession` interface and 5 sample professions (Electrician, Freelancer, Photographer, Consultant, Plumber) as proof-of-concept.

**Step 2: Verify TypeScript compiles**

Run: `cd /root/projects/invoicepro && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/data/professions.ts
git commit -m "feat(seo): add profession data file with 5 sample entries"
```

---

## Task 2: Write the SEO Copy for All 30 Professions

**Objective:** Author the long-form content for all 30 profession landing pages. This is the highest-effort, highest-ROI task.

**Files:**
- Modify: `src/data/professions.ts` (add 25 more entries, total 30)

**Priority batch order (highest search volume × lowest KD × highest fit):**

**Tier 1 (build first, 10 entries):**
1. freelancer
2. electrician
3. plumber
4. photographer
5. consultant
6. web-developer
7. graphic-designer
8. carpenter
9. personal-trainer
10. tutor

**Tier 2 (next 10):**
11. handyman
12. cleaner
13. painter
14. videographer
15. writer
16. hvac
17. mechanic
18. therapist
19. social-media-manager
20. dj

**Tier 3 (final 10):**
21. coach
22. landscaper
23. roofer
24. wedding-photographer
25. voice-over-artist
26. massage-therapist
27. dog-walker
28. web-designer
29. illustrator
30. virtual-assistant

**Copy requirements per profession:**
- `introParagraph`: 80–120 words, no filler, addresses the specific profession's invoicing pain
- `whatToInclude`: 5–8 bullet items, real line items (e.g., electrician: "Labor hours", "Service call fee", "Materials markup")
- `industryTips`: 200–300 words of genuinely useful advice (e.g., "Always specify your license number on contractor invoices in California")
- `faq`: 3–5 Q&As, written in the user's voice

**Quality bar:** If a real freelancer in that trade would read this and think "yes, this is exactly my situation", it passes. If they think "this is generic boilerplate", rewrite it.

**Acceptance criteria:**
- All 30 slugs are unique
- All 30 have all required fields (no `undefined` or empty strings)
- Total word count per page: 600–1,200 (intro + tips + FAQ answers)
- Copy is profession-specific, not generic
- No AI-tell phrases ("in today's fast-paced world", "look no further", "comprehensive solution")

**Step 1: Add Tier 1 (10 entries)**

**Step 2: Add Tier 2 (10 entries)**

**Step 3: Add Tier 3 (10 entries)**

**Step 4: Verify data integrity**

Run a small script:
```bash
cd /root/projects/invoicepro && npx tsx -e "
import { professions } from './src/data/professions';
console.log('Total:', professions.length);
console.log('Slugs unique:', new Set(professions.map(p => p.slug)).size === professions.length);
console.log('All have FAQ:', professions.every(p => p.faq.length >= 3));
console.log('All have intro:', professions.every(p => p.introParagraph.length >= 300));
"
```
Expected: `Total: 30`, `Slugs unique: true`, `All have FAQ: true`, `All have intro: true`

**Step 5: Commit**

```bash
git add src/data/professions.ts
git commit -m "feat(seo): add 30 profession entries with industry-specific copy"
```

---

## Task 3: Build `ProfessionPage` Component (Reusable Template)

**Objective:** Build the React component that renders a single profession page. Pure presentation, no data fetching (data is passed as prop).

**Files:**
- Create: `src/components/ProfessionPage.tsx`

**Component structure:**

```typescript
import { Profession } from '@/data/professions';

export function ProfessionPage({ profession }: { profession: Profession }) {
  return (
    <main>
      <nav>...</nav>
      <header>
        <Breadcrumb schema />
        <h1>{profession.h1}</h1>
        <p>{profession.introParagraph}</p>
        <CTA: "Create Your [Profession] Invoice Free" → scrolls to embedded editor />
      </header>

      <section id="editor">
        <h2>Create your invoice in 30 seconds</h2>
        <EmbeddedEditor
          professionSlug={profession.slug}
          defaultLineItems={profession.defaultLineItems}
          defaultTaxRate={profession.defaultTaxRate}
          defaultCurrency={profession.defaultCurrency}
        />
      </section>

      <section>
        <h2>What to include on a [Profession] invoice</h2>
        <ul>{profession.whatToInclude.map(...)}</ul>
      </section>

      <section>
        <h2>Tips for [Plural] invoicing</h2>
        <p>{profession.industryTips}</p>
      </section>

      <section>
        <h2>Frequently asked questions</h2>
        <FAQ items={profession.faq} />
        <script type="application/ld+json">FAQPage schema</script>
      </section>

      <CrossLinks slugs={profession.relatedSlugs} />
      <Footer />
    </main>
  );
}
```

**Acceptance criteria:**
- Component takes a single `profession` prop
- All copy sections are rendered with semantic HTML (`<h1>`, `<h2>`, `<section>`, `<ul>`)
- BreadcrumbList + FAQPage JSON-LD present
- Mobile responsive (single column on mobile, max-w-4xl centered on desktop)
- "Create Your [Profession] Invoice" CTA scrolls to `#editor`
- "Get Started — Free Forever" button visible above-the-fold

**Verification:**
Run: `cd /root/projects/invoicepro && npx tsc --noEmit`
Expected: 0 errors

**Step: Commit**

```bash
git add src/components/ProfessionPage.tsx
git commit -m "feat(seo): add reusable ProfessionPage component"
```

---

## Task 4: Build `EmbeddedEditor` Component (Real Embed Mode)

**Objective:** Embed the existing Billify editor (`/app`) on the SEO page as an iframe, prefilled from the profession data, and make `/app` fully embed-aware so the iframe is a genuinely unlimited, no-signup, no-persistence scratch pad that **never touches the user's real `/app` data**.

**Files:**
- Create: `src/components/EmbeddedEditor.tsx`
- Modify: `src/app/app/page.tsx` (embed-mode gating)
- Modify: `src/app/app/error.tsx` (namespaced clear-and-reload)
- Modify: `src/hooks/useSubscription.ts` (short-circuit in embed mode)

**Critical premise — the iframe is NOT an isolation boundary.** The iframe is same-origin (`billify.me/app` inside `billify.me/invoice-template-for/...`), so it **shares `localStorage` and cookies with the top-level `/app` session**. Without explicit embed-mode handling, the iframe will: (a) read and overwrite the user's saved `billify_current` invoice (data loss for returning users), (b) read the shared `billify_count_YYYY-MM` and surface the free-tier paywall — a signup prompt, violating Constraint #1, and (c) write subscription state from the iframe URL. Embed mode must be a real, gated mode in `/app`, not a passive URL param the editor ignores.

**URL param contract** (base64-JSON values):
```
/app?embed=true&profession=electrician&invoice=[base64 json of full Invoice]
```
The `invoice` param carries the **full** `Invoice` object (not just line items), so the profession prefill and — later — the user's scratch edits can round-trip through the URL. On mount, `/app` decodes, validates (reuse `validateInvoice`), and **merges** it into state rather than wholesale-replacing, so no field is lost.

**Implementation strategy:**

**Option A (chosen):** iframe pointing to `/app?embed=true&...`, with `/app` made embed-aware via a single `isEmbed` flag read from `URLSearchParams` inside a post-hydration `useEffect`.

**Option B (rejected):** Reuse the form components inline. Higher coupling; risks breaking the 54 existing tests.

**Why A:** Minimal coupling — the editor UI stays as-is — but we add explicit embed-mode gates at every storage/paywall touch point. The iframe is *not* a free isolation boundary; we engineer the isolation.

### Storage namespacing (all 5 key patterns)

When `embed=true`, every `localStorage` access uses a `billify_embed_*` prefix and never reads or writes the host keys:

| Host key | Embed key | Touch points |
|---|---|---|
| `billify_current` (`STORAGE_KEY`) | `billify_embed_current` | `page.tsx:17,22,34` |
| `billify_count_YYYY-MM` (built inline) | `billify_embed_count_YYYY-MM` | `page.tsx:58,66` |
| `billify_plan` (`PLAN_KEY`) | `billify_embed_plan` | `useSubscription.ts:38,60,80,89` |
| `billify_limits` (`LIMITS_KEY`) | `billify_embed_limits` | `useSubscription.ts:39,66,81,90` |
| `billify_sub_token` (`TOKEN_KEY`) | `billify_embed_sub_token` | `useSubscription.ts:37,75,82,88` |

Two traps to handle explicitly:
- **`src/app/app/error.tsx:35` hardcodes the literal `'billify_current'`** (not via the `STORAGE_KEY` constant). The "Clear & Reload" button runs inside the embed on a render error and would wipe the host's real invoice. Rewrite it to respect the embed namespace (read the active key from a shared helper, not the bare string).
- **`useSubscription`'s mount effect reads `window.location.search` for `checkout=success/session_id`** and would fire `verifySession` inside the embed iframe, writing `billify_embed_plan/limits/sub_token`. **Short-circuit the entire subscription flow in embed mode** (skip `verifySession`/`getToken`/`setSubscription`/`clearSubscription`; treat the embed as unlimited — no plan read or write). The `billify_csrf` cookie is origin-scoped and cannot be namespaced per-embed — don't rely on cookie isolation; it's unneeded because the embed never authenticates.

### Disable the paywall (two gates, not one)

`PaywallModal` is rendered unconditionally (`page.tsx:606-610`), so *any* `setShowPaywall(true)` surfaces an upgrade prompt in the iframe. There are **two** `setShowPaywall` call sites that leak in embed mode — both must be bypassed:

1. **`page.tsx:150-151`** — free-tier download limit (`plan === 'free' && monthlyCount >= 3`). In embed mode, allow download unconditionally; do not raise the modal.
2. **`page.tsx:574-575`** — Pro-template gate (`t.tier !== 'free' && plan === 'free'`). In embed mode, allow all templates (the embed demos the full product); do not raise the modal.

Additionally: **never render `PaywallModal` when `embed=true`** (force `open=false`), and **hide the nav "Free/Pro" badge and its `/pricing` link** (`page.tsx:410-415`) — in an iframe that link navigates the *iframe* to `/pricing`, not the top-level page. This makes the embed genuinely unlimited, no signup, no watermark — a stronger demo than `/app` itself, which is the marketing point.

(`canCreateInvoice`/`hasTemplateAccess` from `useSubscription` are destructured at `page.tsx:48` but never called — the file re-implements these checks inline. Gate the inline checks at lines 150 and 574; don't swap them for the hook helpers in this pass, or the leak moves to a different path.)

### No auto-save; "Edit in full-screen" preserves the user's work

When `embed=true`:
- **Skip the debounced auto-save effect** (`page.tsx:74-79`) entirely — the embed is a throwaway scratch pad. Every visit restores the clean profession prefill from the URL. Never write `billify_embed_current` from the auto-save.
- **The "Edit in full-screen" link must re-encode the full current invoice into the `/app` URL** before opening the tab: `window.open('/app?invoice=' + base64(JSON.stringify(currentInvoice)))`. Without this, the user's in-iframe edits (from/to, uploaded logo, notes, terms, dates, template) are lost the moment they click through to the persistent `/app` — severing the conversion path. The full-invoice contract above is what makes the handoff lossless. `/app` (non-embed) then hydrates from that URL on first mount and persists normally via `billify_current`.

### Hydration safety (static export)

`/app` is prerendered once to static HTML under `output:'export'`; `loadInvoice()` returns the empty invoice during prerender (`typeof window === 'undefined'`). Rules:
- **Keep all URL-param reading in a post-hydration `useEffect` — never in the `useState` initializer (`loadInvoice`) or render body.** Reading `window.location.search` in the initializer would make the first client render diverge from the static HTML → hydration mismatch + flash.
- Use `window.location.search` directly (not Next's `useSearchParams()`, which has `output:'export'` caveats).
- Merge the decoded invoice into `prev` (`setInvoice(prev => validateInvoice({ ...prev, ...embedOverrides }) ?? prev)`), not a wholesale replace.
- **Fix the pre-existing hydration mismatch in the same pass:** `loadInvoice` already reads `localStorage` in the lazy initializer, so returning users get a first render that differs from the prerendered empty HTML. Move `localStorage` restoration into a `useEffect` too, so the first client render always matches the prerender. Embed mode makes this mismatch more visible, so fix it now.
- **Validate/sanitize every embed-provided field** before `setInvoice`: numeric `quantity`/`rate`, length caps on `description`/`notes`/`terms`, `currency` allowlist (`USD|EUR|GBP`), `template` tier. These flow into the live preview and the `jspdf` PDF path.

**Acceptance criteria:**
- `/app?embed=true&invoice=...` prefills the editor with the full profession invoice (line items, tax rate, currency)
- Editor works fully inside the iframe: PDF download and template switching both succeed with **no paywall ever shown**
- `PaywallModal` is never rendered and the nav plan badge/pricing link is hidden when `embed=true`
- No reads of or writes to the host keys (`billify_current`, `billify_count_*`, `billify_plan`, `billify_limits`, `billify_sub_token`) occur inside the iframe (verify with a `localStorage` snapshot test)
- `error.tsx`'s "Clear & Reload" only clears the embed namespace, never the host's `billify_current`
- The embed never auto-saves; refreshing the SEO page restores the profession prefill, not prior edits
- "Edit in full-screen" opens `/app?invoice=<full current invoice>` in a new tab; the user's in-iframe edits (from/to, logo, notes, terms, dates, template) are present and persist via `billify_current`
- No hydration-mismatch warnings in the console for either embed or non-embed `/app`

**Step 1: Create `EmbeddedEditor.tsx`**
- Renders `<iframe src="/app?embed=true&invoice=..." loading="lazy" />`
- Responsive: `w-full h-[800px] md:h-[1000px]`
- The "Edit in full-screen" handler obtains the iframe's current invoice (via a `postMessage` request to `/app`, or by having `/app` post its state up on change) and `window.open`s `/app?invoice=<base64 full invoice>`

**Step 2: Add embed-mode gating to `src/app/app/page.tsx`**
- Read `isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true'` in a mount `useEffect` (store in state, default `false` on first render for hydration safety)
- Namespace all `localStorage` keys by `isEmbed` (table above)
- Skip the debounced auto-save effect when `isEmbed`
- Bypass both paywall gates (lines 150, 574) and suppress `PaywallModal` + nav badge when `isEmbed`
- Move `localStorage` restoration out of the `loadInvoice` initializer into a `useEffect` (fixes the pre-existing hydration mismatch)
- Parse + validate + merge the `invoice` URL param into state in the same mount `useEffect`

**Step 3: Short-circuit `useSubscription` and fix `error.tsx` in embed mode**
- `useSubscription`: when `isEmbed`, skip `verifySession`/`getToken`/`setSubscription`/`clearSubscription`; treat as unlimited (no plan read/write)
- `error.tsx`: clear only the active (embed or host) `billify[_embed]_current` key via a shared helper, not the hardcoded `'billify_current'` literal

**Step 4: Verify editor works in iframe**
- Build and serve locally; open `/invoice-template-for/electrician/`
- Confirm editor prefills with the electrician line items, no hydration warnings
- Click "Download PDF" — generates with no paywall, no console errors
- DevTools → Application → localStorage: confirm **no host keys** (`billify_current`, `billify_count_*`, `billify_plan`, …) appear; only `billify_embed_*`
- Reload the SEO page — profession prefill is restored, scratch edits are not persisted
- Click "Edit in full-screen" — `/app` opens with the full edited invoice present and persisted to `billify_current`

**Step 5: Commit**

```bash
git add src/components/EmbeddedEditor.tsx src/app/app/page.tsx src/app/app/error.tsx src/hooks/useSubscription.ts
git commit -m "feat(seo): embed-aware editor — namespaced storage, no paywall, lossless full-screen handoff"
```

---

## Task 5: Build the Dynamic Route `[profession]`

**Objective:** Wire up Next.js dynamic route to render one page per profession from the data file.

**Files:**
- Create: `src/app/invoice-template-for/[profession]/page.tsx`

**Implementation:**

```typescript
import { notFound } from 'next/navigation';
import { professions } from '@/data/professions';
import { ProfessionPage } from '@/components/ProfessionPage';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return professions.map(p => ({ profession: p.slug }));
}

// Next.js 14.2.15 passes `params` as a synchronous object.
// (The `params: Promise<...>` + `await params` form is Next 15 — do not use it here.)
export async function generateMetadata(
  { params }: { params: { profession: string } }
): Promise<Metadata> {
  const { profession: slug } = params;
  const p = professions.find(x => x.slug === slug);
  if (!p) return {};
  return {
    title: p.h1,
    description: p.metaDescription,
    alternates: { canonical: `/invoice-template-for/${p.slug}` },
    openGraph: {
      title: p.h1,
      description: p.metaDescription,
      url: `https://billify.me/invoice-template-for/${p.slug}`,
      type: 'article',
      images: [
        {
          url: `https://billify.me/og-images/invoice-template-${p.slug}.png`,
          width: 1200,
          height: 630,
          alt: p.h1,
        },
      ],
    },
  };
}

export default function Page(
  { params }: { params: { profession: string } }
) {
  const { profession: slug } = params;
  const p = professions.find(x => x.slug === slug);
  if (!p) notFound();
  return <ProfessionPage profession={p} />;
}
```

**Acceptance criteria:**
- 30 routes generated at build time
- Each page has unique `<title>` and `<meta description>`
- Unknown slug → 404
- No JavaScript required for content (pure SSG with static HTML copy)

**Verification:**
- Build: `cd /root/projects/invoicepro && npm run build`
- Expected: `✓ Generating static pages (30/30)`
- Output: 30 `.html` files in `dist/invoice-template-for/[slug]/index.html`

**Commit:**
```bash
git add src/app/invoice-template-for/
git commit -m "feat(seo): add dynamic [profession] route for 30 landing pages"
```

---

## Task 6: Add JSON-LD (FAQPage + BreadcrumbList + SoftwareApplication)

**Objective:** Add structured data to profession pages for rich SERP results (FAQ dropdowns, sitelinks, breadcrumb).

**Files:**
- Create: `src/lib/seo.ts` (helper functions)
- Modify: `src/components/ProfessionPage.tsx` (use helpers)

**Helper signature:**

```typescript
// src/lib/seo.ts
export function faqJsonLd(faq: { question: string; answer: string }[]): string;
export function breadcrumbJsonLd(items: { name: string; url: string }[]): string;
export function softwareApplicationJsonLd(): string;
```

**Acceptance criteria:**
- Each profession page has 3 `<script type="application/ld+json">` blocks
- Validate with Google's [Rich Results Test](https://search.google.com/test/rich-results) (paste a live URL after deploy)
- No schema.org validation errors

**Commit:**
```bash
git add src/lib/seo.ts src/components/ProfessionPage.tsx
git commit -m "feat(seo): add FAQ, Breadcrumb, SoftwareApplication JSON-LD"
```

---

## Task 7: Update `sitemap.xml` Generator

**Objective:** Replace the static `public/sitemap.xml` with an auto-generated sitemap that includes all 30 profession pages.

**Files:**
- Create: `src/app/sitemap.ts`
- Delete: `public/sitemap.xml` (no longer needed — Next.js generates it)

**Implementation:**

```typescript
import { MetadataRoute } from 'next';
import { professions } from '@/data/professions';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = 'https://billify.me';
  
  const staticUrls = [
    { url: `${base}/`, lastModified: now, priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${base}/templates`, lastModified: now, priority: 0.8 },
    { url: `${base}/app`, lastModified: now, priority: 0.9 },
  ];
  
  const professionUrls = professions.map(p => ({
    url: `${base}/invoice-template-for/${p.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }));
  
  return [...staticUrls, ...professionUrls];
}
```

**Verification:**
- Build: `npm run build`
- Check `dist/sitemap.xml` contains 34 `<url>` entries (4 static + 30 profession)
- Open in browser: `https://billify.me/sitemap.xml` → all 30 profession URLs present

**Commit:**
```bash
git add src/app/sitemap.ts public/sitemap.xml
git commit -m "feat(seo): auto-generate sitemap with 30 profession pages"
```

---

## Task 8: Add `CrossLinks` Component (Internal Linking)

**Objective:** Show 2–3 related profession pages at the bottom of each profession page. Drives internal link equity and helps users discover more pages.

**Files:**
- Create: `src/components/CrossLinks.tsx`

**Implementation:**

```typescript
import Link from 'next/link';
import { professions } from '@/data/professions';

export function CrossLinks({ slugs }: { slugs: string[] }) {
  const related = slugs
    .map(s => professions.find(p => p.slug === s))
    .filter(Boolean);
  
  return (
    <section className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-semibold mb-4">Related invoice templates</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map(p => (
          <Link
            key={p!.slug}
            href={`/invoice-template-for/${p!.slug}`}
            className="block p-4 border rounded-lg hover:border-primary transition"
          >
            <p className="font-medium">{p!.pluralName}</p>
            <p className="text-sm text-muted-foreground">
              Free {p!.name.toLowerCase()} invoice template
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

**Acceptance criteria:**
- Each profession page shows 2–3 related professions
- Internal links are crawlable (plain `<a>` tags, no `rel="nofollow"`)
- "Related" page titles match profession data

**Commit:**
```bash
git add src/components/CrossLinks.tsx
git commit -m "feat(seo): add CrossLinks component for internal linking"
```

---

## Task 9: Add Internal Links from Existing Pages

**Objective:** Add 1–2 links to profession pages from the existing landing page, pricing page, and templates page. This gives Google a path to discover the new pages without waiting for re-crawl.

**Files:**
- Modify: `src/app/page.tsx` (landing)
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/templates/page.tsx`

**Strategy:** Add a "Browse by profession" section near the bottom of each page with a curated list of 5–8 high-value professions (Electrician, Freelancer, Photographer, Consultant, Plumber).

**Acceptance criteria:**
- Each existing page links to at least 5 profession pages
- Links are crawlable `<a>` tags
- "Browse by profession" section is visible on desktop and mobile
- Does not disrupt existing layout

**Commit:**
```bash
git add src/app/page.tsx src/app/pricing/page.tsx src/app/templates/page.tsx
git commit -m "feat(seo): link existing pages to profession landing pages"
```

---

## Task 10: Generate OG Images (1200×630) for Each Profession

**Objective:** Each profession page should have a unique, programmatically-generated Open Graph image for social sharing (Twitter, LinkedIn, Facebook).

**Files:**
- Create: `scripts/generate-og-images.ts` (Node.js script using `node-canvas` or `@napi-rs/canvas`)

**Implementation:** A simple script that:
1. Loads `professions.ts`
2. For each profession, generates a 1200×630 PNG with:
   - Billify logo
   - Profession name (e.g., "Electrician Invoice Template")
   - Tagline: "Free. No signup. Data stays in browser."
3. Saves to `public/og-images/invoice-template-[slug].png`

**Acceptance criteria:**
- 30 PNG files in `public/og-images/`
- Each is 1200×630 pixels
- File size < 200 KB each
- Visually consistent (same color, font, layout)

**Step 1: Install `@napi-rs/canvas`** (already in Next.js? Check; may need to add)
```bash
cd /root/projects/invoicepro && npm install -D @napi-rs/canvas
```

**Step 2: Write the script**

**Step 3: Run it**
```bash
cd /root/projects/invoicepro && npx tsx scripts/generate-og-images.ts
```
Expected: `✓ Generated 30 OG images in public/og-images/`

**Step 4: Verify OG images are referenced in `generateMetadata`** — `openGraph.images` in `src/app/invoice-template-for/[profession]/page.tsx` already points to `/og-images/invoice-template-[slug].png` (added in Task 5). After generation, confirm each `public/og-images/invoice-template-[slug].png` exists so social shares render a preview.

**Commit:**
```bash
git add scripts/generate-og-images.ts public/og-images/ src/components/ProfessionPage.tsx
git commit -m "feat(seo): generate OG images for 30 profession pages"
```

---

## Task 11: Add Playwright Tests for New Pages

**Objective:** Lock in the new pages with regression tests. All 54 existing tests must still pass.

**Files:**
- Create: `tests/programmatic-seo.spec.ts`

**Test cases:**

1. **All 30 routes return 200** — iterate over `professions` array, hit each URL
2. **Each page has unique H1** — no two profession pages share the same `<h1>`
3. **Each page embeds the editor** — iframe to `/app?embed=true` is present
4. **Each page has JSON-LD** — 3 schema.org blocks (FAQ, Breadcrumb, SoftwareApplication)
5. **Each page links to related professions** — `<a>` tags pointing to `/invoice-template-for/[other-slug]`
6. **Mobile responsive** — at 375px width, no horizontal overflow
7. **No "noindex" tag present** — pages are indexable
8. **Canonical URL is present** — `<link rel="canonical">` matches the current URL
9. **Sitemap contains all 30 URLs** — fetch `/sitemap.xml`, assert 30 profession entries
10. **Meta description length is 150–160 chars** — SEO best practice

**Acceptance criteria:**
- 10 new tests pass
- 54 existing tests still pass (64 total)
- Run: `npx playwright test --project=chromium`
- Expected: `64 passed`

**Commit:**
```bash
git add tests/programmatic-seo.spec.ts
git commit -m "test(seo): add regression tests for 30 profession pages"
```

---

## Task 12: Deploy + Verify Live

**Objective:** Push to `master`, wait for Coolify auto-deploy, verify all 30 pages are live and indexed.

**Files:** (none)

**Step 1: Commit all remaining changes**
```bash
cd /root/projects/invoicepro && git status
# Should be clean
```

**Step 2: Push to master** (the repo's default branch is `master`, not `main`)
```bash
git push origin master
```

**Step 3: Wait for Coolify deploy**
- Coolify webhooks fire on push
- Build takes ~2–3 minutes
- Check Coolify dashboard: app should be "Healthy"

**Step 4: Verify live**

For each profession slug:
```bash
for slug in electrician freelancer photographer; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://billify.me/invoice-template-for/$slug")
  echo "$slug: $status"
done
```
Expected: `electrician: 200`, `freelancer: 200`, `photographer: 200`

**Step 5: Validate one page with Google's tools**
- Open https://search.google.com/test/rich-results?url=https://billify.me/invoice-template-for/electrician
- Expected: 0 errors, FAQ rich result detected

**Step 6: Submit sitemap to Google Search Console**
- Manual: GSC → Sitemaps → Add `https://billify.me/sitemap.xml`
- Expected: "Success" after 1–2 minutes

**Commit:** (none, this is verification only)

---

## Task 13: Submit URLs to Google for Indexing (Optional Speed Boost)

**Objective:** Don't wait 2–4 weeks for Google to crawl. Use Search Console's URL Inspection API to request indexing of all 30 pages immediately.

**Files:**
- Create: `scripts/submit-to-google.ts`

**Implementation:** Uses Google Search Console API + service account. Bulk-submits all 30 profession URLs.

**Note:** Requires GSC API credentials. If not available, skip this task — Google will still discover the pages via the sitemap within 1–2 weeks.

**Acceptance criteria:**
- 30 URLs submitted to GSC API
- All return `200` from the API
- GSC dashboard shows "Discovered → Crawled → Indexed" progress

**Commit (if implemented):**
```bash
git add scripts/submit-to-google.ts
git commit -m "feat(seo): submit 30 URLs to Google Search Console"
```

---

## Task 14: Monitor + Iterate (Post-Launch)

**Objective:** Track which profession pages get indexed, which rank, which convert. Use data to decide which 20+ profession pages to add in the next batch.

**Time:** 2–4 weeks after launch

**Actions:**

1. **GSC Performance report** — filter by URL containing `/invoice-template-for/`
   - Track: impressions, clicks, average position
   - Top 5 performing pages → add similar professions
   - Bottom 5 → rewrite or improve copy

2. **Add Search Console verification in production** — verify the GSC HTML tag is in `<head>`

3. **Analytics** — if/when Plausible/Umami is added, track:
   - Page views per profession
   - Click-through rate on "Create Invoice" CTA
   - "Download PDF" events from embedded editor (cross-origin tracking challenge — may need postMessage)

4. **Quarterly review** — every 3 months, evaluate:
   - Which 5 professions get the most traffic?
   - Which 5 have the highest PDF download rate?
   - Add 10 more professions based on data

**No commits** — this is a monitoring phase.

---

## Test Strategy Summary

| Test type | Tool | Coverage |
|---|---|---|
| Unit | TypeScript compile (`npx tsc --noEmit`) | Type safety on all new files |
| E2E | Playwright (`@playwright/test`) | 10 new tests in `programmatic-seo.spec.ts` |
| SEO | Google Rich Results Test | Manual validation of 1 profession page |
| SEO | Google Search Console | Monitor indexing status |
| Visual | Playwright screenshots | Capture 1 profession page at 1280px + 375px |

**Total: 64 Playwright tests (54 existing + 10 new). All must pass before deploy.**

---

## Risk Register

| Risk | Mitigation |
|---|---|
| **Duplicate content across 30 pages** | Each page has unique copy, unique H1, unique FAQ. Schema.org differentiates them. |
| **Google ignores thin programmatic content** | 600–1,200 words per page, industry-specific, not boilerplate. Manual review for uniqueness. |
| **Embedded iframe hurts SEO** | Iframe is for the *editor*; the page's main content is text. Google indexes the HTML content. |
| **Iframe shares `localStorage`/cookies with `/app` (same origin)** | Embed mode (`embed=true`) namespaces all keys to `billify_embed_*`, short-circuits the subscription flow, skips auto-save, and bypasses both paywall gates — so the iframe never reads or writes the host's `billify_current` / `billify_count_*` / `billify_plan` / `billify_limits` / `billify_sub_token`. See Task 4. |
| **Build size grows with 30 pages** | Estimated: +5 MB raw / +500 KB gzipped. Within Cloudflare's free tier. |
| **OG image generation is slow** | Script runs once at build time, not per-request. ~30 sec total for 30 images. |
| **Patch tool fails on large multi-line blocks** | Use `write_file` for new files; use `patch` only on small targeted edits. Verify every patch with `git diff`. |

---

## Time Estimate

| Task | Effort | Risk |
|---|---|---|
| 1. Data file (5 samples) | 30 min | Low |
| 2. Write 30 profession entries | **4–6 hours** | High (content quality) |
| 3. ProfessionPage component | 1 hour | Low |
| 4. EmbeddedEditor + embed-aware `/app` | 4–6 hours | High (storage namespace, paywall bypass, hydration, handoff) |
| 5. Dynamic route | 30 min | Low |
| 6. JSON-LD helpers | 1 hour | Low |
| 7. Sitemap generator | 15 min | Low |
| 8. CrossLinks component | 30 min | Low |
| 9. Internal links from existing pages | 30 min | Low |
| 10. OG image generation script | 1.5 hours | Medium |
| 11. Playwright tests | 1.5 hours | Low |
| 12. Deploy + verify | 30 min | Medium (wait for build) |
| 13. Submit to GSC (optional) | 30 min | Low |
| 14. Monitor | ongoing | n/a |
| **Total** | **~18–24 hours** | |

---

## Execution Order (Recommended)

1. **Tasks 1–2** in parallel by subagent (data file + copy)
2. **Tasks 3–8** in sequence (build components, wire route, add SEO, sitemap, cross-links)
3. **Task 9** (internal links)
4. **Tasks 10–11** in parallel (OG images + tests)
5. **Task 12** (deploy + verify)
6. **Task 13** (optional, submit to GSC)
7. **Task 14** (monitor)

---

## Success Metrics (90-day)

| Metric | Target |
|---|---|
| Pages indexed by Google | 30/30 (after 30 days) |
| Average Google position for `invoice template for [profession]` queries | <50 |
| Organic clicks from GSC | >100 in first 90 days |
| PDF downloads attributed to profession pages | >50 in first 90 days |
| Bounce rate | <70% (people scroll to editor) |

---

## Future Iterations (Not in This Plan)

- **Tier 4 professions** — country-specific, format-specific, niche industries (after 30 pages indexed and ranking)
- **Comparison pages** — "Billify vs Wave", "Billify vs FreshBooks" (high commercial intent, low KD)
- **Use-case pages** — "Invoice for self-employed", "Invoice for sole trader UK", "Rechnung für Freiberufler" (German)
- **Resource hub** — `/guides/` with long-form content on invoicing best practices (link magnet)
- **Local landing pages** — `/invoice-template-for/[profession]/[city]/` for hyper-local SEO
