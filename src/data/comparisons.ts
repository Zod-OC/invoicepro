// Programmatic-SEO "X alternative" comparison cluster. Targets competitor-brand
// queries Billify can legitimately appear in ("Wave alternatives free no signup",
// "Invoice Ninja alternative", "Zoho Invoice alternative") — high commercial
// intent, lower keyword difficulty than the saturated "invoice generator" SERPs.
//
// Honesty is load-bearing here: every page states Billify's real limits (3
// invoices/mo free, invoicing-only — no double-entry books) AND when the
// competitor is the better pick. The marketing-claims discipline (no "only",
// "best", fabricated features) applies. Competitor facts are drawn from the
// verified growth-audit matrix; re-check them quarterly.

export interface ComparisonRow {
  feature: string;
  billify: string;
  target: string;
}

export interface Comparison {
  /** URL slug, e.g. "wave-alternatives". */
  slug: string;
  /** Competitor display name, e.g. "Wave". */
  target: string;
  h1: string;
  metaDescription: string;
  /** 70–110 word lede. */
  introParagraph: string;
  /** Billify's honest differentiator (1–2 sentences). */
  billifyAngle: string;
  /** When the competitor is the better pick (honesty + trust). */
  honestTradeoff: string;
  rows: ComparisonRow[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
}

export const COMPARISON_DATA_UPDATED_AT = '2026-07-20';

export const COMPARISONS: Comparison[] = [
  {
    slug: 'invoice-ninja-alternative',
    target: 'Invoice Ninja',
    h1: 'Free Invoice Ninja Alternative — No Signup, No Client Limit to Start',
    metaDescription:
      'Free Invoice Ninja alternative. Billify needs no account and lets you invoice immediately in your browser — compare free-tier limits, currencies, and privacy.',
    introParagraph:
      'Invoice Ninja is a powerful, full-featured invoicing platform — and that complexity (plus the account and the 5-client free-tier cap) is overkill if you just need to send a clean invoice now. Billify is the no-signup alternative: no account, no client cap to get started, and your data stays in your browser. Here\'s the honest comparison.',
    billifyAngle:
      'Open Billify, pick a template, fill in the invoice, and download a PDF or CSV in under a minute — no account, no onboarding. 160 currencies, 12 templates, and a built-in client directory for repeat clients.',
    honestTradeoff:
      'Invoice Ninja is the better pick if you need recurring billing, time-tracking, proposals, client portals, or enterprise e-invoicing (UBL/PEPPOL) at scale. Billify intentionally stays simple — invoicing-only, no subscriptions engine.',
    rows: [
      { feature: 'Account required', billify: 'No — open and go', target: 'Yes (free account)' },
      { feature: 'Free tier', billify: '3 invoices/month, 2 templates', target: 'Up to 5 clients, unlimited invoices' },
      { feature: 'Currencies', billify: '160', target: 'Multiple' },
      { feature: 'Invoice templates', billify: '12', target: 'Several' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Invoice Ninja\'s servers (or self-hosted)' },
      { feature: 'Recurring billing / subscriptions', billify: 'No', target: 'Yes' },
      { feature: 'Time tracking & proposals', billify: 'No', target: 'Yes' },
      { feature: 'Enterprise e-invoicing (UBL/PEPPOL)', billify: 'No', target: 'Yes (Enterprise tier)' },
      { feature: 'Paid plan', billify: 'Pro €9/mo', target: 'Pro $14/mo, Enterprise $18+/mo' },
    ],
    faq: [
      {
        question: 'Is Billify really no-signup?',
        answer:
          'Yes — no account, no email, no credit card to create and download invoices. You only pay (€9/mo Pro) if you want unlimited invoices, all 12 templates, and logo upload.',
      },
      {
        question: 'How is Billify different from Invoice Ninja?',
        answer:
          'Billify is browser-only invoicing with zero setup; Invoice Ninja is a full invoicing platform with recurring billing, time tracking, and client portals. Pick Billify for speed and privacy, Invoice Ninja for billing workflows.',
      },
      {
        question: 'Does Billify store my invoice data?',
        answer:
          'Only in your browser\'s local storage — never on a server. You can back everything up to a single JSON file and clear it anytime.',
      },
    ],
    relatedSlugs: ['wave-alternatives', 'zoho-invoice-alternative', 'freshbooks-alternative'],
  },
  {
    slug: 'freshbooks-alternative',
    target: 'FreshBooks',
    h1: 'Free FreshBooks Alternative — No Account, No Monthly Fee',
    metaDescription:
      'Free FreshBooks alternative. Billify needs no signup and costs nothing — build and download invoice PDFs in your browser. Honest feature comparison vs FreshBooks $23–$70/mo plans.',
    introParagraph:
      'FreshBooks is one of the most polished accounting-and-invoicing platforms for freelancers and small businesses — and at $23–$70/month it is a serious commitment. If you just need to send a clean, professional invoice without a subscription, an account, or an onboarding flow, Billify is the free, no-signup alternative. Here is the honest comparison, including where FreshBooks is clearly the better tool.',
    billifyAngle:
      'Open Billify, choose from 12 templates, fill in the invoice, and download a PDF in under a minute — no account, no credit card, no monthly fee. 160 currencies, automatic tax calculation, logo upload on Pro, and your invoice data never leaves your browser.',
    honestTradeoff:
      'FreshBooks is the stronger pick if you need a full accounting workflow: double-entry books, expense tracking with receipt scanning, time tracking, estimates and proposals, recurring billing, payment processing, and payroll. Billify is invoicing-only by design — it does not replace accounting software, and never pretends to.',
    rows: [
      { feature: 'PDF export', billify: 'Yes — instant, in-browser', target: 'Yes' },
      { feature: 'Invoice templates', billify: '12', target: 'A few, customizable' },
      { feature: 'Multi-currency', billify: '160 currencies', target: 'Yes (multi-currency support)' },
      { feature: 'Tax calculation', billify: 'Automatic per-line and per-invoice', target: 'Automatic sales tax' },
      { feature: 'Logo upload', billify: 'Yes (Pro)', target: 'Yes' },
      { feature: 'Signup required', billify: 'No — open the page and start', target: 'Yes (account + onboarding)' },
      { feature: 'Mobile-friendly', billify: 'Yes (responsive web)', target: 'Yes (iOS + Android apps)' },
      { feature: 'API', billify: 'No', target: 'Yes (REST API)' },
      { feature: 'Integrations', billify: 'None (standalone by design)', target: '100+ (banking, CRM, payroll, Zapier)' },
      { feature: 'Monthly cost', billify: 'Free (3 invoices/mo) · Pro €9/mo', target: '$23–$70/mo (Lite–Premium)' },
      { feature: 'Where your data lives', billify: 'In your browser — never on a server', target: 'On FreshBooks servers' },
    ],
    faq: [
      {
        question: 'Is Billify a good FreshBooks replacement?',
        answer:
          'Only for invoicing. If you send invoices and want them gone fast and free, Billify does that better. FreshBooks is a full accounting suite — expense tracking, time tracking, reports, payroll — that Billify does not try to replace.',
      },
      {
        question: 'How much does FreshBooks actually cost?',
        answer:
          'FreshBooks runs $23/mo (Lite, 5 billable clients), $43/mo (Plus, 50 clients), and $70/mo (Premium, unlimited clients) when billed monthly. A 90%-off promo is common for the first 6 months, but the standard price is what renews. Billify is free for 3 invoices a month, or €9/mo for unlimited.',
      },
      {
        question: 'Can I use Billify without an account?',
        answer:
          'Yes. No email, no password, no credit card. You build and download invoices directly in your browser; the data stays in local storage and never touches a server.',
      },
    ],
    relatedSlugs: ['quickbooks-alternative', 'wave-alternatives', 'zoho-invoice-alternative'],
  },
  {
    slug: 'wave-alternatives',
    target: 'Wave',
    h1: 'Free Wave Alternatives — No Signup, Available Worldwide',
    metaDescription:
      'Free Wave alternatives for invoicing. Billify needs no account and works in any country — generate and download invoices in your browser. Compare features and limits.',
    introParagraph:
      'Wave\'s free invoicing is popular, but it\'s restricted to a handful of countries (US, Canada, UK, Ireland, Australia) and requires an account. If you\'re a freelancer outside those regions, or you just want to send an invoice without creating an account and handing over your data, here\'s how Billify compares — and where Wave is still the stronger pick.',
    billifyAngle:
      'Billify is the no-signup, no-storage alternative: open the page, build the invoice, download a PDF or CSV. It works in every country, supports 160 currencies, and your invoice data never leaves your browser.',
    honestTradeoff:
      'If you need double-entry bookkeeping, bank reconciliation, receipts, or payroll, Wave (or a full accounting suite) is the better choice — Billify is invoicing-only by design. Use Billify to bill fast; use Wave to run the books.',
    rows: [
      { feature: 'PDF export', billify: 'Yes — instant, in-browser', target: 'Yes' },
      { feature: 'Invoice templates', billify: '12', target: 'A few' },
      { feature: 'Multi-currency', billify: '160 currencies', target: '≈ 60 currencies' },
      { feature: 'Tax calculation', billify: 'Automatic per-line and per-invoice', target: 'Yes (sales tax)' },
      { feature: 'Logo upload', billify: 'Yes (Pro)', target: 'Yes' },
      { feature: 'Signup required', billify: 'No', target: 'Yes (free account)' },
      { feature: 'Mobile-friendly', billify: 'Yes (responsive web)', target: 'Yes (iOS + Android)' },
      { feature: 'API', billify: 'No', target: 'Limited' },
      { feature: 'Integrations', billify: 'None (standalone)', target: 'Banking, receipts, payments' },
      { feature: 'Monthly cost', billify: 'Free (3 invoices/mo) · Pro €9/mo', target: 'Free Starter · Pro $16/mo' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Wave\'s servers' },
      { feature: 'Country availability', billify: 'Worldwide', target: 'US, Canada, UK, Ireland, Australia' },
      { feature: 'Double-entry accounting / bank rec', billify: 'No (invoicing only)', target: 'Yes' },
    ],
    faq: [
      {
        question: 'Is Billify really free with no account?',
        answer:
          'Yes. You can build and download invoices (PDF or CSV) without creating an account or entering an email. The free tier covers 3 invoices a month with 2 templates and no watermark.',
      },
      {
        question: 'Why would I pick Billify over Wave?',
        answer:
          'If you\'re outside Wave\'s supported countries, don\'t want an account, or want your invoice data to stay in your browser, Billify is the simpler choice. Wave is stronger if you need full bookkeeping.',
      },
      {
        question: 'Can I move from Wave to Billify?',
        answer:
          'Easily for new invoices — there\'s nothing to migrate since Billify has no account. For past invoices, recreate them in Billify or keep Wave as an archive.',
      },
    ],
    relatedSlugs: ['freshbooks-alternative', 'invoice-ninja-alternative', 'zoho-invoice-alternative'],
  },
  {
    slug: 'invoice-simple-alternative',
    target: 'Invoice Simple',
    h1: 'Invoice Simple Alternative — Free, No App Install, No Account',
    metaDescription:
      'Invoice Simple alternative. Billify is a free web invoice generator — no app to install, no account, works in any browser. Compare free tiers, templates, and mobile features.',
    introParagraph:
      'Invoice Simple is a polished, mobile-first invoicing app with native iOS and Android apps and 60+ templates. But it still requires an account, and even the paid Essentials plan caps you at 3 invoices a month. If you want the same instant, no-fuss invoicing without an app download or a login, Billify is the web-based, no-signup alternative. Here is how they actually compare.',
    billifyAngle:
      'No app to install, no account to create — open billify.me in any browser (phone or laptop), build the invoice, download a PDF. 12 templates, 160 currencies, automatic tax, and your data never leaves the browser.',
    honestTradeoff:
      'Invoice Simple is the better pick if you live on your phone and want a dedicated native app with offline drafts, push notifications for payment reminders, and built-in payment processing. Billify is a web tool by design — faster to start, but lighter on mobile-native features.',
    rows: [
      { feature: 'PDF export', billify: 'Yes — instant, in-browser', target: 'Yes' },
      { feature: 'Invoice templates', billify: '12', target: '60+' },
      { feature: 'Multi-currency', billify: '160 currencies', target: 'Multiple' },
      { feature: 'Tax calculation', billify: 'Automatic per-line and per-invoice', target: 'Yes' },
      { feature: 'Logo upload', billify: 'Yes (Pro)', target: 'Yes' },
      { feature: 'Signup required', billify: 'No', target: 'Yes (account)' },
      { feature: 'Mobile-friendly', billify: 'Yes (responsive web)', target: 'Yes (native iOS + Android apps)' },
      { feature: 'API', billify: 'No', target: 'No' },
      { feature: 'Integrations', billify: 'None (standalone)', target: 'Online payments, accounting sync' },
      { feature: 'Monthly cost', billify: 'Free (3 invoices/mo) · Pro €9/mo', target: 'Free (3 invoices/mo) · Essentials $6.99/mo' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Invoice Simple servers + device' },
    ],
    faq: [
      {
        question: 'Is Billify free like Invoice Simple?',
        answer:
          'Both have a free tier of 3 invoices a month. The difference is Billify needs no account, no app download, and no email — you invoice straight from the browser. Invoice Simple requires a login and app install.',
      },
      {
        question: 'Does Billify have a mobile app?',
        answer:
          'No native app — but Billify is fully responsive and works in any mobile browser, so there is nothing to install. Invoice Simple\'s strength is its dedicated native iOS/Android apps with offline drafts.',
      },
      {
        question: 'Which has more templates?',
        answer:
          'Invoice Simple offers 60+ templates; Billify has 12 polished designs (2 free, 10 on Pro). Billify trades raw template count for speed and privacy.',
      },
    ],
    relatedSlugs: ['wave-alternatives', 'zoho-invoice-alternative', 'freshbooks-alternative'],
  },
  {
    slug: 'stripe-invoicing-alternative',
    target: 'Stripe Invoicing',
    h1: 'Stripe Invoicing Alternative — No Code, No Account, Free PDF',
    metaDescription:
      'Stripe Invoicing alternative. Billify needs no developer setup, no Stripe account, and no per-invoice fee — generate invoice PDFs free in your browser. Compare features and use cases.',
    introParagraph:
      'Stripe Invoicing is a powerful, API-first billing engine built for developers and SaaS companies that collect payments programmatically. It charges 0.4% per paid invoice (Starter) or 0.5% capped at $2 (Plus), on top of card processing fees. If you do not need a payment backend and just want to produce a clean invoice PDF — no API keys, no code, no account — Billify is the free, no-setup alternative. Here is the honest comparison.',
    billifyAngle:
      'Zero setup, zero code. Open Billify, fill in the invoice, download the PDF. No Stripe account, no webhook endpoints, no per-invoice fee, no payment-processing cut. 12 templates, 160 currencies, automatic tax — all in the browser.',
    honestTradeoff:
      'Stripe Invoicing is the right choice if you are collecting money, not just producing documents: hosted invoice pages, automatic card charging, subscription/recurring billing, smart payment retries, reconciliation, and a full developer API. Billify creates invoices; it does not collect or reconcile payments. If you need to get paid online, use Stripe.',
    rows: [
      { feature: 'PDF export', billify: 'Yes — instant, in-browser', target: 'Yes (hosted + PDF)' },
      { feature: 'Invoice templates', billify: '12', target: 'Programmatic / branded host' },
      { feature: 'Multi-currency', billify: '160 currencies', target: '135+ currencies' },
      { feature: 'Tax calculation', billify: 'Automatic per-line and per-invoice', target: 'Stripe Tax add-on (0.5%)' },
      { feature: 'Logo upload', billify: 'Yes (Pro)', target: 'Yes (branding on hosted page)' },
      { feature: 'Signup required', billify: 'No', target: 'Yes (Stripe account + verification)' },
      { feature: 'Mobile-friendly', billify: 'Yes (responsive web)', target: 'Yes (dashboard + API)' },
      { feature: 'API', billify: 'No', target: 'Yes (full REST API + webhooks)' },
      { feature: 'Integrations', billify: 'None (standalone)', target: 'Extensive (payments, subscriptions, tax)' },
      { feature: 'Monthly cost', billify: 'Free (3 invoices/mo) · Pro €9/mo', target: '0.4–0.5% per paid invoice + card fees' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Stripe servers' },
      { feature: 'Collects payments online', billify: 'No (document only)', target: 'Yes' },
    ],
    faq: [
      {
        question: 'Is Billify a Stripe replacement?',
        answer:
          'No — they solve different problems. Stripe collects money (card charges, subscriptions, reconciliation). Billify produces invoice PDFs with no setup. Many users run both: Stripe to collect payment, Billify (or any generator) for quick one-off documents.',
      },
      {
        question: 'Does Billify have an API?',
        answer:
          'No. Billify is a browser tool, not a billing platform. If you need to generate invoices programmatically or charge cards automatically, Stripe Invoicing is purpose-built for that.',
      },
      {
        question: 'Why would I use Billify instead of Stripe?',
        answer:
          'When you just need an invoice document — a PDF to email or print — and do not need payment collection, webhooks, or code. Billify is instant and free; Stripe is infrastructure that takes setup.',
      },
    ],
    relatedSlugs: ['freshbooks-alternative', 'quickbooks-alternative', 'wave-alternatives'],
  },
  {
    slug: 'quickbooks-alternative',
    target: 'QuickBooks',
    h1: 'QuickBooks Alternative for Invoicing — Free, No Account, No Suite',
    metaDescription:
      'QuickBooks alternative for invoicing. Billify is free, needs no account, and just makes invoice PDFs — no $19+/mo accounting suite. Honest comparison of features and cost.',
    introParagraph:
      'QuickBooks Online is the market-leading small-business accounting suite — double-entry books, bank reconciliation, payroll, inventory, mileage, 1099s, tax prep — starting at $19/month (promotional) and climbing to $275/month for Advanced. If you only need to send an invoice, that is enormous overkill in both cost and complexity. Billify is the free, no-signup, invoicing-only alternative. Here is the honest head-to-head.',
    billifyAngle:
      'No account, no subscription, no learning curve. Open Billify, pick a template, fill in the invoice, download the PDF. 12 templates, 160 currencies, automatic tax — all in the browser, with your data never leaving it.',
    honestTradeoff:
      'QuickBooks is the right tool if you are running a real business ledger: bank feeds and reconciliation, profit & loss and balance sheet, payroll, inventory tracking, sales tax across jurisdictions, and CPA collaboration. Billify is invoicing-only and does none of that. If you need books, use QuickBooks; if you need an invoice, Billify is faster and free.',
    rows: [
      { feature: 'PDF export', billify: 'Yes — instant, in-browser', target: 'Yes' },
      { feature: 'Invoice templates', billify: '12', target: 'Several, customizable' },
      { feature: 'Multi-currency', billify: '160 currencies', target: 'Yes (multi-currency)' },
      { feature: 'Tax calculation', billify: 'Automatic per-line and per-invoice', target: 'Advanced sales tax (US/CA/UK)' },
      { feature: 'Logo upload', billify: 'Yes (Pro)', target: 'Yes' },
      { feature: 'Signup required', billify: 'No', target: 'Yes (account + company setup)' },
      { feature: 'Mobile-friendly', billify: 'Yes (responsive web)', target: 'Yes (iOS + Android apps)' },
      { feature: 'API', billify: 'No', target: 'Yes (QuickBooks API)' },
      { feature: 'Integrations', billify: 'None (standalone)', target: '700+ (banking, payroll, tax, e-commerce)' },
      { feature: 'Monthly cost', billify: 'Free (3 invoices/mo) · Pro €9/mo', target: '$19–$275/mo (Simple Start–Advanced)' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Intuit servers' },
      { feature: 'Full accounting / bank rec / payroll', billify: 'No (invoicing only)', target: 'Yes' },
    ],
    faq: [
      {
        question: 'Can Billify replace QuickBooks?',
        answer:
          'Only for the narrow task of creating an invoice. QuickBooks is a full accounting system — bank reconciliation, P&L, payroll, inventory, tax. Billify intentionally does invoicing and nothing else. Most Billify users who grow into real bookkeeping move to QuickBooks or Xero.',
      },
      {
        question: 'How much cheaper is Billify than QuickBooks?',
        answer:
          'Billify is free for 3 invoices a month and €9/mo for unlimited. QuickBooks Online starts around $19/mo (promotional Simple Start) and reaches $275/mo for Advanced. If invoicing is all you need, the saving is the entire subscription.',
      },
      {
        question: 'Is Billify good for a side hustle or occasional invoices?',
        answer:
          'Yes — that is its sweet spot. No subscription to cancel, no account to maintain, no learning curve. You only pay €9/mo if you exceed 3 invoices a month or want all 12 templates and logo upload.',
      },
    ],
    relatedSlugs: ['freshbooks-alternative', 'wave-alternatives', 'stripe-invoicing-alternative'],
  },
  {
    slug: 'zoho-invoice-alternative',
    target: 'Zoho Invoice',
    h1: 'Free Zoho Invoice Alternative — No Account, No Annual Cap',
    metaDescription:
      'Free Zoho Invoice alternative. Billify needs no signup and has no 500-invoice/year free cap — generate invoices in your browser with 160 currencies. Compare the two.',
    introParagraph:
      'Zoho Invoice is a polished, feature-rich free invoicing tool — but it requires an account, caps the free tier at 500 invoices a year and 2 users, and lives in the broader Zoho ecosystem. If you want to skip the account and the cap entirely, Billify is the lighter, no-signup alternative. Here\'s how they actually compare.',
    billifyAngle:
      'No account, no annual invoice cap, no user seats to manage — open Billify and invoice immediately. 160 currencies, 12 templates, PDF + CSV export, and a client directory, all running in your browser with no server-side storage.',
    honestTradeoff:
      'Zoho Invoice is the stronger pick if you want a full invoicing workflow inside the Zoho suite (subscriptions, expenses, multi-user, portal, automations). Billify is invoicing-only and single-user — deliberately minimal.',
    rows: [
      { feature: 'PDF export', billify: 'Yes — instant, in-browser', target: 'Yes' },
      { feature: 'Invoice templates', billify: '12', target: 'Multiple + custom' },
      { feature: 'Multi-currency', billify: '160 currencies', target: '160+' },
      { feature: 'Tax calculation', billify: 'Automatic per-line and per-invoice', target: 'Yes (multi-tax)' },
      { feature: 'Logo upload', billify: 'Yes (Pro)', target: 'Yes' },
      { feature: 'Signup required', billify: 'No', target: 'Yes (account)' },
      { feature: 'Mobile-friendly', billify: 'Yes (responsive web)', target: 'Yes (iOS + Android apps)' },
      { feature: 'API', billify: 'No', target: 'Yes (REST API)' },
      { feature: 'Integrations', billify: 'None (standalone)', target: 'Zoho suite (CRM, Books, Expense) + more' },
      { feature: 'Monthly cost', billify: 'Free (3 invoices/mo) · Pro €9/mo', target: 'Free (500 invoices/yr, 2 users)' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Zoho servers' },
      { feature: 'Annual free-invoice cap', billify: '36/year on free; none on Pro', target: '500/year' },
      { feature: 'Multi-user / organization', billify: 'No (single user)', target: 'Yes (2 users)' },
    ],
    faq: [
      {
        question: 'Is Billify free with no account?',
        answer:
          'Yes. Create and download invoices (PDF or CSV) without signing up. Free = 3 invoices/month and 2 templates; Pro (€9/mo) unlocks unlimited invoices and all 12 templates.',
      },
      {
        question: 'How does Billify compare to Zoho Invoice?',
        answer:
          'Billify is no-signup, browser-only invoicing with no annual cap; Zoho Invoice is a full-featured platform tied to the Zoho ecosystem with multi-user, subscriptions, and a 500/year free cap. Billify for speed and privacy, Zoho for the suite.',
      },
      {
        question: 'Is my data private in Billify?',
        answer:
          'Your invoice data never leaves your browser — there\'s no server-side database of invoices. Billify even runs self-hosted, cookieless analytics, so no third-party trackers follow you.',
      },
    ],
    relatedSlugs: ['wave-alternatives', 'invoice-ninja-alternative', 'freshbooks-alternative'],
  },
];

const COMPARISON_BY_SLUG = new Map(COMPARISONS.map((c) => [c.slug, c]));

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISON_BY_SLUG.get(slug);
}
