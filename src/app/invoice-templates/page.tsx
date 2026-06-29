import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { SiteNavShell } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { ProfessionCard } from '@/components/ProfessionCard';
import { professions } from '@/data/professions';
import { staticUrl } from '@/lib/site';

// Topical-authority hub for the 30 programmatic-SEO profession pages. Distributes
// internal links to all 30 from one crawlable, internally-linked page (vs the
// existing /templates, which is a 12-design gallery). Unique intro prose so the
// hub itself clears the quality bar (not a thin index).
export const metadata: Metadata = {
  title: 'Invoice Templates by Profession',
  description: `Browse ${professions.length} free invoice templates tailored to your profession — electrician, freelancer, consultant, photographer and more. No signup; edit in your browser, export a PDF.`,
  alternates: { canonical: '/invoice-templates' },
  openGraph: {
    title: 'Invoice Templates by Profession — Billify',
    description: `${professions.length} free, no-signup invoice templates by trade. Edit in your browser, export PDF.`,
    url: staticUrl('/invoice-templates'),
  },
};

export default function InvoiceTemplatesHub() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteNavShell>
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">App</Link>
        <Button asChild size="sm">
          <Link href="/app">Get Started</Link>
        </Button>
      </SiteNavShell>

      <main className="flex-1 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Invoice templates by profession</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            {professions.length} free invoice templates, each tuned to a trade — real line items, tax
            and payment guidance, and a no-signup editor you can use right now. Pick your profession,
            edit in your browser, and export a clean PDF.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {professions.map((p) => (
              <ProfessionCard key={p.slug} profession={p} dense />
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
