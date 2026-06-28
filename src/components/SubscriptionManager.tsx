'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import type { Plan, PlanLimits } from '@/hooks/useSubscription';
import { templates } from '@/types';

// The subscription state is owned by a SINGLE useSubscription instance in
// AppPage (see the comment there for why — a second instance would double the
// validate-token/CSRF-prefetch load on every /app mount). AppPage passes the
// slice this panel needs as props. memo still works: clear is useCallback-stable
// in the hook, and plan/initialized/limits only change on plan resolution, so
// the props are stable across AppPage's per-keystroke re-renders and React.memo
// skips re-rendering this subtree on every edit.
//
// R37 #0/#1: the prior "Restore purchased plan" email-input flow — which POSTed
// to the now-removed /verify-subscription, a route that minted a server-signed
// Pro JWT from a bare email with no proof of ownership (a cross-account bypass:
// anyone with a CSRF cookie could POST a victim's email and get a valid Pro JWT)
// and doubled as a subscriber-email oracle — is gone. Plan recovery past JWT
// expiry now happens AUTOMATICALLY and securely via /refresh-token in
// useSubscription: the caller's stored (possibly expired) JWT is the proof of
// possession an email-only attacker lacks, and the route re-checks the live
// Stripe subscription before re-minting. No manual step, no email entry. A user
// who has cleared their browser (lost the JWT) re-subscribes from /pricing to
// restore access — the no-account model's inherent recovery limit.
export interface SubscriptionManagerProps {
  plan: Plan;
  initialized: boolean;
  limits: PlanLimits;
  clear: () => void;
}

export const SubscriptionManager = memo(function SubscriptionManager({
  plan,
  initialized,
  limits,
  clear,
}: SubscriptionManagerProps) {
  // `initialized` gates every plan-branch here, mirroring app/page.tsx. The
  // hook's contract (useSubscription.ts) is that callers must NOT branch on
  // `plan` until `initialized` is true: plan starts 'free' synchronously and
  // only becomes authoritative after the validate-token round-trip settles.
  // Without this gate, a returning Pro user with a stored token sees
  // "Current plan: free" for the hundreds of ms (up to the abort deadline on a
  // hung request) until the fetch resolves — a paying user shown an upgrade CTA
  // for their own plan. isPlanFree/isPlanPaid are only meaningful once the plan
  // has resolved.
  const isPlanFree = initialized && plan === 'free';
  const isPlanPaid = initialized && plan !== 'free';
  // Derive the free-tier badge copy from the SAME server-authoritative limits the
  // download gate (canCreateInvoice) and template gate (hasTemplateAccess)
  // enforce, so a server-configured cap change (e.g. 5/month, or a different
  // free-template set) lands in the badge automatically. A hardcoded "3 / 2"
  // literal here would diverge from the enforced cap with no type-system signal
  // (the literal is a string, limits is typed PlanLimits). isPlanFree requires
  // a resolved plan, so limits is the resolved free limits (a template id array)
  // here — guard with Array.isArray for the 'all' shape anyway.
  const freeTemplateCount = Array.isArray(limits.templates) ? limits.templates.length : 0;
  // Pro accesses ALL templates (free + the 10 Pro ones = 12), so the Pro badge
  // advertises templates.length, NOT the count of Pro-tier templates. The prior
  // hardcoded "All 12 templates" literal was a third producer of the template
  // count — the same single-source drift PricingCards was fixed for (R26 #2):
  // adding a template to src/types would bump the clamp/download-gate reality
  // (which read `templates`) but leave this badge advertising "12". Mirroring
  // the free-count derivation (and PricingCards' module-level counts), this is
  // derived from the `templates` single source so a template-array change
  // flows here automatically. `templates` is a module-level constant import, so
  // .length is stable across renders (not a per-render allocation).
  const allTemplateCount = templates.length;

  return (
    <div className="space-y-4">
      {/* Current plan badge */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Current plan: <span className="capitalize">{initialized ? plan : '…'}</span></p>
            <p className="text-xs text-muted-foreground">
              {isPlanFree
                ? `${limits.invoicesPerMonth} invoices/month • ${freeTemplateCount} basic templates • No signup, no account`
                : isPlanPaid
                  ? `Unlimited invoices • All ${allTemplateCount} templates • Logo upload • Data stays in your browser`
                  : `Checking access…`}
            </p>
          </div>
        </div>
      </div>

      {isPlanPaid && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clear}>
          Sign out (switch to free)
        </Button>
      )}
    </div>
  );
});