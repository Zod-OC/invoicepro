import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { SiteNavShell } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { ProseSection } from '@/components/ProseSection';
import { staticUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Billify keeps your invoices in your browser, processes payments via Stripe, and runs cookieless, self-hosted analytics. No accounts, no server-side invoice storage.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Billify Privacy',
    description: 'Invoices stay in your browser. Payments via Stripe. Cookieless, self-hosted analytics.',
    url: staticUrl('/privacy'),
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteNavShell>
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">App</Link>
        <Button asChild size="sm">
          <Link href="/app">Get Started</Link>
        </Button>
      </SiteNavShell>

      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">Privacy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

          <ProseSection title="Your invoices never leave your browser">
            <p>
              Billify generates invoices and PDFs entirely on your device. Everything you enter — company
              details, line items, logos — is stored only in your browser&apos;s{' '}
              <code className="text-foreground">localStorage</code>. There is no server-side database of
              invoices, and we cannot read your invoice data.
            </p>
            <p>
              Share links are produced locally too: the invoice is encoded into the link itself and decoded in
              the recipient&apos;s browser. We never receive it.
            </p>
          </ProseSection>

          <ProseSection title="Payments">
            <p>
              Pro subscriptions are processed by Stripe. Card details go directly to Stripe — they never touch
              Billify&apos;s servers. We receive only a token that confirms your subscription status.
            </p>
          </ProseSection>

          <ProseSection title="Analytics">
            <p>
              We run self-hosted, cookieless analytics on our own infrastructure to count page views and which
              buttons are clicked. No cookies, no fingerprinting, no third-party advertising or tracking
              networks, and no cross-site profiling. We count pages, not people.
            </p>
          </ProseSection>

          <ProseSection title="Deleting your data">
            <p>
              There is no account for the free tier — your data lives only in your browser, so clearing your
              browser storage removes it. Pro subscriptions are managed through Stripe and can be cancelled any
              time from Stripe&apos;s customer portal.
            </p>
          </ProseSection>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
