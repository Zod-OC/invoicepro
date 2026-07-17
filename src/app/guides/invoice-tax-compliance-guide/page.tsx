import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { faqJsonLd, breadcrumbJsonLd, articleJsonLd, organizationJsonLd } from '@/lib/seo';
import { SITE_URL, staticUrl } from '@/lib/site';
import { TAX_COUNTRIES, EU_MANDATE_TIMELINE, TAX_GUIDE_FAQ, TAX_GUIDE_UPDATED_AT, type EInvoiceStatus } from '@/data/tax-guide';
import { DEFAULT_AUTHOR } from '@/data/authors';

// The linkable/AEO asset: a long-form "Invoice Tax & Compliance Guide by Country".
// Reference content other sites cite (→ backlinks → domain authority) and AI
// Overviews can lift (the EU mandate timeline especially). Carries a prominent
// "not tax advice" disclaimer; facts are dated.

const PATH = '/guides/invoice-tax-compliance-guide';

const STATUS_META: Record<EInvoiceStatus, { label: string; className: string }> = {
  mandatory: { label: 'Mandatory', className: 'text-red-600 dark:text-red-400 font-medium' },
  'receive-only': { label: 'Receiving now', className: 'text-amber-600 dark:text-amber-400 font-medium' },
  planned: { label: 'Incoming', className: 'text-amber-600 dark:text-amber-400 font-medium' },
  none: { label: 'No mandate', className: 'text-muted-foreground' },
};

export const metadata: Metadata = {
  title: 'Invoice Tax & Compliance Guide by Country (2026)',
  description:
    'Freelancer invoice tax & compliance by country: VAT/GST/Sales-tax rates, registration thresholds, and the EU e-invoicing mandate timeline. A dated, country-by-country reference.',
  alternates: { canonical: PATH },
  openGraph: {
    title: 'Invoice Tax & Compliance Guide by Country',
    description: 'VAT/GST/Sales-tax rates + EU e-invoicing mandate timeline, country by country. Dated, not tax advice.',
    url: staticUrl(PATH),
  },
};

export default function TaxComplianceGuide() {
  const pageUrl = staticUrl(PATH);
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Invoice Templates', url: staticUrl('/invoice-templates') },
    { name: 'Tax & Compliance Guide', url: pageUrl },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <SiteNav />

      <main className="flex-1">
        {/* Header */}
        <section className="px-4 pt-10 pb-6">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
              <ol className="flex flex-wrap items-center gap-1">
                <li><Link href="/" className="hover:text-foreground">Home</Link></li>
                <li aria-hidden>›</li>
                <li><Link href="/invoice-templates" className="hover:text-foreground">Invoice Templates</Link></li>
                <li aria-hidden>›</li>
                <li className="text-foreground">Tax & Compliance Guide</li>
              </ol>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Invoice Tax & Compliance Guide by Country</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              The VAT/GST/Sales-tax rates, registration thresholds, and e-invoicing rules a freelancer needs — for 14
              countries, with the EU mandate timeline that decides whether a PDF is still enough.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              By{' '}
              <Link href={DEFAULT_AUTHOR.bioPath} className="underline hover:text-foreground">{DEFAULT_AUTHOR.name}</Link>,{' '}
              {DEFAULT_AUTHOR.role} · Updated{' '}
              {new Date(TAX_GUIDE_UPDATED_AT).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Not tax advice.</span> This is general, dated information to
                help you ask the right questions. Tax rules and e-invoice dates change, and your situation may have
                exceptions. Confirm with a qualified accountant or your national tax authority before relying on any of it.
              </p>
            </div>
          </div>
        </section>

        {/* EU mandate timeline — the AEO-citable core */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">The EU e-invoicing mandate timeline</h2>
            <p className="text-muted-foreground mb-6">
              The single most important shift for EU freelancers: country after country is requiring invoices in a
              structured, machine-readable format. A plain PDF stops being a valid B2B invoice on the dates below.
            </p>
            <ol className="relative border-l border-border pl-6 space-y-5">
              {EU_MANDATE_TIMELINE.map((m) => (
                <li key={m.date + m.region} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold">{m.date} — {m.region}</p>
                  <p className="text-sm text-muted-foreground">{m.event}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Quick-reference table */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Quick reference: 14 countries</h2>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">Country</th>
                    <th className="text-left p-3 font-semibold">Tax</th>
                    <th className="text-left p-3 font-semibold">Std rate</th>
                    <th className="text-left p-3 font-semibold">E-invoicing</th>
                  </tr>
                </thead>
                <tbody>
                  {TAX_COUNTRIES.map((c) => (
                    <tr key={c.code} className="border-b last:border-0">
                      <td className="p-3"><a href={`#${c.code}`} className="font-medium hover:underline">{c.name}</a></td>
                      <td className="p-3 text-muted-foreground">{c.taxName}</td>
                      <td className="p-3 text-muted-foreground">{c.standardRate}</td>
                      <td className={`p-3 ${STATUS_META[c.eInvoiceStatus].className}`}>{STATUS_META[c.eInvoiceStatus].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Per-country detail */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Country-by-country detail</h2>
            {TAX_COUNTRIES.map((c) => (
              <div key={c.code} id={c.code} className="scroll-mt-20">
                <h3 className="text-xl font-bold">{c.name}</h3>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div><dt className="inline text-muted-foreground">Currency: </dt><dd className="inline">{c.currencyName} ({c.currencyCode})</dd></div>
                  <div><dt className="inline text-muted-foreground">Tax: </dt><dd className="inline">{c.taxName} · {c.standardRate}</dd></div>
                  <div><dt className="inline text-muted-foreground">Registration: </dt><dd className="inline">{c.registrationThreshold}</dd></div>
                  <div><dt className="inline text-muted-foreground">E-invoicing: </dt><dd className={`inline ${STATUS_META[c.eInvoiceStatus].className}`}>{STATUS_META[c.eInvoiceStatus].label}</dd></div>
                </dl>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.eInvoiceDetail}</p>
                <p className="mt-2 text-sm leading-relaxed">{c.freelancerNote}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {TAX_GUIDE_FAQ.map((qa) => (
                <div key={qa.question} className="rounded-lg border bg-background p-6">
                  <h3 className="font-semibold mb-2">{qa.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-lg border bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">Ready to put this into an invoice?</p>
              <Link href="/app" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90">
                Create a compliant invoice — no signup
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(TAX_GUIDE_FAQ) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(crumbs) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: organizationJsonLd({
            name: DEFAULT_AUTHOR.name,
            description: DEFAULT_AUTHOR.role,
            url: staticUrl(DEFAULT_AUTHOR.bioPath),
            sameAs: DEFAULT_AUTHOR.sameAs,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: articleJsonLd({
            headline: 'Invoice Tax & Compliance Guide by Country',
            url: pageUrl,
            dateModified: TAX_GUIDE_UPDATED_AT,
            author: { name: DEFAULT_AUTHOR.name, url: staticUrl(DEFAULT_AUTHOR.bioPath) },
            publisherName: 'Billify',
            publisherUrl: SITE_URL,
          }),
        }}
      />
    </div>
  );
}
