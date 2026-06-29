'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { errorMessage } from '@/lib/utils';
import { postJson } from '@/lib/stripe-client';
import { track } from '@/lib/analytics';

interface SubscribeButtonProps {
  planKey: string;
  planName: string;
  billingPeriod?: 'monthly' | 'yearly';
  variant?: 'default' | 'outline';
  className?: string;
}

export function SubscribeButton({ planKey, planName, billingPeriod = 'monthly', variant = 'default', className }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    track('checkout_click', { plan: planKey, billing: billingPeriod });
    setLoading(true);
    setError(null);

    try {
      // postJson (src/lib/stripe-client.ts) POSTs the JSON body with the
      // X-CSRF-Token header postHeaders() builds — the double-submit pattern
      // the server's global CSRF middleware requires on every POST. postHeaders
      // ensures a billify_csrf cookie exists (prefetching the health endpoint if
      // it has aged out) and echoes it back. Shared with useSubscription via
      // the same helper so the cookie name, prefetch URL, and header key can't
      // drift between the call sites.
      const res = await postJson('/create-checkout-session', { planKey, billingPeriod }, 10000);

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to start checkout (${res.status})`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(errorMessage(err, 'Something went wrong. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        variant={variant}
        className={`w-full ${className || ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirecting to Stripe...
          </>
        ) : (
          `Subscribe to ${planName}`
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
