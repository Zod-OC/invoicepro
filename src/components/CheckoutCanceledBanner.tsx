'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CANCEL_PARAM, CANCEL_TRUE } from '@/lib/embed';
import { stripUrlParams } from '@/lib/url';

/**
 * Dismissible 'Checkout canceled' banner for the pricing page, consuming the
 * ?canceled=true param that api/stripe-server.js's cancel_url writes on a
 * canceled Stripe checkout (CANCEL_URL). Prior to this the producer wrote the
 * param and nothing on /pricing read it — a canceled checkout silently landed
 * on the pricing page with no acknowledgement the cancel happened, the dangling
 * producer the R34 #6 review finding flagged. Mirrors the success-side
 * consumption in useSubscription.verifySession (which reads
 * ?checkout=success&session_id= from the SAME centralized checkout contract in
 * embed.ts and strips both params via the shared stripUrlParams helper).
 *
 * Client component reading window.location.search in an effect: the pricing
 * page is a statically-exported server component (output:'export'), so the
 * server-component searchParams prop — which forces dynamic rendering — is
 * unavailable, and useSearchParams would require a Suspense boundary. Reading
 * window.location.search directly in an effect is static-export-safe with no
 * boundary needed (the page prerenders without the banner; the banner only
 * mounts/flashes on the canceled-redirect URL, which is a client-only
 * navigation anyway). After rendering we strip the param via the shared
 * stripUrlParams helper (src/lib/url.ts) so a refresh or shared link doesn't
 * re-show the banner and the URL is clean for analytics — same cleanup
 * verifySession does on success.
 */
export function CheckoutCanceledBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(CANCEL_PARAM) !== CANCEL_TRUE) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    // Strip the param so a refresh or shared link doesn't re-fire the banner
    // and the URL is clean — the shared stripUrlParams helper (src/lib/url.ts,
    // R35 #2/#7) is the same cleanup useSubscription.verifySession uses on the
    // success side, so the cancel + success URL-cleaning can't drift.
    stripUrlParams(CANCEL_PARAM);
  }, []);

  if (!show) return null;

  return (
    <div className="mx-auto mb-8 flex max-w-2xl items-start justify-between gap-3 rounded-lg border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <span>Checkout canceled. No charge was made — you can try again anytime.</span>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}