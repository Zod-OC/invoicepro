import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { faqJsonLd, breadcrumbJsonLd, articleJsonLd, organizationJsonLd } from '@/lib/seo';
import { SITE_URL, staticUrl } from '@/lib/site';
import { INVOICE_FORMATS, getFormat, FORMAT_DATA_UPDATED_AT } from '@/data/formats';
import { DEFAULT_AUTHOR } from '@/data/authors';

// Programmatic-SEO "invoice template by format" cluster. Targets format-based
// intent ("invoice template excel/sheets/csv/pdf") — a different surface than the
// 30 profession pages. CSV + PDF are real exports; Excel/Sheets are reached via
// CSV import (stated plainly in the copy — no native .xlsx/.gsheet claim).

export function generateStaticParams() {
  return INVOICE_FORMATS.map((f) => ({ format: f.slug }));
}

export function generateMetadata({ params }: { params: { format: string } }): Metadata {
  const fmt = getFormat(params.format);
  if (!fmt) return {};
  const path = `/invoice-template/${fmt.slug}`;
  return {
    title: `${fmt.name} Invoice Template`,
    description: fmt.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: fmt.h1,
      description: fmt.metaDescription,
      url: staticUrl(path),
    },
  };
}

export default function FormatPage({ params }: { params: { format: string } }) {
  const fmt = getFormat(params.format);
  if (!fmt) notFound();
  const pageUrl = staticUrl(`/invoice-template/${fmt.slug}`);
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Invoice Templates', url: staticUrl('/invoice-templates') },
    { name: fmt.name, url: pageUrl },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <SiteNav />

      <main className="flex-1">
        {/* Header: breadcrumb, H1, intro, CTA */}
        <section className="px-4 pt-10 pb-6">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
              <ol className="flex flex-wrap items-center gap-1">
                <li><Link href="/" className="hover:text-foreground">Home</Link></li>
                <li aria-hidden>›</li>
                <li><Link href="/invoice-templates" className="hover:text-foreground">Invoice Templates</Link></li>
                <li aria-hidden>›</li>
                <li className="text-foreground">{fmt.name}</li>
              </ol>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{fmt.h1}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{fmt.introParagraph}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              By{' '}
              <Link href={DEFAULT_AUTHOR.bioPath} className="underline hover:text-foreground">{DEFAULT_AUTHOR.name}</Link>,{' '}
              {DEFAULT_AUTHOR.role} · Updated{' '}
              {new Date(FORMAT_DATA_UPDATED_AT).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/app"><Download className="w-4 h-4 mr-2" />Create your {fmt.name} invoice</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/invoice-templates">Browse all templates</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* What to include */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">What to include in your {fmt.name.toLowerCase()} invoice</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fmt.whatToInclude.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How to export */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">How to make your {fmt.name.toLowerCase()} invoice</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              {fmt.exportSteps.map((step) => (
                <li key={step} className="text-sm leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{fmt.name} invoice FAQ</h2>
            <div className="space-y-4">
              {fmt.faq.map((qa) => (
                <div key={qa.question} className="rounded-lg border bg-background p-6">
                  <h3 className="font-semibold mb-2">{qa.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(fmt.faq) }} />
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
            headline: fmt.h1,
            url: pageUrl,
            dateModified: FORMAT_DATA_UPDATED_AT,
            author: { name: DEFAULT_AUTHOR.name, url: staticUrl(DEFAULT_AUTHOR.bioPath) },
            publisherName: 'Billify',
            publisherUrl: SITE_URL,
          }),
        }}
      />
    </div>
  );
}
