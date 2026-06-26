import Link from 'next/link';
import { Sparkles, ArrowDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmbeddedEditor } from '@/components/EmbeddedEditor';
import { CrossLinks } from '@/components/CrossLinks';
import { faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import type { Profession } from '@/data/professions';

const SITE = 'https://billify.me';

/**
 * Pure presentational profession landing page. All copy comes from the
 * `profession` prop (authored in src/data/professions.ts). The embedded editor
 * is a client component; everything else here is server-rendered.
 */
export function ProfessionPage({ profession }: { profession: Profession }) {
  const { slug } = profession;
  const pageUrl = `${SITE}/invoice-template-for/${slug}`;

  const crumbs = [
    { name: 'Home', url: SITE },
    { name: 'Templates', url: `${SITE}/templates` },
    { name: profession.name, url: pageUrl },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Navbar — matches the rest of the site */}
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Billify</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Button asChild size="sm">
              <Link href="/app">Create Invoice</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Header: breadcrumb, H1, intro, CTA */}
        <section className="px-4 pt-10 pb-6">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
              <ol className="flex flex-wrap items-center gap-1">
                <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
                <li aria-hidden>›</li>
                <li><Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
                <li aria-hidden>›</li>
                <li className="text-foreground">{profession.name}</li>
              </ol>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{profession.h1}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{profession.introParagraph}</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="gap-2">
                <a href="#editor">
                  <ArrowDown className="w-4 h-4" />
                  Try the {profession.name} invoice editor
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/app">Open full Billify editor</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Embedded editor */}
        <section id="editor" className="px-4 py-8 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <EmbeddedEditor profession={profession} />
          </div>
        </section>

        {/* What to include */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">What to include on a {profession.name.toLowerCase()} invoice</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profession.whatToInclude.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Industry tips */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Billing tips for {profession.pluralName.toLowerCase()}</h2>
            <p className="text-muted-foreground leading-relaxed">{profession.industryTips}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{profession.name} invoice FAQ</h2>
            <div className="space-y-4">
              {profession.faq.map((qa) => (
                <Card key={qa.question}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{qa.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cross-links to related professions */}
        <CrossLinks slugs={profession.relatedSlugs} />
      </main>

      {/* Footer — matches the rest of the site */}
      <footer className="w-full border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-5 text-primary" />
            <span className="font-semibold">Billify</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Billify. Built for freelancers.</p>
        </div>
      </footer>

      {/* Structured data — FAQ + Breadcrumb. The SoftwareApplication block is
          emitted once globally by src/app/layout.tsx (single source), so it is
          not duplicated here. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd(profession.faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(crumbs) }}
      />
    </div>
  );
}