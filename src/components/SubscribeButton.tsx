'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/api/stripe`
  : 'https://billify.me/api/stripe';

/**
 * Fetches a CSRF token from the API and stores it in sessionStorage.
 * The API sets a billify_csrf cookie on GET requests; we read that cookie
 * and send it back as X-CSRF-Token on POSTs (double-submit pattern).
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/billify_csrf=([a-f0-9]+)/);
  if (match) return match[1];

  // Fallback: fetch the health endpoint to get a fresh cookie
  // (This is sync-ish since we prefetch on page load in practice)
  return null;
}

/** Prefetch a CSRF token by hitting the health endpoint */
export async function prefetchCsrfToken() {
  try {
    await fetch(`${API_BASE}/`, { credentials: 'include' });
  } catch {
    // Non-critical — checkout will fail gracefully
  }
}

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
    setLoading(true);
    setError(null);

    try {
      // Ensure we have a CSRF token (GET to health endpoint sets the cookie)
      let csrfToken = getCsrfToken();
      if (!csrfToken) {
        await fetch(`${API_BASE}/`, { credentials: 'include' });
        csrfToken = getCsrfToken();
      }

      const res = await fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ planKey, billingPeriod }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to start checkout (${res.status})`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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
