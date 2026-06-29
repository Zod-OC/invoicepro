// Single source of truth for per-plan feature limits. The data lives in
// api/plan-limits.json and is imported here (client) AND required by
// api/stripe-server.js (server), so the server-emitted limits and the client's
// embed-short-circuit / optimistic-restore limits can NEVER drift. A prior
// duplication of this table in the two files already produced two real drift
// bugs — JSON.stringify(Infinity) === 'null' on the wire (Pro received a null
// cap), and a 'basic' free-template sentinel that matched no real client
// template id and locked email-restored free users out of downloading. A cap
// or free-template-set change now lands in the JSON alone and both producers
// update in lockstep.
//
// pro.invoicesPerMonth is the JSON literal 9007199254740991, which ===
// Number.MAX_SAFE_INTEGER — a large FINITE cap, not Infinity, because the three
// server plan-emitting handlers send limits[plan] verbatim via res.json and
// JSON.stringify(Infinity) === 'null' (see api/stripe-server.js). canCreateInvoice
// short-circuits on plan === 'pro' (returns true before reading the cap), so a
// finite cap is never enforced for Pro — it only needs to survive the wire as a
// real number. The free `templates` array MUST match the free-tier ids declared
// in src/types/index.ts (`templates`), or the download gate (hasTemplateAccess)
// paywalls the very templates the clamp picks.

import raw from '../../api/plan-limits.json';
import { templates } from '../types';

export type Plan = 'free' | 'pro';

export interface PlanLimits {
  invoicesPerMonth: number;
  templates: string[] | 'all';
}

// Construct typed limits from the JSON. The only cast is pro.templates: the
// JSON value is a `string` ('all'); narrow it to the 'all' literal the
// PlanLimits type requires. free.templates is a string[] straight through.
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { invoicesPerMonth: raw.free.invoicesPerMonth, templates: raw.free.templates },
  pro: { invoicesPerMonth: raw.pro.invoicesPerMonth, templates: raw.pro.templates as 'all' },
};

export const DEFAULT_LIMITS: PlanLimits = PLAN_LIMITS.free;

// Plan-feature COUNTS for pricing display, derived from the single source
// (PLAN_LIMITS + the templates table) so every pricing surface reads one
// derivation and a cap / free-template-set / template-tier change in
// api/plan-limits.json or src/types flows to all of them automatically — the
// pricing page (PricingCards), the landing-page teaser (src/app/page.tsx), and
// the download gate (hasTemplateAccess in src/types) stay in lockstep.
// Previously PricingCards derived these inline while the landing teaser
// hardcoded the literals ('3', '10'), making the teaser the lone holdout
// producer that drifted silently on a change — exactly the producer/consumer
// drift the plan-limits module was written to eliminate. Computed at module
// load (module-level constants), so the values are stable across renders.
export const freeInvoiceCap = PLAN_LIMITS.free.invoicesPerMonth;
export const freeTemplateCount = Array.isArray(PLAN_LIMITS.free.templates)
  ? PLAN_LIMITS.free.templates.length
  : 0;
export const proTemplateCount = templates.filter((t) => t.tier === 'pro').length;

// Pro subscription DISPLAY prices — single source for every pricing surface
// (PricingCards PLANS, the landing teaser, the pricing-page metadata) so a price
// change lands in one place. Same lockstep discipline as the counts above.
export const PRO_MONTHLY_PRICE = '€9';
export const PRO_ANNUAL_PRICE = '€6.58';

// Canonical per-plan feature-line LISTS for the detailed pricing card
// (PricingCards) and any surface that shows the SAME full list (the landing
// teaser's Pro card renders this verbatim). Built from the shared counts above
// so a cap / template-set / tier change flows to the feature copy automatically
// — the count-bearing lines ('N invoices per month', 'N basic templates', 'N
// premium templates') are the drift-prone part and now derive from one source.
// R36 #5: the landing teaser's Free card and the SubscriptionManager badge are
// INTENTIONAL variants, NOT consumers of these arrays — the teaser Free is a
// compact marketing subset (4 lines, 'Basic templates' without a count, no
// 'No signup' line) and the badge is a dynamic ' • '-joined one-liner that
// reads live `limits` from useSubscription (so it reflects the active plan,
// not a static marketing list). Forcing either onto this array would change
// their wording or presentation; the static prose lines here ('PDF export',
// 'Logo upload', etc.) have no underlying data source to drift from, so the
// residual non-count prose across the variant surfaces is intentional, not a
// duplication defect. The count lines — the part that CAN drift from
// plan-limits — are centralized here and in the count constants above.
export const FREE_PLAN_FEATURES: readonly string[] = [
  `${freeInvoiceCap} invoices per month`,
  `${freeTemplateCount} basic templates`,
  'PDF export',
  'Auto-save',
  'No signup, no account',
];
export const PRO_PLAN_FEATURES: readonly string[] = [
  'Unlimited invoices',
  `${proTemplateCount} premium templates`,
  'Logo upload',
  'No signup, no account',
  'Data stays in your browser',
  'Cancel anytime',
];