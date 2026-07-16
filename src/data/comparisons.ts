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

export const COMPARISON_DATA_UPDATED_AT = '2026-07-17';

export const COMPARISONS: Comparison[] = [
  {
    slug: 'wave-alternatives',
    target: 'Wave',
    h1: 'Free Wave Alternatives — No Signup, Available Worldwide',
    metaDescription:
      'Free Wave alternatives for invoicing. Billify needs no account and works in any country — generate and download invoices in your browser. Compare features and limits.',
    introParagraph:
      'Wave\'s free invoicing is popular, but it\'s restricted to a handful of countries (US, Canada, UK, Ireland) and requires an account. If you\'re a freelancer outside those regions, or you just want to send an invoice without creating an account and handing over your data, here\'s how Billify compares — and where Wave is still the stronger pick.',
    billifyAngle:
      'Billify is the no-signup, no-storage alternative: open the page, build the invoice, download a PDF or CSV. It works in every country, supports 160 currencies, and your invoice data never leaves your browser.',
    honestTradeoff:
      'If you need double-entry bookkeeping, bank reconciliation, receipts, or payroll, Wave (or a full accounting suite) is the better choice — Billify is invoicing-only by design. Use Billify to bill fast; use Wave to run the books.',
    rows: [
      { feature: 'Account required', billify: 'No — open the page and start', target: 'Yes (free account)' },
      { feature: 'Free tier', billify: '3 invoices/month, 2 templates', target: 'Unlimited invoices' },
      { feature: 'Country availability', billify: 'Worldwide', target: 'US, Canada, UK, Ireland only' },
      { feature: 'Currencies', billify: '160', target: '≈ 60' },
      { feature: 'Invoice templates', billify: '12', target: 'A few' },
      { feature: 'Where your data lives', billify: 'In your browser — never sent to a server', target: 'On Wave\'s servers' },
      { feature: 'Watermark on free invoices', billify: 'No', target: 'No' },
      { feature: 'Double-entry accounting / bank rec', billify: 'No (invoicing only)', target: 'Yes' },
      { feature: 'Paid plan', billify: 'Pro €9/mo (unlimited + all templates)', target: 'Pay-per-payment (Stripe) add-ons' },
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
          'If you\'re outside the US/Canada/UK/Ireland, don\'t want an account, or want your invoice data to stay in your browser, Billify is the simpler choice. Wave is stronger if you need full bookkeeping.',
      },
      {
        question: 'Can I move from Wave to Billify?',
        answer:
          'Easily for new invoices — there\'s nothing to migrate since Billify has no account. For past invoices, recreate them in Billify or keep Wave as an archive.',
      },
    ],
    relatedSlugs: ['invoice-ninja-alternative', 'zoho-invoice-alternative'],
  },
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
    relatedSlugs: ['wave-alternatives', 'zoho-invoice-alternative'],
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
      { feature: 'Account required', billify: 'No — open and go', target: 'Yes (free account)' },
      { feature: 'Free tier', billify: '3 invoices/month, 2 templates', target: '500 invoices/year, 2 users' },
      { feature: 'Annual free-invoice cap', billify: 'None on Pro; 36/year on free', target: '500/year' },
      { feature: 'Currencies', billify: '160', target: '160+' },
      { feature: 'Invoice templates', billify: '12', target: 'Multiple + custom' },
      { feature: 'Where your data lives', billify: 'In your browser', target: 'On Zoho\'s servers' },
      { feature: 'Multi-user / organization', billify: 'No (single user)', target: 'Yes' },
      { feature: 'Subscriptions & expenses', billify: 'No', target: 'Yes' },
      { feature: 'Paid plan', billify: 'Pro €9/mo', target: 'Free (paid add-ons in the Zoho suite)' },
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
    relatedSlugs: ['wave-alternatives', 'invoice-ninja-alternative'],
  },
];

const COMPARISON_BY_SLUG = new Map(COMPARISONS.map((c) => [c.slug, c]));

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISON_BY_SLUG.get(slug);
}
