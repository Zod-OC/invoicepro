import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { faqJsonLd, breadcrumbJsonLd, articleJsonLd, organizationJsonLd } from '@/lib/seo';
import { SITE_URL, staticUrl } from '@/lib/site';
import { COMPARISONS, getComparison, COMPARISON_DATA_UPDATED_AT } from '@/data/comparisons';
import { DEFAULT_AUTHOR } from '@/data/authors';

// Programmatic-SEO "X alternative" comparison cluster. Targets competitor-brand
// queries ("Wave alternatives free no signup", etc.) — high intent, lower KD than
// the saturated "invoice generator" SERPs. Honest head-to-head: states Billify's
// real limits AND when the competitor is the better pick.

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cmp = getComparison(params.slug);
  if (!cmp) return {};
  const path = `/compare/${cmp.slug}`;
  return {
    title: `${cmp.target} Alternative — Billify`,
    description: cmp.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: cmp.h1,
      description: cmp.metaDescription,
      url: staticUrl(path),
    },
  };
}

export default function ComparisonPage({ params }: { params: { slug: string } }) {
  const cmp = getComparison(params.slug);
  if (!cmp) notFound();
  const pageUrl = staticUrl(`/compare/${cmp.slug}`);
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Invoice Templates', url: staticUrl('/invoice-templates') },
    { name: `${cmp.target} alternative`, url: pageUrl },
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
                <li className="text-foreground">{cmp.target} alternative</li>
              </ol>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{cmp.h1}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{cmp.introParagraph}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              By{' '}
              <Link href={DEFAULT_AUTHOR.bioPath} className="underline hover:text-foreground">{DEFAULT_AUTHOR.name}</Link>,{' '}
              {DEFAULT_AUTHOR.role} · Updated{' '}
              {new Date(COMPARISON_DATA_UPDATED_AT).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/app">Try Billify — no signup <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Billify vs {cmp.target}</h2>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">Feature</th>
                    <th className="text-left p-3 font-semibold text-primary">Billify</th>
                    <th className="text-left p-3 font-semibold">{cmp.target}</th>
                  </tr>
                </thead>
                <tbody>
                  {cmp.rows.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="p-3 font-medium align-top">{row.feature}</td>
                      <td className="p-3 align-top">{row.billify}</td>
                      <td className="p-3 align-top text-muted-foreground">{row.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Competitor details reflect each product's published free tier at the time of writing and may change — verify on their site.
            </p>
          </div>
        </section>

        {/* Angle + honest tradeoff */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-3">Why people switch to Billify</h2>
              <p className="text-muted-foreground leading-relaxed">{cmp.billifyAngle}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">When {cmp.target} is the better pick</h2>
              <p className="text-muted-foreground leading-relaxed">{cmp.honestTradeoff}</p>
            </div>
          </div>
        </section>

        {/* Related comparisons */}
        {cmp.relatedSlugs.length > 0 && (
          <section className="py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-4">More comparisons</h2>
              <div className="flex flex-wrap gap-3">
                {cmp.relatedSlugs.map((slug) => {
                  const rel = getComparison(slug);
                  if (!rel) return null;
                  return (
                    <Link key={slug} href={`/compare/${slug}`} className="px-4 py-2 rounded-lg border bg-background text-sm hover:bg-accent transition-colors">
                      {rel.target} alternative
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{cmp.target} alternative FAQ</h2>
            <div className="space-y-4">
              {cmp.faq.map((qa) => (
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(cmp.faq) }} />
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
            headline: cmp.h1,
            url: pageUrl,
            dateModified: COMPARISON_DATA_UPDATED_AT,
            author: { name: DEFAULT_AUTHOR.name, url: staticUrl(DEFAULT_AUTHOR.bioPath) },
            publisherName: 'Billify',
            publisherUrl: SITE_URL,
          }),
        }}
      />
    </div>
  );
}
