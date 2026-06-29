# Billify Feature Roadmap — Gap Analysis & Competitive Leap

**Based on:** 50+ data points from Reddit (r/freelance, r/smallbusiness, r/SaaS, r/SideProject, r/Photography, r/Consulting), G2, Capterra, Product Hunt, and 10+ editorial comparison articles (Zapier, Agiled, Jobbers, Invoicey, eonebill).

**Current state:** Billify has 6/27 of the top-requested invoice tool features. This roadmap closes the gaps in priority order — highest user demand first, filtered by what's feasible within the privacy-first/no-signup constraint.

---

## Competitive Landscape Summary

| Competitor | Strength | Weakness | Signup Required |
|---|---|---|---|
| **invoice-generator.com** (2M/mo) | Brand dominance, payment processing fees | No templates, US-centric, boring UI | No (but to save) |
| **Invoice Simple** (240K/mo) | 200+ programmatic SEO pages | Generic templates, upsell-heavy | Yes |
| **Wave** (massive) | Full accounting suite | US/CA/UK/Ireland only, account freezes | Yes |
| **Zoho Invoice** | 160+ currencies, full features | Ecosystem lock-in, complex UI | Yes |
| **FreshBooks** ($19/mo+) | Time tracking → invoice | Price hikes, deletes data on cancel | Yes |
| **Invoice Ninja** ($10/mo) | Open source, self-hostable | Branding removal costs $10/mo | Yes |
| **Stripe Invoicing** | Payment-first, developer-friendly | Not an invoice *generator*, it's a billing API | Yes |

**Billify's unique position:** The ONLY invoice generator that is (a) no-signup, (b) privacy-first (data never leaves browser), (c) has 12 beautiful templates, and (d) is free. No competitor matches all four. The moat is privacy + simplicity.

---

## Gap Analysis: What Users Want vs What Billify Has

### What Billify Already Nails (Keep These)

These are top-10 features where Billify is already competitive or winning:

| Feature | Billify Status | Competitive Position |
|---|---|---|
| PDF export, no watermark | ✅ Done | **Better than Invoice Ninja** ($10/mo to remove branding) |
| No signup required | ✅ Done | **Moat** — only major generator with this |
| 12 templates | ✅ Done | Competitive (Invoice Simple has ~5, Wave has ~3) |
| Logo upload | ✅ Done | Parity with paid tools |
| Auto-save | ✅ Done | Better than invoice-generator.com (no persistence at all) |
| Privacy-first | ✅ Done | **Unique** — no competitor offers this |

### Where Billify Is Losing Deals

These are features that make users choose competitors over Billify. Ordered by deal-breaker severity × implementation feasibility:

| Gap | User Demand | Why Users Leave | Difficulty |
|---|---|---|---|
| **Only 3 currencies** (USD/EUR/GBP) | DEAL-BREAKER for intl. | "I invoice in AUD/CAD/INR and this tool doesn't support it" | **Trivial** — add to array |
| **Tax handling is bare** (flat %, no labels) | DEAL-BREAKER for EU/UK/AU | "No VAT number field, no GST label, no reverse-charge" | **Medium** — UI + types |
| **No discount support** | HIGH (ranked #3 in auto-calc) | "I offer 10% early-bird discount and can't show it" | **Trivial** — add field |
| **No auto-numbering** | HIGH (legal requirement in many countries) | "I have to remember my last invoice number" | **Easy** — localStorage counter |
| **No per-item tax** | MEDIUM-HIGH | "Some items are taxable, some exempt (EU/UK)" | **Medium** — per-item tax rate |
| **No custom fields** (PO number, tax ID) | HIGH (ranked #17) | "Clients require a PO number on every invoice" | **Easy** — add to Invoice type |
| **No invoice status tracking** | DEAL-BREAKER (ranked #7) | "I don't know which invoices are paid vs overdue" | **Easy** — localStorage status field |
| **No offline/PWA** | MEDIUM | "I want to use it on my phone without wifi" | **Medium** — manifest + service worker |

---

## Roadmap

### Phase 1: Close the Trivial Gaps (1–2 days)

These are features where Billify is losing users for **no good reason** — the effort is minimal.

#### 1.1 — Expand Currency Support (30 min)

**What:** Add 15+ currencies. The currency list is hardcoded at `src/types/index.ts:36`:
```typescript
export const currencies = ['USD', 'EUR', 'GBP'] as const;
```

**Add:** AUD, CAD, CHF, CNY, DKK, HKD, INR, JPY, MXN, NOK, NZD, PLN, SEK, SGD, ZAR

**Also add symbols** for all above. Research shows 160+ currencies is ideal (Zoho's selling point), but 18 covers 95% of freelancer needs.

**Files:** `src/types/index.ts` (currencies + currencySymbol/currencyFormatter)

#### 1.2 — Add Discount Support (1 hour)

**What:** Add a discount field (percentage or fixed amount) to the invoice. Applied after subtotal, before tax.

**UI:** Add to the "Extras" card, next to Tax Rate:
- Discount: [input] [% or $ toggle]

**Calculation order:** Subtotal → Discount → Tax → Total

**Files:** `src/types/index.ts` (add `discount` + `discountType: 'percentage' | 'fixed'` to Invoice), `src/app/app/page.tsx` (UI + calculation), `src/lib/pdf.ts` (PDF rendering)

#### 1.3 — Auto Invoice Numbering (1 hour)

**What:** On "New" button click, auto-increment from the last used number stored in localStorage.

**Logic:** Read `billify_invoice_counter` from localStorage. If present, next invoice = `INV-{counter + 1}`. If not, start at `INV-1001`. User can still override manually.

**Files:** `src/app/app/page.tsx` (read/write counter on create), `src/types/index.ts` (helper function)

#### 1.4 — Custom Fields (PO Number + Tax ID) (1 hour)

**What:** Add two optional fields to the invoice:
- **PO Number** — "Purchase Order #" (clients require this)
- **Tax ID** — "VAT/GST/ABN/Company #" (legal requirement in many countries)

Display in the invoice header area (near From/To fields). Render in PDF.

**Files:** `src/types/index.ts` (add fields to CompanyInfo or Invoice), `src/app/app/page.tsx` (inputs), `src/lib/pdf.ts` (render)

#### 1.5 — Tax Handling Upgrade (2 hours)

**What:** Replace the bare `taxRate: number` with a proper tax configuration:

```typescript
interface TaxConfig {
  label: string;         // "VAT", "GST", "Sales Tax", "MwSt"
  rate: number;          // 20, 19, 10, 0
  taxId: string;         // Seller's VAT/GST registration number
  buyerTaxId: string;    // Buyer's VAT ID (for reverse-charge)
  reverseCharge: boolean; // EU B2B cross-border
}
```

**UI:** Replace the single "Tax Rate (%)" input with:
- Tax label dropdown: [Sales Tax / VAT / GST / MwSt / Custom]
- Rate: [input]%
- Tax ID: [input] (shown on invoice as "VAT No: GB123456789")
- Reverse charge checkbox (adds "Reverse Charge" notation to PDF)

**Country presets:** Selecting "VAT" auto-suggests 20% (UK), 19% (DE), 21% (FR), etc.

**Files:** `src/types/index.ts`, `src/app/app/page.tsx`, `src/lib/pdf.ts`, `src/components/SubscriptionManager.tsx` (if limits reference tax)

---

### Phase 2: Win Features Nobody Else Has (1–2 weeks)

These features exploit Billify's privacy-first moat. No competitor can copy them without breaking their server-dependent business model.

#### 2.1 — Invoice Status Tracking (localStorage) (3 hours)

**What:** Track the lifecycle of each invoice: draft → sent → paid → overdue.

**How (privacy-first):** Since there's no backend, status is stored in localStorage. The user manually marks an invoice as sent/paid. This sounds limiting, but it's exactly what users want from a *simple* tool — they don't need server-side tracking, they need a visual indicator.

**Data model:**
```typescript
interface InvoiceRecord {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paidDate?: string;
}
```

Store as `billify_history` — an array of InvoiceRecord objects. When the user downloads a PDF, auto-create/update the record as "sent".

**UI:** Add an "Invoices" tab/section showing a table of all invoices with status badges. Click to load any invoice back into the editor. Filter by status.

**Competitive advantage:** This is invoice *management* without a server. Wave/FreshBooks/Zoho all require accounts for this feature. Billify does it in your browser.

**Files:** New component `InvoiceHistory.tsx`, `src/types/index.ts` (InvoiceRecord type), `src/app/app/page.tsx` (history integration)

#### 2.2 — Payment Reminder Templates (2 hours)

**What:** Generate copy-paste email/SMS scripts for chasing overdue invoices. No sending — just the text.

**Research insight:** "A SaaS that ONLY does automated invoice reminders makes $14K/month." The #1 thing freelancers hate is chasing payments. Billify can't send emails (no backend), but it CAN generate the perfect reminder text.

**How:** For each overdue invoice, generate escalating reminder templates:
- **Day 1 (friendly):** "Hi [Client], just a friendly reminder that invoice #[N] for [amount] was due on [date]..."
- **Day 7 (firm):** "Hi [Client], following up on invoice #[N]..."
- **Day 14 (final):** "Hi [Client], this is my final reminder for invoice #[N]..."

**UI:** A "Reminders" button next to each overdue invoice in the history table. Click → modal with copy-paste email text, pre-filled with invoice data.

**Competitive advantage:** Every other tool charges $10-30/mo for automated reminders. Billify gives the *text* for free. The user copies it into their email client — zero infrastructure, zero data sharing.

**Files:** New component `ReminderTemplates.tsx`, `src/lib/reminder-templates.ts`

#### 2.3 — Client Directory (localStorage) (2 hours)

**What:** Save client details for quick re-invoicing. No more re-typing names and addresses.

**Data model:**
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  defaultCurrency?: string;
}
```

Store as `billify_clients` — array of Client objects.

**UI:** When filling the "To (Client)" section, show a dropdown of saved clients. Selecting one auto-fills all fields. "Save this client" checkbox on first entry.

**Competitive advantage:** This is what makes users return to Billify instead of using invoice-generator.com every time. The tool *remembers* their clients without requiring an account.

**Files:** `src/types/index.ts` (Client type), `src/app/app/page.tsx` (client dropdown + save), new hook `useClients.ts`

#### 2.4 — PWA / Offline Support (3 hours)

**What:** Install Billify as an app. Use it offline. Works on phones.

**How:** Add `manifest.json` + a minimal service worker that caches the static assets.

**Research insight:** "Works completely offline / privacy-first" is explicitly requested. A PWA install on a freelancer's phone home screen is a moat — it's faster than opening a browser to a competitor.

**Files:** `public/manifest.json`, `public/sw.js`, `src/app/layout.tsx` (link manifest)

#### 2.5 — Multi-Language Invoices (2 hours)

**What:** Let the user select the invoice language — the labels (From, To, Description, Quantity, Rate, Amount, Subtotal, Tax, Total, Notes, Terms) render in the selected language.

**Languages:** English, German, French, Spanish, Italian, Dutch, Portuguese, Polish.

**Why:** EU freelancers often invoice in their client's language. No free invoice tool offers this.

**Files:** `src/types/index.ts` (language field + label maps), `src/lib/pdf.ts` (use labels), `src/app/app/page.tsx` (language selector)

---

### Phase 3: Monetization & Growth (2–4 weeks)

These features require infrastructure but directly drive revenue. They're worth the complexity.

#### 3.1 — Pro Tier Expansion: Invoice History + Client Directory

**What:** Gate Phase 2 features behind the existing Pro tier.

- **Free:** Create invoices, download PDF, 3/month, basic templates
- **Pro (€9/mo):** Unlimited invoices + all templates + logo + **invoice history + status tracking + client directory + payment reminders + multi-language + PWA**

**Why:** The research shows the #1 free→paid trigger is hitting volume caps and needing management features (status, history, recurring). The invoice history and client directory ARE the reason to pay.

#### 3.2 — Online Payment Links (Stripe Payment Links)

**What:** Generate a Stripe Payment Link for each invoice. Include the link in the PDF or email.

**How:** Use Stripe Payment Links (no backend needed — the link is created via Stripe API at invoice creation time). The freelancer's Stripe account receives the payment; Billify never touches the money.

**Why:** "Can clients pay online?" is the #9 most-requested feature. This adds it without building a payment gateway.

**Files:** New API route or client-side Stripe.js integration, PDF link embedding

#### 3.3 — Recurring Invoice Templates (Pro)

**What:** Save an invoice as a "recurring template" with a schedule (weekly/monthly). Billify reminds the user when it's time to generate and send.

**Why:** 50% of freelancers use retainers. Recurring invoices is #10 most-requested.

**Constraint:** Without a backend, this can't auto-send. But it CAN auto-generate the invoice text on schedule and show a notification "Your monthly retainer invoice for [Client] is ready — download and send."

**Files:** New component `RecurringTemplates.tsx`, localStorage-based scheduler + `Notification API`

#### 3.4 — Quote/Estimate → Invoice Conversion (Pro)

**What:** Create a quote (same UI as invoice, labeled "Quote"). When the client accepts, one-click convert to an invoice with sequential numbering.

**Why:** #14 most-requested. Nearly all paid tools have this.

**Files:** New document type `Quote`, conversion function, status tracking integration

---

### Phase 4: Leapfrog Features (1–3 months)

These features don't exist in any free invoice generator. They would make Billify the best tool in the market, period.

#### 4.1 — AI-Assisted Invoice Creation

**What:** Natural language invoice creation. Type "12 hours of web development for Acme Corp at $150/hr" and the line items auto-populate.

**How:** Use a lightweight LLM (or even regex parsing for common patterns) to parse free text into structured invoice data.

**Why:** "I wish my invoice tool could just let me type what I did and figure it out." This is a walled-garden feature — competitors would need to add AI infrastructure.

#### 4.2 — Smart Tax Detection

**What:** Enter the client's country → Billify auto-applies the correct VAT/GST rate and label. Handles reverse-charge for EU B2B automatically.

**Why:** #1 unmet international need. No invoice tool does this well. "Automatically detect client's country and apply correct VAT rate" is explicitly requested.

**How:** Static lookup table of countries → tax rules. No API needed. ~200 lines of data.

#### 4.3 — UBL/XML Export (EU Compliance)

**What:** Export invoices in Universal Business Language (UBL) XML format alongside the PDF. Required for e-invoicing in Italy, France, and growing across the EU.

**Why:** EU e-invoicing is becoming mandatory country by country. This is a future-proofing moat. 3+ explicit requests, zero free tools offer it.

**Files:** `src/lib/ubl.ts` (UBL XML generator)

#### 4.4 — Dashboard with Insights

**What:** A simple dashboard showing:
- Total invoiced this month/year
- Outstanding (unpaid) amount
- Average days to payment
- Revenue by client chart
- Simple bar chart of monthly revenue

**Why:** Freelancers want business insights but don't need full accounting. This is the "killer feature" that turns a one-off tool into a daily-use app.

**Constraint:** All data from localStorage. Zero backend. Charts can be rendered with a lightweight charting library or even pure CSS bars.

---

## Priority Matrix

```
HIGH IMPACT
    │
    │   ┌─────────────────┐  ┌──────────────────┐
    │   │ Currency Expand │  │ Invoice Status   │
    │   │ Discount Field  │  │ Tracking         │
    │   │ Auto-Numbering  │  │ Client Directory │
    │   │ Custom Fields   │  │ Payment Reminders│
    │   │ Tax Upgrade     │  │ PWA              │
    │   └────────┬────────┘  └────────┬─────────┘
    │            │ LOW EFFORT          │ MEDIUM EFFORT
    │   ┌────────┴────────┐  ┌────────┴─────────┐
    │   │ Multi-Language  │  │ Online Payments  │
    │   │                 │  │ Recurring Templates│
    │   │                 │  │ Quote→Invoice    │
    │   │                 │  │ Dashboard        │
    │   └─────────────────┘  └──────────────────┘
    │            │                    │
    │   ┌─────────────────┐  ┌──────────────────┐
    │   │                 │  │ AI Invoice Create│
    │   │                 │  │ Smart Tax Detect │
    │   │                 │  │ UBL/XML Export   │
    │   └─────────────────┘  └──────────────────┘
    │
LOW │____________________________________________
IMPACT    LOW EFFORT              HIGH EFFORT
```

---

## What NOT to Build

These are traps that would dilute Billify's positioning:

| Feature | Why NOT | Source |
|---|---|---|
| Full accounting suite | Competes with QuickBooks/Xero — they win. | "Don't build a CRM, time tracker, expense management, accounting suite" |
| Time tracking | Niche segment (40-50%), high complexity, Harvest owns it | Segment-specific, not universal |
| Expense tracking | "Nice to have" for a generator, not core | Users want it integrated but lightweight — out of scope |
| CRM / client management DB | Different product entirely | Scope creep |
| Email sending infrastructure | Kills privacy-first positioning | Would require backend, user data storage |
| Bank feeds / reconciliation | Accounting feature, not invoicing | Different market |
| Team collaboration / multi-user | Requires accounts, auth, permissions | Breaks no-signup moat |

---

## Success Metrics

| Phase | Metric | Target |
|---|---|---|
| Phase 1 | Feature parity with top 10 free generators | 10/10 must-haves |
| Phase 2 | Daily active users (not just one-off visitors) | 30% of PDF downloaders return within 7 days |
| Phase 3 | Free → Pro conversion rate | 3-5% (industry benchmark) |
| Phase 3 | MRR | €500/mo after 6 months |
| Phase 4 | "Best free invoice tool" mentions on Reddit/PH | 5+ organic mentions in 6 months |

---

## Implementation Notes

- **All Phase 1 features** are pure client-side — no backend, no API, no server. Fits the privacy-first constraint.
- **Phase 2 features** use localStorage — the "database" is the user's browser. This is the moat: every feature competitors charge $10-30/mo for, Billify does for free, in-browser.
- **Phase 3** introduces the first server-dependent features (payment links). These are optional — the core tool remains server-free.
- **Phase 4** features are differentiators that no free competitor can match without significant engineering investment.
- **Existing tests must not break.** Every feature ships with Playwright tests.
