import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
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
      <SiteNav />

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

          <ProseSection title="Cloud sync (optional)">
            <p>
              Cloud sync is an optional feature that lets you back up your invoices to your own Google Drive
              so you can use them across devices. It is entirely opt-in — the feature is invisible until you
              explicitly enable it.
            </p>
            <p>
              <strong>Zero-knowledge by design.</strong> When you enable cloud sync, your browser connects
              directly to Google Drive using a limited-scope token (the <code>drive.file</code> scope —
              Billify can only see files it creates, not the rest of your Drive). Your invoice data is{' '}
              <strong>encrypted in your browser</strong> before it is uploaded. We never see your encryption
              key, your data&apos;s contents, or even that you are using cloud sync. Google stores only
              encrypted files it cannot read.
            </p>
            <p>
              The OAuth token and encryption key live in your browser&apos;s local storage. Clearing your
              browser storage removes both. You can disconnect cloud sync at any time from the sync settings;
              this revokes the token and stops syncing, though your encrypted backup remains in your Google
              Drive until you delete it yourself from Google.
            </p>
            <p>
              For GDPR purposes, Billify is <strong>not a data controller</strong> for cloud-synced data:
              we never receive or process personal data through this feature. Google is the controller for
              the OAuth flow and Drive storage under their own privacy policy.
            </p>
          </ProseSection>

          <ProseSection title="Deleting your data">
            <p>
              There is no account for the free tier — your data lives only in your browser, so clearing your
              browser storage removes it. Pro subscriptions are managed through Stripe and can be cancelled any
              time from Stripe&apos;s customer portal. If you enabled cloud sync, you can delete the encrypted
              backup from your Google Drive at any time.
            </p>
          </ProseSection>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
