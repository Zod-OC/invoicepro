import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Shield, Lock, RefreshCcw, CreditCard } from 'lucide-react';
import { PricingCards } from '@/components/PricingCards';
import { CheckoutCanceledBanner } from '@/components/CheckoutCanceledBanner';
import { BrowseProfessions } from '@/components/BrowseProfessions';
import { SiteNavShell } from '@/components/SiteNav';
import { staticUrl } from '@/lib/site';
import { freeInvoiceCap } from '@/lib/plan-limits';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Simple, transparent pricing for Billify. Start free with ${freeInvoiceCap} invoices per month. Upgrade to Pro for €9/mo.`,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Billify Pricing — Simple & Transparent',
    description: 'Start free. Upgrade when you need more power. Pro €9/mo.',
    url: staticUrl('/pricing'),
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteNavShell>
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">App</Link>
        <Button asChild size="sm">
          <Link href="/app">Get Started</Link>
        </Button>
      </SiteNavShell>

      <div className="flex-1 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground mb-4">Start free. Upgrade when you need more power.</p>

          {/* Consumes the ?canceled=true redirect from a canceled Stripe
              checkout (CANCEL_URL in api/stripe-server.js). Renders nothing on
              a normal visit; only the canceled-redirect URL flashes the banner. */}
          <CheckoutCanceledBanner />

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Secure payments via Stripe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCcw className="w-4 h-4 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>No credit card for free tier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Your data stays in your browser</span>
            </div>
          </div>

          <PricingCards />

          {/* FAQ / trust footer */}
          <div className="mt-16 max-w-2xl mx-auto text-left space-y-6">
            <h3 className="text-lg font-semibold text-center">Common questions</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Can I switch plans later?</p>
                <p>Yes. Upgrade or downgrade anytime. Your localStorage invoice data is preserved.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">What happens to my invoices if I cancel?</p>
                <p>All your PDF exports are yours forever. They&#39;re already on your device — nothing to lose.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Do you store my invoice data?</p>
                <p>No. Billify is privacy-first. Your data stays in your browser via localStorage. We cannot see it.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Is this a subscription or one-time?</p>
                <p>Pro is billed monthly or annually. Cancel anytime — no lock-in, no hidden fees.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BrowseProfessions limit={8} />
    </div>
  );
}
