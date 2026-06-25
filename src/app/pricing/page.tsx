import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Shield, Lock, RefreshCcw, CreditCard } from 'lucide-react';
import { SubscribeButton } from '@/components/SubscribeButton';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Billify. Start free with 3 invoices per month. Upgrade to Pro for €9/mo or Team for €29/mo.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Billify Pricing — Simple & Transparent',
    description: 'Start free. Upgrade when you need more power. Pro €9/mo, Team €29/mo.',
    url: 'https://billify.me/pricing',
  },
};

const PLANS = [
  {
    name: 'Free',
    price: '€0',
    period: 'Forever free',
    features: ['3 invoices per month', '2 basic templates', 'PDF export', 'Auto-save', 'Watermark on PDF'],
    cta: 'Start Free',
    ctaVariant: 'outline' as const,
    href: '/app',
    popular: false,
  },
  {
    name: 'Pro',
    price: '€9',
    period: '/mo',
    subPeriod: 'or €79/year (27% off)',
    note: 'Flat rate. One user.',
    features: ['Unlimited invoices', '6 premium templates', 'Custom branding colors', 'Invoice history & search', 'Export CSV/Excel', 'No watermark'],
    priceId: 'price_1TZ6Rw0G5k5sFLG48eQaIcGO',
    cta: 'Subscribe to Pro',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    name: 'Team',
    price: '€29',
    period: '/mo',
    subPeriod: 'or €249/year (29% off)',
    note: 'Up to 5 team members included.',
    features: ['Everything in Pro', 'Up to 5 team members', 'Shared templates', 'Admin dashboard', 'API access (soon)', 'Priority support'],
    priceId: 'price_1TZ6Rx0G5k5sFLG4aiBM2RhX',
    cta: 'Subscribe to Team',
    ctaVariant: 'outline' as const,
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-full flex flex-col">
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Billify</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">App</Link>
            <Button asChild size="sm">
              <Link href="/app">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground mb-4">Start free. Upgrade when you need more power.</p>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>30-day money-back guarantee</span>
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-start">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`relative transition-shadow ${
                  plan.popular
                    ? 'border-2 border-primary shadow-lg shadow-primary/10 scale-[1.02] z-10'
                    : 'border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.subPeriod && (
                    <p className="text-sm text-muted-foreground">{plan.subPeriod}</p>
                  )}
                  {plan.note && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.note}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.priceId ? (
                    <SubscribeButton
                      priceId={plan.priceId}
                      planName={plan.name}
                      variant={plan.ctaVariant}
                      className="mt-4"
                    />
                  ) : plan.href ? (
                    <Button
                      asChild
                      variant={plan.ctaVariant}
                      className="w-full mt-4"
                    >
                      {plan.href.startsWith('/') ? (
                        <Link href={plan.href}>{plan.cta}</Link>
                      ) : (
                        <a href={plan.href}>{plan.cta}</a>
                      )}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ / trust footer */}
          <div className="mt-16 max-w-2xl mx-auto text-left space-y-6">
            <h3 className="text-lg font-semibold text-center">Common questions</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Can I switch plans later?</p>
                <p>Yes. Upgrade or downgrade anytime. Prorated charges apply on upgrade.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">What happens to my invoices if I cancel?</p>
                <p>All your PDF exports are yours forever. Pro features like history and CSV export stop, but existing downloads remain.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Do you store my invoice data?</p>
                <p>No. Billify is privacy-first. Your data stays in your browser via localStorage. We cannot see it.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Is this a subscription or one-time?</p>
                <p>Pro and Team are billed monthly or annually. Cancel anytime — no lock-in, no hidden fees.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
