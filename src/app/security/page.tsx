import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { ProseSection } from '@/components/ProseSection';
import { staticUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Security',
  description:
    'Billify security: a strict same-origin Content-Security-Policy, no server-side invoice storage, client-side PDF generation, and Stripe-handled payments.',
  alternates: { canonical: '/security' },
  openGraph: {
    title: 'Billify Security',
    description: 'Strict CSP, browser-only invoice data, client-side PDFs, Stripe-handled payments.',
    url: staticUrl('/security'),
  },
};

export default function SecurityPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteNav />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">Security</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

          <ProseSection title="Content-Security-Policy">
            <p>
              Every page is served with a strict Content-Security-Policy that allows only same-origin scripts,
              styles, and connections. There are no third-party scripts, no external trackers, and inline script
              is tightly scoped to the app itself.
            </p>
          </ProseSection>

          <ProseSection title="No server-side invoice storage">
            <p>
              Because invoices live only in your browser, there is no server database to breach. An attacker who
              compromised the server could not read your invoice history — there isn&apos;t one.
            </p>
          </ProseSection>

          <ProseSection title="Client-side PDF generation">
            <p>
              PDFs are produced in your browser, so invoice content is never uploaded to a server to be rendered.
              The file you download is generated on your device.
            </p>
          </ProseSection>

          <ProseSection title="Input sanitization">
            <p>
              All invoice text fields are sanitized before they are rendered into the PDF, to prevent markup
              injection from crafted invoice data or share links.
            </p>
          </ProseSection>

          <ProseSection title="Payments via Stripe">
            <p>
              Card data is handled entirely by Stripe&apos;s PCI-DSS-compliant infrastructure. Billify&apos;s
              server only ever sees an opaque token representing your subscription — never your card.
            </p>
          </ProseSection>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
