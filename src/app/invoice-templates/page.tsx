import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { ProfessionCard } from '@/components/ProfessionCard';
import { professions } from '@/data/professions';
import { INVOICE_FORMATS } from '@/data/formats';
import { COMPARISONS } from '@/data/comparisons';
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
      <SiteNav active="templates" />

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

          <h2 className="text-2xl font-bold mt-16">Invoice templates by format</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Prefer a spreadsheet or a print-ready file? Export any invoice as a clean CSV (opens in Excel, Google Sheets, or Numbers) or a polished PDF.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {INVOICE_FORMATS.map((f) => (
              <Link key={f.slug} href={`/invoice-template/${f.slug}`} className="px-4 py-2 rounded-lg border bg-background text-sm hover:bg-accent transition-colors">
                {f.name}
              </Link>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-16">Compare Billify to other invoice tools</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Already using another invoicing app? See how Billify's no-signup, privacy-first approach stacks up.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {COMPARISONS.map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className="px-4 py-2 rounded-lg border bg-background text-sm hover:bg-accent transition-colors">
                vs {c.target}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
