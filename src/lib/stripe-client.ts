import { staticUrl } from '@/lib/site';
import { fetchWithTimeout } from '@/lib/http';

/**
 * Base URL for the stateless Stripe API proxy. On the client, use the page's
 * own origin (same-origin fetches carry the billify_csrf cookie); at build time
 * (next export prerender, where `window`/`document` are undefined) fall back to
 * the canonical SITE_URL. Single source for every mutating call site —
 * useSubscription (validate-token / verify-session / refresh-token) and
 * SubscribeButton (create-checkout-session) — which previously each
 * hand-rolled their own API_BASE + CSRF double-submit helpers and had already
 * drifted (one getCsrfToken had an SSR guard, the other didn't; the cookie-name
 * regex, prefetch URL, and header key had to be kept in lockstep or every POST
 * silently 403'd via the server's global CSRF middleware).
 */
export const API_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/api/stripe`
  : staticUrl('/api/stripe');

/**
 * Read the double-submit CSRF token from the billify_csrf cookie. The cookie is
 * deliberately non-HttpOnly so the client can read it and echo it back in the
 * X-CSRF-Token header — see api/stripe-server.js (HttpOnly would make the token
 * unreadable and break every mutating POST). The actual cross-site CSRF defense
 * is SameSite=Strict on the cookie; the header echo proves same-origin JS read
 * it. Returns null during SSR/prerender or if the cookie is absent/aged out.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/billify_csrf=([a-f0-9]+)/);
  return match?.[1] ?? null;
}

/**
 * Ensure a CSRF token is available, prefetching it from the health endpoint
 * (GET /) if the cookie is absent or has aged out (Max-Age=3600) — the server
 * sets billify_csrf on every GET. Best-effort: a failed prefetch leaves the
 * token null, and the subsequent POST 403s, which the caller handles as a
 * transient failure (e.g. useSubscription's validate-token restores the stored
 * plan rather than downgrading).
 */
export async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfToken();
  if (token) return token;
  try {
    // Bounded by the same abort deadline that protects the subsequent POST.
    // postHeaders() is awaited INSIDE the init object passed to fetchWithTimeout
    // at every call site, so it resolves BEFORE fetchWithTimeout's timer starts —
    // an unbounded prefetch here would defeat the entire timeout chain: a hung
    // health endpoint (the proxy holds the connection open, the server accepts
    // but never responds — the scenario fetchWithTimeout exists for) would leave
    // postHeaders() pending forever, the POST never fires, and for useSubscription
    // validate-token's IIFE never completes → `initialized` stays false and the
    // Download button hangs on "Checking access..." with no in-app recovery. The
    // 8s abort matches validate-token's own deadline; the abort rejects into the
    // catch, token stays null, and the POST 403s → the caller handles it as a
    // transient failure (e.g. useSubscription restores the stored plan), so the UI
    // always settles.
    await fetchWithTimeout(`${API_BASE}/`, { credentials: 'include' }, 8000);
    token = getCsrfToken();
  } catch { /* non-critical — the POST will 403 and the caller handles it */ }
  return token;
}

/**
 * Build headers for a mutating POST: Content-Type plus X-CSRF-Token (when a
 * token is available). Pass extra headers via `extra` if a call site needs more.
 */
export async function postHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const csrf = await ensureCsrfToken();
  return {
    'Content-Type': 'application/json',
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    ...extra,
  };
}

/**
 * POST a JSON body to a stateless Stripe-proxy route with the double-submit
 * CSRF header and a bounded abort. This is the shared mutating-POST init every
 * call site used to hand-write verbatim — `{ method: 'POST', credentials:
 * 'include', headers: await postHeaders(), body: JSON.stringify(<payload>) }`
 * — folded into one helper next to the API_BASE / postHeaders / fetchWithTimeout
 * pieces it composes (R38-2). `path` is the route suffix AFTER API_BASE (e.g.
 * '/validate-token'); `ms` is the per-site abort deadline, kept as a parameter
 * (not hardcoded) so each caller preserves its own budget — verifySession/
 * refreshToken use 10000 (a touch longer for the Stripe session-lookup / live-sub
 * re-check round-trip), validate-token uses 8000, create-checkout-session uses
 * 10000. Returns the raw Response so each caller keeps its own response
 * handling (verifySession applies the plan + strips URL params; refreshToken
 * returns boolean; validate-token branches on 401/403; SubscribeButton redirects
 * to data.url). The await postHeaders() inside the init resolves BEFORE
 * fetchWithTimeout's timer starts — the same ordering every site relied on for
 * its timeout budget (see awaitInitialized's docblock in useSubscription.ts).
 */
export async function postJson(path: string, body: unknown, ms: number): Promise<Response> {
  return fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: await postHeaders(),
    body: JSON.stringify(body),
  }, ms);
}
