'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isEmbedMode, isUntrustedFrame, embedKey, CHECKOUT_PARAM, SESSION_ID_PARAM, CHECKOUT_SUCCESS } from '@/lib/embed';
import { errorMessage } from '@/lib/utils';
import { postJson } from '@/lib/stripe-client';
import { PLAN_LIMITS, DEFAULT_LIMITS, type Plan, type PlanLimits } from '@/lib/plan-limits';
import { stripUrlParams } from '@/lib/url';
// Re-export the plan types so existing importers (SubscriptionManager) keep
// resolving from this hook without churn. The canonical definitions live in
// @/lib/plan-limits alongside the single-source PLAN_LIMITS table. (The local
// import above is the binding this file's own signatures use; the re-export is
// for external importers — re-export alone does not create a local name.)
export type { Plan, PlanLimits } from '@/lib/plan-limits';

// Namespaced per session: host uses billify_*, the embed iframe uses
// billify_embed_* so the two never read or write each other's subscription
// state. Evaluated at module load — a given page is either embed or not.
const TOKEN_KEY = embedKey('sub_token');
const PLAN_KEY = embedKey('plan');
// NOTE: there is intentionally no LIMITS_KEY. billify_limits used to be written
// by setSubscription, but nothing ever read it back — every code path derives
// limits from the server response (setLimitsState(data.limits)) or from
// PLAN_LIMITS[plan]/DEFAULT_LIMITS (including the optimistic-restore catch),
// so the persisted JSON was write-only dead state. If a future feature wants to
// restore limits from storage, add the reader then; persisting without a reader
// is dead code.

// Plan type and PlanLimits interface are re-exported above from
// @/lib/plan-limits, and PLAN_LIMITS / DEFAULT_LIMITS are imported from there
// too — that module is the single source of truth (backed by
// api/plan-limits.json, shared with the Stripe server) so the client and
// server limits can never drift. See src/lib/plan-limits.ts for the rationale.

// Exported so app/page.tsx's mount-effect synchronous persist (the handoff /
// ?invoice= persist-fallback branches) can read the OPTIMISTIC plan
// synchronously at mount time to pre-clamp a Pro template for a free user —
// see settlePersist in app/page.tsx. The authoritative plan isn't in React
// state at mount (it's still the synchronous 'free' default; the optimistic
// restore below runs in the same effect flush and hasn't reflected into
// `plan` yet), so the mount-effect persist can't use the closure `plan`
// (which is 'free' for everyone at mount, including a returning Pro user
// mid-resolve). getStoredPlan reads billify_plan directly — the SAME source the
// mount-effect optimistic restore (inlined in the token-bearing branch below)
// uses — giving the optimistic plan synchronously.
export function getStoredPlan(): Plan {
  // Clamp the stored value to the known Plan union. The old `(getItem(PLAN_KEY)
  // as Plan) || 'free'` cast trusted whatever string was in billify_plan — the
  // `as Plan` is TypeScript-only with no runtime check, and `|| 'free'` only
  // catches null/undefined/empty. A non-empty foreign string (disk corruption,
  // a partial write, a manual edit) was returned as-is, so the transient-
  // failure catch restored plan='x' (not 'free', not 'pro'). Downstream every
  // free-tier gate is `plan === 'free'` (isFreeHost), so plan='x' skipped BOTH
  // the free and pro branches — the user got unlimited downloads + all Pro
  // templates with no paywall while the API stayed offline (re-reading the same
  // corrupt value on each transient failure). Treat anything that isn't
  // explicitly 'pro' as 'free' so a corrupt value restores to the RESTRICTIVE
  // plan, mirroring a proper schema validator.
  try {
    return localStorage.getItem(PLAN_KEY) === 'pro' ? 'pro' : 'free';
  } catch { return 'free'; }
}

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setSubscription(plan: Plan, token?: string | null) {
  try {
    localStorage.setItem(PLAN_KEY, plan);
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch { /* storage full */ }
}

function clearSubscription() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLAN_KEY);
  } catch { /* ignore */ }
}

/**
 * Apply a server-authoritative plan to both React state and persistent
 * storage. The three-call sequence (setPlanState + setLimitsState +
 * setSubscription) was hand-rolled identically at the verifySession and
 * validate-token success sites; centralizing it keeps the "persist the
 * server-authoritative plan" contract in one place so a future change can't
 * fix one site and leave the other restoring stale storage. The token is
 * intentionally NOT touched here — verifySession/validate-token/refreshToken
 * carry an unchanged-or-issued token handled separately (refreshToken always
 * carries a freshly issued token, so it goes through applyServerPlan directly).
 */
function applyServerPlan(
  setPlanState: (p: Plan) => void,
  setLimitsState: (l: PlanLimits) => void,
  plan: Plan,
  limits: PlanLimits,
  token?: string | null,
) {
  setPlanState(plan);
  setLimitsState(limits);
  // setSubscription persists the server-authoritative plan to billify_plan (and
  // writes the token when one is passed). Omitting the token (the validate-token
  // path, where it's unchanged) leaves the existing token untouched. Limits are
  // NOT persisted — they're always derived from the server response or
  // PLAN_LIMITS (see the LIMITS_KEY note above), so setSubscription takes no
  // limits arg. verifySession passes the freshly-issued data.token.
  setSubscription(plan, token);
}

/**
 * Reset to the free plan in both React state and persistent storage. The
 * three-call sequence (clearSubscription + setPlanState('free') +
 * setLimitsState(DEFAULT_LIMITS)) was duplicated at the validate-token 401
 * branch and the clear() callback; centralizing it keeps the "permanent
 * rejection → wipe + downgrade" contract in one place.
 */
function resetToFree(
  setPlanState: (p: Plan) => void,
  setLimitsState: (l: PlanLimits) => void,
) {
  clearSubscription();
  setPlanState('free');
  setLimitsState(DEFAULT_LIMITS);
}

export function useSubscription() {
  const [plan, setPlanState] = useState<Plan>('free');
  const [limits, setLimitsState] = useState<PlanLimits>(DEFAULT_LIMITS);
  const [error, setError] = useState<string | null>(null);
  // False until the initial validation settles (embed short-circuit, no-token,
  // validate-token fetch, or verifySession). plan starts 'free' synchronously
  // and only becomes authoritative after this flips true — callers must not
  // branch on `plan` until `initialized` is true, or they act on the stale
  // initial 'free' (e.g. wrongly downgrading a logged-in Pro user's template).
  const [initialized, setInitialized] = useState(false);

  // Live mirror of `initialized` for async callers (handleDownload) that must
  // read it AFTER an await spanning the resolve re-render — the `initialized`
  // closure value they captured at click-time is stale (still false) once the
  // plan settles. Updated in the same effect that drains the waiters (below),
  // so a read in an await-continuation microtask sees the fresh value (microtasks
  // run after the synchronous effect phase of that commit).
  const initializedRef = useRef(false);
  // Resolvers waiting for `initialized` to flip. The effect below fires them when
  // `initialized` becomes true, so awaitInitialized callers resolve the moment
  // the plan settles — no polling.
  const initWaiters = useRef<Array<() => void>>([]);
  // One effect keyed on [initialized] does both jobs the prior two effects did:
  // (1) mirrors `initialized` into initializedRef, and (2) when it flips true,
  // drains and resolves the pending awaitInitialized waiters. Setting the ref
  // before draining the waiters within the same effect preserves the ordering the
  // prior two-effect form relied on effect declaration order for — a merge makes
  // it explicit and removes a redundant [initialized] commit. awaitInitialized's
  // waiter callback just calls finish(true) (it doesn't re-read initializedRef),
  // and its fast-path reads initializedRef.current synchronously at call time, so
  // the ref being up-to-date within this commit is what makes a post-resolve
  // awaitInitialized call hit the fast path instead of pushing a dead waiter.
  useEffect(() => {
    initializedRef.current = initialized;
    if (!initialized) return;
    const waiters = initWaiters.current;
    initWaiters.current = [];
    for (const w of waiters) w();
  }, [initialized]);

  /**
   * Resolve once the plan is AUTHORITATIVE (initialized flipped), or `false` on
   * timeout. handleDownload awaits this before any cap-exempt delivery path so a
   * token-bearing lapsed-Pro user is cap-checked against the server's
   * authoritative 'free' (after validate-token returns 401), NOT the optimistic
   * 'pro' restored from billify_plan during the resolve window — closing the
   * no-devtools grace window where an EXPIRED-JWT lapsed-Pro (validate-token →
   * 401 → resetToFree) could download past the cap before the server said free.
   * A genuine Pro user awaits sub-second (until validate-token confirms Pro)
   * then downloads uncapped, so the optimistic-preview UX win (no flash, button
   * enabled) is preserved.
   *
   * "Authoritative" here means the JWT is valid and unexpired — NOT that the
   * live Stripe subscription is still active. validate-token verifies the JWT
   * signature + exp only and never re-queries Stripe (see api/stripe-server.js:
   * the API is stateless, no revocation list, and the cancellation webhook writes
   * no revocation record). So a CANCELLED Pro whose JWT has not yet hit its 7-
   * day exp still gets plan='pro' from validate-token, and this await does NOT
   * downgrade them — the cancellation grace is bounded to the JWT's 7-day
   * lifetime (an accepted tradeoff of the no-backend model), not closed by this
   * gate. This gate closes only the EXPIRED-token lapsed-Pro window (401 →
   * resetToFree → free).
   *
   * The validate-token fetch ALWAYS sets `initialized` in its finally (even on
   * the abort), but the worst-case settle depends on the branch. Three paths
   * flip `initialized`. Each POST below is made via postJson (src/lib/stripe-
   * client.ts), which wraps `fetchWithTimeout(API_BASE+path, { method: 'POST',
   * credentials: 'include', headers: await postHeaders(), body }, ms)` — so the
   * `fetchWithTimeout` / `postHeaders` primitives named in the budgets are the
   * real mechanism postJson composes, not a stale literal:
   *  - validate-token happy path: the POST is `fetchWithTimeout(..., { headers:
   *    await postHeaders(), ... }, 8000)`, and `await postHeaders()` resolves
   *    BEFORE the POST's 8s timer starts; on a first visit / after the
   *    billify_csrf cookie has aged out, postHeaders runs a SEPARATE
   *    `fetchWithTimeout(API_BASE+'/', ..., 8000)` CSRF prefetch. So the budget
   *    can be 8s (prefetch) + 8s (POST) = 16s.
   *  - validate-token 401 → refresh-token (R37 #0/#1): on an EXPIRED JWT the
   *    POST returns 401 (a response, not an abort) just under its 8s deadline,
   *    then the IIFE calls `await refreshToken(token)`. refreshToken's
   *    `await postHeaders()` reuses the billify_csrf cookie just set by
   *    validate-token's prefetch (~0s, still valid), then fires
   *    `fetchWithTimeout(refresh-token, ..., 10000)` (up to 10s). So this path
   *    is 8s (prefetch) + 8s (validate POST) + 0s (cookie reuse) + 10s (refresh
   *    POST) = 26s — the LARGEST of the three, and setInitialized(true) runs in
   *    the IIFE's finally only AFTER refreshToken resolves, so `initialized`
   *    flips at worst ~26s here.
   *  - verifySession (the ?checkout=success&session_id= redirect): its POST is
   *    `fetchWithTimeout(..., 10000)` (10s), also preceded by the same 8s CSRF
   *    prefetch when the billify_csrf cookie is absent (often so on a Stripe
   *    redirect-back). verifySession's worst case is 8s + 10s = 18s.
   * Callers MUST pass a timeout above this 26s worst case (handleDownload uses
   * 28000 — a 2s margin over 26s) or a merely SLOW-but-reachable API times out
   * on the 401→refresh path, returns `false`, and a lapsed/failed-checkout Pro
   * downloads uncapped — the lapsed-Pro bypass this gate exists to close,
   * triggered by latency rather than devtools. A `false` return (genuinely
   * unreachable past ~26s — the accepted "block the API" trust-model bypass)
   * leaves the caller on the optimistic path: the documented tradeoff of the
   * no-backend model, NOT a regression. See the trust-model note on the
   * transient-failure catch.
   */
  const awaitInitialized = useCallback((timeoutMs: number): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      if (initializedRef.current) { resolve(true); return; }
      let done = false;
      const finish = (v: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      initWaiters.current.push(() => finish(true));
    });
  }, []);

  // Post-checkout session verification. Declared before the mount effect that
  // calls it (the checkout=success redirect path), so there's no use-before-
  // declare — and listed in that effect's deps so the lint knows it's stable
  // (useCallback []), not a stale closure.
  const verifySession = useCallback(async (sessionId: string) => {
    setError(null);
    // A hung /verify-session (proxy holds the connection open, server accepts
    // but never responds, Stripe cold-start stall) would otherwise leave
    // `initialized` false forever — the Download button stays disabled on
    // "Checking access..." and the preview on "Preparing your workspace…" with
    // no in-app recovery. postJson's fetchWithTimeout aborts after 10s (a touch
    // longer than validate-token's 8s to absorb the Stripe session-lookup
    // round-trip this path makes in addition to the API hop), the fetch
    // rejects, and the finally flips initialized so the UI settles.
    try {
      const res = await postJson('/verify-session', { sessionId }, 10000);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Verification failed');

      applyServerPlan(setPlanState, setLimitsState, data.plan, data.limits, data.token);

      // Clean URL params (the success path; the catch path leaves params intact).
      // stripUrlParams (src/lib/url.ts, R35 #7) is the shared URL-cleanup helper
      // — the same one CheckoutCanceledBanner uses on the cancel side and the
      // three /app mount branches use, so the checkout success + cancel + handoff
      // URL-cleaning can't drift. Param names from the centralized embed.ts
      // contract (same as the read above).
      stripUrlParams(CHECKOUT_PARAM, SESSION_ID_PARAM);
    } catch (err) {
      // Includes the abort: the fetch rejects with an AbortError, surfaced here
      // as a user-facing 'Failed to verify purchase' message instead of a
      // permanent hang.
      setError(errorMessage(err, 'Failed to verify purchase'));
    } finally {
      setInitialized(true);
    }
  }, []);

  // R37 #0/#1: silent background refresh of an expired JWT, called from the
  // validate-token 401 path in the mount effect below. The caller's stored
  // (now-expired) JWT is the proof of possession — /refresh-token verifies its
  // signature (exp is NOT enforced there, so an expired-but-signed JWT is
  // accepted as the refresh proof) and re-checks the LIVE Stripe subscription,
  // re-minting a fresh 7-day JWT only if status='active'. This replaces the prior
  // email-only /verify-subscription restore, which minted a server-signed Pro JWT
  // from a bare email with no proof of ownership (a cross-account bypass: anyone
  // with a CSRF cookie could POST a victim's email and get a valid Pro JWT) and
  // doubled as a subscriber-email oracle. An attacker with only an email has no
  // signature-valid JWT, so they cannot refresh; the response carries no email-
  // derived signal, so the endpoint is not an oracle. Returns true on a
  // successful re-issue (plan + fresh token persisted via applyServerPlan), false
  // on any failure (no/invalid JWT, sub canceled, network) — the caller then
  // downgrades to free. Deliberately silent (no setLoading/setError): it is a
  // background refresh, not a user-initiated action, so it must not churn the UI
  // on every 7-day expiry. Stable identity (empty deps) so adding it to the
  // mount-effect deps below does not re-run that one-time effect. Declared BEFORE
  // the mount effect because the effect references it in its deps array (a const
  // referenced in deps is evaluated during render, so it must be initialized
  // above the useEffect call to avoid a temporal-dead-zone ReferenceError).
  const refreshToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await postJson('/refresh-token', { token }, 10000);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.error || !data.token) return false;
      applyServerPlan(setPlanState, setLimitsState, data.plan, data.limits, data.token);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Validate token on mount
  useEffect(() => {
    // One-time reap of the legacy `billify_limits` localStorage key. master's
    // setSubscription wrote billify_limits (a literal, not embed-namespaced) and
    // clearSubscription removed it; this PR deleted both because the key was
    // write-only dead state (see the LIMITS_KEY note above) — nothing ever read
    // it back. The deletion dropped the cleanup contract: an upgrading user who
    // has the orphan in storage keeps it indefinitely, since no remaining path
    // (not clearSubscription, not clearHostInvoiceStorage) touches it. removeItem
    // is idempotent and cheap, so running it unconditionally on every mount reaps
    // the orphan for upgrading users with no per-render cost worth guarding.
    try { localStorage.removeItem('billify_limits'); } catch { /* ignore */ }
    // Embed mode: the SEO page editor is genuinely unlimited with no signup.
    // Short-circuit the whole subscription flow — treat as pro, write nothing,
    // and never fire verifySession from the iframe's ?checkout=success quirk.
    if (isEmbedMode()) {
      // isEmbedMode() reads window.parent.location and is client-only —
      // computing the embed plan during render would mismatch the prerendered
      // HTML, so the initial plan must be set in this mount effect. The
      // synchronous setState is intentional and required (not derivable from
      // render-time state without a hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlanState('pro');
      setLimitsState(PLAN_LIMITS.pro);
      setInitialized(true);
      return;
    }

    // Defense-in-depth for clickjacking: framed but NOT by a trusted same-origin
    // /invoice-template-for/* page. The CSP frame-ancestors 'self' header is the
    // primary defense, but it is operator-deployed and may be absent. If the
    // header is missing and an attacker frames /app, do NOT read the victim's
    // billify_sub_token from localStorage or fire validate-token against the API
    // (which would send their cookie-bearing request from the framed context) —
    // both leak the victim's subscription to the framing page. Refuse at the data
    // layer, mirroring the render-time refusal in page.tsx. plan stays 'free'
    // (uninitialized → initialized free), so nothing host-gated is exposed.
    if (isUntrustedFrame()) {
      // isUntrustedFrame() is client-only; settling initialized here in the
      // mount effect avoids a hydration mismatch.
      setInitialized(true);
      return;
    }

    const token = getToken();
    if (!token) {
      // Check for checkout success redirect. The param names + success value
      // come from the centralized checkout contract in embed.ts (CHECKOUT_PARAM /
      // SESSION_ID_PARAM / CHECKOUT_SUCCESS) — the SAME contract the producer
      // (api/stripe-server.js success_url builder) writes. A bare literal here
      // would drift silently from the producer: a single-side rename (e.g.
      // normalizing snake_case session_id to match the create-checkout-session
      // response's camelCase sessionId) would read session_id=null, skip
      // verifySession, and leave a paying user on the synchronous 'free' plan
      // until their stored JWT auto-refreshes via /refresh-token — with no
      // type-system signal (URLSearchParams.get returns string|null). See embed.ts.
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get(CHECKOUT_PARAM);
      const sessionId = params.get(SESSION_ID_PARAM);
      if (checkout === CHECKOUT_SUCCESS && sessionId) {
        // Post-payment redirect: initialized flips when verifySession resolves
        // (in its finally), so callers gate on a resolved plan — not the
        // synchronous initial 'free' state.
        verifySession(sessionId);
      } else {
        // No token and no checkout: the client-only decision to settle as
        // initialized-free must happen in the mount effect.
        setInitialized(true);
      }
      return;
    }

    // Token-bearing: optimistically restore the stored plan BEFORE validate-token
    // resolves, so a returning Pro user is treated as Pro during the (sub-second,
    // up to 8s abort) resolve window — their saved Pro-tier template preview shows
    // immediately and the Download button isn't disabled — instead of every
    // token-bearing user being stuck on the synchronous 'free' default for the
    // whole round-trip (page.tsx gates previewPending on `plan !== 'pro'`; the
    // Download button is NOT disabled during resolve — that pre-click disable
    // was intentionally removed as redundant). The clamp effect can't fire for a
    // Pro user (it early-returns on plan !== 'free'), so hiding their preview
    // during resolve is pure collateral delay with no benefit. The
    // authoritative validate-token response overrides this; the transient-failure
    // catch below restores the same value; a 401 resets to free. Done in the
    // mount effect (not useState init) so SSR (localStorage unavailable → 'free')
    // and the first client render both start from 'free' — no hydration mismatch
    // — and the effect upgrades to the stored plan right after first paint (one
    // frame, ≪ the validate-token round-trip). Token-gated so a no-token user with
    // a stale billify_plan='pro' in storage can't be handed Pro without a token
    // (they keep the synchronous 'free' default; the no-token branch above does
    // not restore).
    // Inlined optimistic restore (R38-4: restoreOptimisticPlan was a single-use
    // 3-line helper — its docblock was longer than its body, and its "centralize
    // the plan→limits mapping" rationale was self-contradicting with only ONE
    // call site, so the indirection added a hop + a 15-line docblock for a reader
    // following the mount-effect flow with no dedup benefit). Unlike
    // applyServerPlan this is read-only — it projects billify_plan into state
    // WITHOUT persisting (the stored value is already there) and WITHOUT a
    // server round-trip. The transient-failure catch below intentionally does NOT
    // re-run this — the restored value is still in state, so re-applying would
    // be a no-op (see the catch block's comment).
    const storedPlan = getStoredPlan();
    setPlanState(storedPlan);
    setLimitsState(storedPlan === 'pro' ? PLAN_LIMITS.pro : DEFAULT_LIMITS);

    // Validate stored token with server. Runs in an async IIFE so the postJson
    // call can await its CSRF header (postHeaders, which may prefetch the
    // billify_csrf cookie from the health endpoint on a first visit) the same
    // way verifySession/refreshToken do — the validate-token POST, like every
    // other mutating call, MUST send the X-CSRF-Token header the server's
    // global CSRF middleware requires, or it 403s and the 401/403 permanent-
    // rejection branch below downgrades a returning Pro user to free on every
    // load. postJson's fetchWithTimeout aborts after 8s so a hung request can't
    // leave `initialized` false forever (Download button stuck on "Checking
    // access..." with no in-app recovery); the abort rejects the await and
    // falls through to catch, which restores the stored plan (the same path as
    // any transient failure), and finally flips initialized so the UI settles.
    (async () => {
      try {
        const res = await postJson('/validate-token', { token }, 8000);
        if (res.status === 401) {
          // Token explicitly rejected by the server (expired, revoked, or
          // malformed) — the /validate-token route returns 401 for an invalid or
          // expired JWT. R37 #0/#1: instead of downgrading immediately, attempt a
          // proof-of-possession refresh via /refresh-token using the stored
          // (now-expired) JWT — a signature-valid JWT proves the caller is the
          // subscriber (an email-only attacker has no such JWT), and /refresh-token
          // re-checks Stripe (status='active') + re-mints a fresh 7-day JWT, so a
          // paying user stays Pro past expiry WITHOUT the prior manual email
          // restore. If refresh fails (no stored JWT, sub canceled, network),
          // downgrade to free.
          // NOTE: a 403 is NOT a token rejection. The /validate-token route never
          // returns 403 itself; the only 403 source is the global CSRF middleware
          // (a missing/mismatched X-CSRF-Token, e.g. the billify_csrf cookie aged
          // out and the ensureCsrfToken prefetch failed) — a TRANSIENT, retryable
          // condition. Treating 403 as permanent would destroy a paying Pro user's
          // JWT on a momentary CSRF blip with no self-recovery. So a 403 falls
          // through to `!res.ok` below → the catch branch, which restores the
          // stored plan optimistically (the desired behavior for a transient
          // failure), exactly like a network error or 5xx.
          const refreshed = await refreshToken(token);
          if (!refreshed) resetToFree(setPlanState, setLimitsState);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Persist the server-authoritative plan to billify_plan. Without this,
        // a server-side downgrade (Pro → free) updates only the in-memory plan;
        // billify_plan stays 'pro', and the transient-failure catch below would
        // then restore the stale stored 'pro' — re-granting Pro after a
        // cancellation. verifySession/refreshToken already persist; this path
        // must too. The token is unchanged (validate-token doesn't issue a new
        // one), so applyServerPlan's omitted-token arg leaves it in place.
        applyServerPlan(setPlanState, setLimitsState, data.plan, data.limits);
      } catch {
        // Network error, transient server failure (5xx, DNS), OR the abort
        // timeout above firing. Do NOT collapse this into plan='free' — that
        // would downgrade a logged-in Pro user's subscription (and trigger the
        // template clamp in page.tsx, persisting the downgrade via auto-save) on
        // a momentary network blip. Leave the OPTIMISTIC restore from the
        // mount effect above (the inlined getStoredPlan/setPlanState/
        // setLimitsState block) in place: no applyServerPlan runs on the catch
        // path (a 200 doesn't throw, a 401 returns early, the abort/network/5xx
        // paths throw without touching plan/limits), so plan/limits still hold
        // the above restored value and need no re-apply here — an unconditional
        // re-restore would be
        // a no-op (React bails on the same primitive plan + the same module-
        // level limits constant reference) dressed up as belt-and-suspenders
        // against a future edit the current catch path doesn't make, so it was
        // removed rather than left as a load-bearing-looking call to maintain.
        //
        // Trust-model note: the optimistic restore reads billify_plan, a
        // client-writable key, so this is NOT a server authority on the failure
        // path. This app is privacy-first and client-only — there is no backend
        // download/plan authority in this repo (the Stripe API is external and
        // stateless w.r.t. per-download counts). So a determined user can
        // always grant themselves Pro by editing their own browser storage
        // and blocking the API; that is the accepted tradeoff of the no-
        // backend model, not a regression of this path. See the matching note
        // on the free-tier cap in src/app/app/page.tsx.
      } finally {
        setInitialized(true);
      }
    })();
  }, [verifySession, refreshToken]);

  const clear = useCallback(() => {
    resetToFree(setPlanState, setLimitsState);
  }, []);

  // Feature gates
  const canCreateInvoice = useCallback((currentMonthCount: number) => {
    if (plan === 'pro') return true;
    // `limits.invoicesPerMonth` is a finite number by construction — it flows
    // from PLAN_LIMITS (built from api/plan-limits.json: free=3, pro=Number.
    // MAX_SAFE_INTEGER) OR from the server's verbatim limits[plan] over the
    // wire (validate-token / verifySession set limits from data.limits). A
    // configured cap of 0 ("no free invoices" tier) is finite and honored
    // directly (`count < 0` is false). The Number.isFinite guard (R35 #5)
    // defends ONLY against a non-finite cap — NaN/undefined/Infinity from a
    // malformed server response or a bad JSON edit: `count < NaN` is false,
    // which would silently block a free user from creating ANY invoice.
    // Falling back to DEFAULT_LIMITS.invoicesPerMonth (the free cap) restores
    // create-ability WITHOUT re-introducing the `|| 3` default the prior code
    // used — `|| 3` coerced a VALID 0 cap to 3 (falsy-but-valid), whereas
    // Number.isFinite leaves a finite 0 untouched and only catches the
    // genuinely-non-finite case. (Infinity is non-finite here too, but a free-
    // tier cap is never Infinity in the JSON; if it were, the guard falls back
    // to the default rather than letting `count < Infinity` always grant.)
    const cap = Number.isFinite(limits.invoicesPerMonth)
      ? limits.invoicesPerMonth
      : DEFAULT_LIMITS.invoicesPerMonth;
    return currentMonthCount < cap;
  }, [plan, limits]);

  const hasTemplateAccess = useCallback((templateId: string) => {
    if (limits.templates === 'all') return true;
    if (Array.isArray(limits.templates)) {
      return limits.templates.includes(templateId);
    }
    return false;
  }, [limits]);

  return {
    plan,
    limits,
    error,
    initialized,
    verifySession,
    clear,
    canCreateInvoice,
    hasTemplateAccess,
    awaitInitialized,
  };
}
