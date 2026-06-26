'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { SubscribeButton } from '@/components/SubscribeButton';

interface Plan {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  period: string;
  note?: string;
  features: string[];
  planKey?: string;
  cta: string;
  ctaVariant: 'default' | 'outline';
  href?: string;
  popular: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthlyPrice: '€0',
    yearlyPrice: '€0',
    period: 'Forever free',
    features: ['3 invoices per month', '2 basic templates', 'PDF export', 'Auto-save', 'No signup, no account'],
    cta: 'Start Free',
    ctaVariant: 'outline',
    href: '/app',
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: '€9',
    yearlyPrice: '€6.58',
    period: '/mo',
    note: 'Flat rate. One user.',
    features: ['Unlimited invoices', '10 premium templates', 'Logo upload', 'No signup, no account', 'Data stays in your browser', 'Cancel anytime'],
    planKey: 'pro',
    cta: 'Subscribe to Pro',
    ctaVariant: 'default',
    popular: true,
  },
];

export function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setIsAnnual(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !isAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            isAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Yearly
          <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
            ~28% off
          </span>
        </button>
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
                {plan.name === 'Free' ? plan.monthlyPrice : isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                {plan.name !== 'Free' && (
                  <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                )}
              </div>
              {plan.name !== 'Free' && (
                <p className="text-sm text-muted-foreground">
                  {isAnnual ? 'billed annually' : 'billed monthly'}
                </p>
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
              {plan.planKey ? (
                <SubscribeButton
                  planKey={plan.planKey}
                  planName={plan.name}
                  billingPeriod={isAnnual ? 'yearly' : 'monthly'}
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
    </>
  );
}
