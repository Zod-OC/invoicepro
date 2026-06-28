// Shared URL-param cleanup helper. Strips the given query params from the
// current page's URL and replaces history state with the cleaned URL, so a
// refresh or shared link doesn't re-fire whatever one-time URL-driven behavior
// consumed them (a post-checkout verify, a handoff persist, a cancel banner).
//
// Centralized (R35 #2 / R35 #7) because the SAME `new URL(window.location.href)
// + searchParams.delete + history.replaceState` trailer was hand-rolled at SIX
// sites with no type-system signal — the three /app mount branches
// (HANDOFF/PERSIST/INVOICE, INVOICE/PERSIST/DOWNLOAD, TEMPLATE) in
// app/page.tsx, useSubscription.verifySession (CHECKOUT + SESSION_ID on the
// post-payment success redirect), and CheckoutCanceledBanner (CANCEL on the
// post-cancel redirect). A change to the URL-cleaning approach (router.replace,
// also clearing the hash, keeping other params) would have had to land in all
// six; one of those copies drifting silently is exactly the hazard the
// per-site param-name constants in embed.ts exist to prevent, and the cleanup
// mechanic is the same class of contract. Each call site passes its param names
// from those centralized embed.ts constants, so the names can't drift from this
// helper's behavior. Client-only (window.history). Replaces the prior
// app/page.tsx-local `stripUrlParams(url, ...keys)` (R32 #8), which took a
// pre-built URL — the shared form builds it itself so callers don't each
// construct one.
export function stripUrlParams(...keys: string[]): void {
  const url = new URL(window.location.href);
  for (const k of keys) url.searchParams.delete(k);
  window.history.replaceState({}, '', url.toString());
}