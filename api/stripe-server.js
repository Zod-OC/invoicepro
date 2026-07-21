// Billify Stripe API Server v2 — with subscription verification, JWT, rate limiting
// Endpoints:
//   POST /create-checkout-session  → Creates Stripe Checkout Session
//   POST /verify-session           → Verify checkout session_id → JWT
//   POST /refresh-token            → Re-issue JWT from a signature-valid (possibly expired) token + live sub
//   POST /validate-token          → Verify JWT signature + exp → plan claim
//   POST /webhook                  → Stripe webhook receiver
//   GET  /                         → Health check
//
// Env vars:
//   STRIPE_SECRET_KEY         = sk_live_...
//   STRIPE_WEBHOOK_SECRET     = whsec_...
//   JWT_SECRET                = random 256-bit string (for signing tokens)
//   SUCCESS_URL               = https://billify.me/app  (base URL the host /app lives at; checkout=success&session_id={CHECKOUT_SESSION_ID} are appended)
//   CANCEL_URL                = https://billify.me/pricing?canceled=true
//   STRIPE_PRICE_PRO_MONTHLY  = price_live_xxx (Pro monthly)
//   STRIPE_PRICE_PRO_YEARLY   = price_live_xxx (Pro annual)
//   STRIPE_PRICE_TEAM_MONTHLY = price_live_xxx (Team monthly)
//   STRIPE_PRICE_TEAM_YEARLY  = price_live_xxx (Team annual)
//   PORT                      = 3000
//   NODE_ENV                  = production

const express = require('express');
const crypto = require('crypto');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
// SUCCESS_URL must be the host /app route: useSubscription (which calls
// verifySession) only runs on /app, and it gates post-checkout verification on
// BOTH checkout=success AND session_id being present. Stripe substitutes the
// literal {CHECKOUT_SESSION_ID} placeholder with the real session id on
// redirect, so appending it makes session_id actually appear in the URL the
// hook reads — without it, sessionId is always null and a paying user is never
// auto-verified (they stay free until the JWT mint fails and they re-checkout, or
// their stored JWT auto-refreshes via /refresh-token — see useSubscription).
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://billify.me/app';
// CANCEL_URL must be the host /pricing route with ?canceled=true: the pricing
// page's CheckoutCanceledBanner reads exactly that param/value pair and
// surfaces a dismissible 'Checkout canceled' banner, then strips the param. The
// param name ('canceled') and value ('true') are centralized client-side in
// src/lib/embed.ts as CANCEL_PARAM/CANCEL_TRUE (the checkout-cancel half of
// the same contract CHECKOUT_PARAM/SESSION_ID_PARAM/CHECKOUT_SUCCESS is the
// success half of) — this file is CommonJS in a separate container and cannot
// import embed.ts, so the literal is kept byte-identical here and the constant
// is the single source of truth for the reader. If you rename the param, update
// CANCEL_PARAM in embed.ts in lockstep or the banner silently stops firing.
const CANCEL_URL = process.env.CANCEL_URL || 'https://billify.me/pricing?canceled=true';
// R36 #0: bound the window in which a checkout session_id can mint a Pro JWT.
// The session_id rides in the success_url redirect, so it lands in browser
// history, reverse-proxy access logs, and the address bar until the client
// strips it post-mount — anyone who obtains it could POST /verify-session with
// it. The server is stateless (no DB/revocation), so true one-time consumption
// isn't possible; instead the session's `created` timestamp is a stateless
// proxy for one-time: the legitimate post-checkout auto-verify fires within
// seconds of payment (the redirect is immediate), so a 30-minute window is
// ample for the real flow while bounding replay + bearer-leak to 30 min from
// session creation instead of forever. After the window, a paying user
// refreshes via /refresh-token (which re-checks subscription.status=active),
// using their stored (possibly expired) JWT as proof of possession. See
// /verify-session and /refresh-token.
const CHECKOUT_REDEEM_WINDOW_MS = 30 * 60 * 1000; // 30 min

// Checkout redirect contract — the param NAMES + VALUES this server writes into
// success_url / cancel_url, which the client reads via the centralized constants
// in src/lib/embed.ts (CHECKOUT_PARAM/SESSION_ID_PARAM/CHECKOUT_SUCCESS and
// CANCEL_PARAM/CANCEL_TRUE). This file is CommonJS in a separate container and
// cannot import embed.ts, so the canonical values are duplicated HERE as named
// consts (one place to rename on this side) instead of bare string literals
// scattered through the URL builders, and the startup assertion below confirms
// the final URLs actually carry them — catching a single-side rename (or a
// misconfigured CANCEL_URL env var that drops the param) at boot rather than
// silently breaking post-checkout auto-verification (client reads
// session_id=null → paying user stays free) or the cancel banner
// (CheckoutCanceledBanner never fires). Keep these byte-identical to embed.ts.
const CHECKOUT_PARAM = 'checkout';
const SESSION_ID_PARAM = 'session_id';
const CHECKOUT_SUCCESS = 'success';
const CANCEL_PARAM = 'canceled';
const CANCEL_TRUE = 'true';
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!STRIPE_SECRET_KEY) { console.error('FATAL: STRIPE_SECRET_KEY'); process.exit(1); }
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET'); process.exit(1); }

// R36 #4: startup assertion that the checkout/cancel URLs carry the canonical
// contract params. CANCEL_URL is env-overridable, so an operator could set it
// to a URL without ?canceled=true and the cancel banner would silently never
// fire; the success_url builder uses the named consts above by construction,
// but assert a sample build too so a future edit that bypasses the consts is
// caught at boot. Fail fast (mirroring the FATAL checks above) rather than at
// the first paying customer's checkout or the first cancel.
(function assertCheckoutContract() {
  if (!CANCEL_URL.includes(`${CANCEL_PARAM}=${CANCEL_TRUE}`)) {
    console.error(`FATAL: CANCEL_URL must include ${CANCEL_PARAM}=${CANCEL_TRUE} (CheckoutCanceledBanner reads it) — got: ${CANCEL_URL}`);
    process.exit(1);
  }
  const sample = new URL(SUCCESS_URL);
  sample.searchParams.set(CHECKOUT_PARAM, CHECKOUT_SUCCESS);
  let s = sample.toString();
  s += (s.includes('?') ? '&' : '?') + SESSION_ID_PARAM + '={CHECKOUT_SESSION_ID}';
  if (!s.includes(`${CHECKOUT_PARAM}=${CHECKOUT_SUCCESS}`) || !s.includes(`${SESSION_ID_PARAM}=`)) {
    console.error(`FATAL: built success_url does not carry ${CHECKOUT_PARAM}=${CHECKOUT_SUCCESS} + ${SESSION_ID_PARAM}= — got: ${s}`);
    process.exit(1);
  }
})();

// Price IDs from env — swap test→live by changing env vars, no code change needed
// Maps priceId → plan (for webhook/verification reverse-lookup)
const PRICE_IDS = {};

// Plan → { monthly, yearly } price IDs (for checkout session creation)
const PLAN_PRICES = { pro: {}, team: {} };

function registerPrice(envKey, plan, period) {
  const priceId = process.env[envKey];
  if (priceId) {
    PRICE_IDS[priceId] = plan;
    PLAN_PRICES[plan][period] = priceId;
  }
}
registerPrice('STRIPE_PRICE_PRO_MONTHLY',  'pro',  'monthly');
registerPrice('STRIPE_PRICE_PRO_YEARLY',   'pro',  'yearly');
registerPrice('STRIPE_PRICE_TEAM_MONTHLY', 'team', 'monthly');
registerPrice('STRIPE_PRICE_TEAM_YEARLY',  'team', 'yearly');

// R3 fix: removed the silent test-mode price ID fallback. Previously, if any of
// the four STRIPE_PRICE_* env vars were unset, the server would warn and
// silently use hardcoded test price IDs — meaning a production deploy that
// forgot one env var would charge to a test mode price, and live payments
// would fail at the webhook (priceId not in PRICE_IDS). Fail-fast instead.
if (Object.keys(PRICE_IDS).length === 0) {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error(
      'STRIPE_PRICE_* env vars are not set. Required: STRIPE_PRICE_PRO_MONTHLY, ' +
      'STRIPE_PRICE_PRO_YEARLY, STRIPE_PRICE_TEAM_MONTHLY, STRIPE_PRICE_TEAM_YEARLY. ' +
      'Configure these in your deploy env (e.g. Coolify) before going live.'
    );
  }
  console.warn('Dev mode: STRIPE_PRICE_* env vars not set — using test-mode price IDs');
  const TEST_PRICES = {
    'pro':  { monthly: 'price_1TmDYJ0G5k5sFLG4xMEjuHL1', yearly: 'price_1TmDbW0G5k5sFLG4l9YiH5ve' },
    'team': { monthly: 'price_1TmDbX0G5k5sFLG4kYYoLj2N', yearly: 'price_1TmDbX0G5k5sFLG4Ur9Dmh5w' },
  };

  for (const [plan, periods] of Object.entries(TEST_PRICES)) {
    PRICE_IDS[periods.monthly] = plan;
    PRICE_IDS[periods.yearly]  = plan;
    PLAN_PRICES[plan] = periods;
  }
}
// Single source of truth: api/plan-limits.json. The client (src/lib/
// plan-limits.ts) imports the SAME JSON for its embed short-circuit and
// optimistic stored-plan restore, so the server-emitted limits and the client's
// own limits can never drift. A prior inlined copy here diverged from the
// client's copy twice (Infinity → null on the wire; a 'basic' free-template
// sentinel that locked email-restored free users out of downloading) — both
// fixed by making the JSON the one editable place. The three plan-emitting
// handlers below send PLAN_LIMITS[plan] verbatim via res.json (JSON.stringify),
// which is why pro.invoicesPerMonth is the large FINITE literal
// 9007199254740991 (=== Number.MAX_SAFE_INTEGER), NOT Infinity: JSON.stringify
// (Infinity) === 'null', so an Infinity cap would arrive as null on the client
// (a producer/consumer shape disagreement invisible to tsc, since res.json()
// is `any`). canCreateInvoice short-circuits on plan === 'pro' (returns true
// before reading the cap), so a finite cap is never enforced for Pro — it only
// needs to survive the wire as a real number. The free `templates` array must
// match the client's free-tier template ids (src/types/index.ts).
const PLAN_LIMITS = require('./plan-limits.json');

/**
 * Collapse the retired 'team' plan to 'pro'. The client (src/hooks/
 * useSubscription.ts Plan type) models only 'free' | 'pro'; PLAN_LIMITS has no
 * 'team' key, so returning plan='team' would yield limits=undefined and break
 * canCreateInvoice/hasTemplateAccess. PRICE_IDS still registers a 'team' entry
 * when STRIPE_PRICE_TEAM_* env vars are set (or via the TEST_PRICES fallback),
 * and create-checkout-session still accepts planKey='team', so a Team checkout
 * can be created — every plan-emitting handler MUST normalize before returning
 * to the client. Centralized here so the plan-emitting handlers (validate-token,
 * verify-session, refresh-token) can't drift — verify-session previously
 * missed the mapping the others had hand-rolled inline.
 */
function normalizePlan(plan) {
  return plan === 'team' ? 'pro' : plan;
}

const app = express();

// ─── Rate limiting (in-memory, sufficient for MVP) ─
const rateLimit = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30; // 30 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const entry = rateLimit.get(ip) || [];
  const recent = entry.filter(t => t > windowStart);
  if (recent.length >= RATE_MAX) return false;
  recent.push(now);
  rateLimit.set(ip, recent);
  return true;
}

app.use((req, res, next) => {
  // Trust rightmost IP from X-Forwarded-For (from Traefik/nginx)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',').pop()?.trim()
    : req.socket.remoteAddress;
  if (!ip || !checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }
  next();
});

// ─── CORS ───────────────────────────────────────────
const ALLOWED_ORIGINS = IS_PROD
  ? ['https://billify.me', 'https://www.billify.me']
  : ['https://billify.me', 'https://www.billify.me', 'http://localhost:3000'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── CSRF protection (double-submit cookie pattern) ──
// For stateless SPAs: issue a random token via cookie, client must echo it back
// in X-CSRF-Token header. Browsers enforce SameSite=Strict so cross-site forms
// can't read the cookie. Webhook is exempt (uses Stripe signature instead).
app.use((req, res, next) => {
  // Webhook route is exempt from CSRF — Stripe authenticates via signature
  if (req.path === '/webhook') return next();
  // Issue CSRF token cookie on all GET requests (sets/refreshes token)
  if (req.method === 'GET' && !req.headers['x-csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    // NOTE: deliberately NOT HttpOnly. This is a double-submit CSRF token: the
    // client MUST read it via document.cookie and echo it back in the
    // X-CSRF-Token header. HttpOnly would make the cookie unreadable to JS, so
    // postHeaders()/getCsrfToken() could never obtain it and EVERY mutating
    // POST (validate-token, verify-session, create-checkout-session, verify-
    // subscription) would 403 — breaking all legitimate state-changing calls,
    // which is worse than no CSRF protection at all. The CSRF defense here is
    // SameSite=Strict (cross-site requests can't carry the cookie) plus the
    // header echo (proves same-origin JS read it); the token is not a secret
    // from the page's own JS, so it does not need HttpOnly. (Auth credentials
    // like the sub_token JWT live in localStorage, not this cookie.)
    res.setHeader('Set-Cookie', `billify_csrf=${token}; Path=/; SameSite=Strict${IS_PROD ? '; Secure' : ''}; Max-Age=3600`);
  }
  // On mutating requests (POST/PUT/DELETE), validate the double-submit token
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const cookieToken = req.headers.cookie?.match(/billify_csrf=([a-f0-9]+)/)?.[1];
    const headerToken = req.headers['x-csrf-token'];
    // Length must match BEFORE timingSafeEqual: crypto.timingSafeEqual throws a
    // RangeError on mismatched buffer byte lengths, which (uncaught here) would
    // propagate out of the middleware as an unhandled exception → Express 500,
    // not the intended 403. An attacker sending any X-CSRF-Token whose length
    // isn't 64 (the cookie token is always 64 hex chars) would otherwise force a
    // 500 on every mutating endpoint. Mirror the verifyJWT guard
    // (expected.length !== sig.length); the comparison stays constant-time for
    // matching-length tokens.
    if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
      return res.status(403).json({ error: 'CSRF token mismatch' });
    }
  }
  next();
});

// Raw body for webhook only
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));

// ─── Helpers ────────────────────────────────────────
function signJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  try {
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    // timingSafeEqual requires equal-length buffers; if lengths differ, token is invalid
    if (expected.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expected, 'base64url'), Buffer.from(sig, 'base64url'))) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch { return null; }
}

async function stripeFetch(path, opts = {}) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe ${res.status}`);
  return data;
}

// ─── Health check ──────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'Billify Stripe API v2 — OK', time: new Date().toISOString() });
});

// ─── Create checkout session ───────────────────────
// ─── Origin validation for API routes ──────────────
function requireValidOrigin(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  // Allow requests from known origins
  if (origin && ALLOWED_ORIGINS.includes(origin)) return next();
  // Allow same-origin requests with Referer
  if (referer && ALLOWED_ORIGINS.some(o => referer.startsWith(o))) return next();
  return res.status(403).json({ error: 'Invalid origin' });
}

// Apply to checkout and verification endpoints
app.post('/create-checkout-session', requireValidOrigin, async (req, res) => {
  try {
    const { planKey, billingPeriod, email, customerName } = req.body;

    if (!planKey || !PLAN_PRICES[planKey]) {
      return res.status(400).json({ error: 'Invalid or missing planKey' });
    }
    const period = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
    const priceId = PLAN_PRICES[planKey][period];
    if (!priceId) {
      return res.status(400).json({ error: `No price configured for ${planKey}/${period}` });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const successUrl = new URL(SUCCESS_URL);
    // Checkout redirect contract: checkout=success + session_id=<Stripe id>.
    // The canonical names + success value are the named consts above (R36 #4),
    // duplicated from src/lib/embed.ts where the host consumer (useSubscription.
    // ts) imports them — see the consts' docblock for why this CJS container
    // can't share the import and the startup assertion that catches drift.
    // Keep snake_case session_id (it matches Stripe's {CHECKOUT_SESSION_ID}
    // substitution placeholder; normalizing to camelCase would break the
    // placeholder and leave the literal in the URL).
    successUrl.searchParams.set(CHECKOUT_PARAM, CHECKOUT_SUCCESS);
    // Append the Stripe session-id placeholder as a RAW string. searchParams
    // would percent-encode the braces ({CHECKOUT_SESSION_ID} → %7B...), which
    // breaks Stripe's substitution and leaves the literal placeholder in the
    // URL — useSubscription would then gate on session_id='{CHECKOUT_SESSION_ID}'
    // and the verify-session call would 400. The host /app consumes
    // checkout=success&session_id=<real-id> via useSubscription.verifySession.
    let successUrlStr = successUrl.toString();
    successUrlStr += (successUrlStr.includes('?') ? '&' : '?') + SESSION_ID_PARAM + '={CHECKOUT_SESSION_ID}';

    const params = new URLSearchParams({
      'mode': 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': successUrlStr,
      'cancel_url': CANCEL_URL,
      'billing_address_collection': 'auto',
      'automatic_tax[enabled]': 'true',
      'client_reference_id': customerName?.slice(0, 100) || 'billify-user',
      'subscription_data[metadata][source]': 'billify-web',
      'subscription_data[metadata][plan]': PRICE_IDS[priceId],
    });

    if (email) params.append('customer_email', email.toLowerCase().trim());

    const session = await stripeFetch('/checkout/sessions', {
      method: 'POST',
      body: params.toString(),
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ─── Verify session (from success redirect) ──────
app.post('/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await stripeFetch(`/checkout/sessions/${sessionId}`);

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Session not complete or unpaid' });
    }

    // R36 #0: redeem window — refuse a session_id older than
    // CHECKOUT_REDEEM_WINDOW_MS. A Stripe Checkout Session is a HISTORICAL
    // record: status stays 'complete' / payment_status stays 'paid' indefinitely
    // (canceling the subscription does NOT retroactively change the session), so
    // without this bound a user who paid once could re-visit
    // /app?checkout=success&session_id=cs_live_... every 7 days and mint a fresh
    // Pro JWT forever (one payment = lifetime Pro), and anyone who obtained the
    // URL-borne session_id (history/logs/screenshot) could do the same. The
    // legitimate post-checkout auto-verify fires within seconds of payment, so
    // the window is non-blocking for real users; after it, a paying user
    // refreshes via /refresh-token (their stored JWT as proof of possession,
    // which re-checks subscription.status='active'). `created` is a Unix-second
    // timestamp from Stripe.
    const createdMs = (typeof session.created === 'number' ? session.created : 0) * 1000;
    if (!createdMs || Date.now() - createdMs > CHECKOUT_REDEEM_WINDOW_MS) {
      return res.status(400).json({ error: 'Checkout session expired' });
    }

    const subscription = await stripeFetch(`/subscriptions/${session.subscription}`);
    // R36 #0: bind the Pro-grant to a LIVE subscription, not just the historical
    // session.payment_status==='paid'. session.payment_status reflects a point-
    // in-time payment and never changes; subscription.status is the live state.
    // An immediately-canceled subscription has subscription.status='canceled'
    // even though its checkout session is still complete/paid — refuse those so
    // the session_id can't mint Pro for a subscription that's no longer active.
    // (A cancel-at-period-end subscription stays 'active' until the period ends,
    // then flips to 'canceled' — so this correctly grants Pro through a paid
    // period and stops it after.) The validate-token path's 7-day JWT-exp grace
    // assumes issuance happens once for an active subscription; this check makes
    // that assumption hold at issuance time.
    if (!subscription || subscription.status !== 'active') {
      return res.status(400).json({ error: 'Subscription no longer active' });
    }
    const priceId = subscription.items?.data?.[0]?.price?.id;
    // Normalize team→pro so the JWT and the response both carry a plan the client
    // models (PLAN_LIMITS has no 'team' key). Matches validate-token/verify-
    // subscription via the shared normalizePlan() helper.
    const plan = normalizePlan(PRICE_IDS[priceId] || 'free');

    const token = signJWT({
      plan,
      customerId: session.customer,
      subscriptionId: session.subscription,
      email: session.customer_email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    });

    res.json({ token, plan, limits: PLAN_LIMITS[plan] });
  } catch (err) {
    console.error('Verify session error:', err.message);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// ─── Refresh an expired JWT (proof-of-possession re-issuance) ────
//
// R37 #0/#1: the prior /verify-subscription minted a server-signed Pro JWT from
// a BARE EMAIL with no proof of ownership — anyone who could obtain a CSRF
// cookie (via GET /) could POST a victim's email and receive a valid Pro JWT
// carrying the victim's Stripe identity, defeating the monetization wall
// cross-account, and the response differentiated by subscription status (an
// email→plan oracle). This route replaces it with a proof-of-possession
// re-issuance: the caller must present a signature-valid (possibly expired) JWT
// for the identity. An attacker with only an email has NO such JWT — the JWT is
// a bearer only the legitimate subscriber's browser holds (or whoever already
// compromised their localStorage, which is full account compromise for a
// bearer-token model regardless). The response carries no email-derived signal,
// so the endpoint is not an enumeration oracle.
//
// verifyJWT checks signature only (it does NOT enforce exp — exp is enforced
// separately in /validate-token), so an EXPIRED but signature-valid JWT is
// accepted here as the refresh proof: the standard refresh-token model, where
// the long-lived proof (the signed JWT) is exchanged for a fresh short-lived
// access JWT. The access JWT's 7-day exp still bounds a stolen VALID token to
// 7 days on the /validate-token path; this route is the refresh path that keeps
// a paying subscriber in Pro past expiry WITHOUT the prior manual "enter your
// email" step. Revocation: a cancelled subscription has status 'canceled' →
// this route refuses (401) → the client resetToFree, so cancelling the Stripe
// sub is the revocation channel (the stateless API keeps no revocation list).
//
// Re-derives plan from the LIVE subscription's price (not the stale JWT claim),
// so a downgrade/upgrade is reflected at the next refresh. Mirrors
// /verify-session's subscription-status + price→plan logic (shared
// normalizePlan) so the two issuance paths can't drift. Per-IP rate limiting
// (the global middleware) and CSRF (double-submit) apply as on every POST.
app.post('/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token' });
    // Signature only — exp is intentionally NOT checked here (see docblock).
    const payload = verifyJWT(token);
    if (!payload || !payload.subscriptionId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const subscription = await stripeFetch(`/subscriptions/${payload.subscriptionId}`);
    if (!subscription || subscription.status !== 'active') {
      // Canceled/expired sub (or never-active) — refuse refresh; the client
      // downgrades to free. status 'active' covers cancel-at-period-end until
      // the period ends (matches /verify-session).
      return res.status(401).json({ error: 'Subscription no longer active' });
    }
    const priceId = subscription.items?.data?.[0]?.price?.id;
    // Re-derive plan from the live price so a tier change lands at refresh. Team
    // is retired → 'pro' via the shared normalizePlan() helper (parity with
    // /verify-session and /validate-token).
    const plan = normalizePlan(PRICE_IDS[priceId] || 'free');

    const fresh = signJWT({
      plan,
      customerId: subscription.customer,
      subscriptionId: subscription.id,
      email: payload.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    });

    res.json({ token: fresh, plan, limits: PLAN_LIMITS[plan] });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ─── Validate JWT (for client-side refresh) ────────
//
// This route verifies the JWT signature + exp ONLY and returns the plan claim
// baked into the token. It does NOT re-query Stripe for the live subscription
// status, and the API is stateless (no DB, no revocation list). The webhook's
// `customer.subscription.deleted` branch below only logs the cancellation — it
// writes no revocation record, so a cancellation CANNOT invalidate an
// unexpired JWT. Consequence: a cancelled Pro keeps returning plan='pro' here
// (200 OK, valid:true) for the entire remaining JWT lifetime (up to 7 days from
// issue, per signJWT's exp in /verify-session and /refresh-token), and the
// client — which treats validate-token as the authoritative plan signal —
// downloads uncapped with all Pro templates until the JWT finally expires.
//
// This is an ACCEPTED, BOUNDED tradeoff of the privacy-first, no-backend trust
// model (see the matching notes in src/hooks/useSubscription.ts and
// src/app/app/page.tsx): the free-tier cap + Pro-grant are client-only and
// defeatable by design (a user can always block the API and read the optimistic
// 'pro' from their own billify_plan — the sibling "block the API" bypass, also
// accepted). Closing the within-window case requires either a Stripe
// subscription re-check on every validate-token call (puts Stripe in the
// per-load hot path, adds cost/latency, makes the backend authoritative over
// plan — which the model resists — and still doesn't close the block-the-API
// bypass) or a revocation store the stateless API has no place to keep. The
// damage is bounded to the 7-day JWT exp window AND requires a real prior
// subscription (an attacker can't mint a Pro JWT cross-origin — /verify-session
// is bound to a fresh checkout session_id and /refresh-token requires a
// signature-valid JWT the email-only attacker lacks). At JWT expiry this route
// returns 401 → the client now auto-refreshes via /refresh-token, which DOES
// re-check Stripe (subscription.status='active') and re-mints only if the sub is
// still live — so a cancelled Pro is downgraded no later than the next expiry
// (the prior manual "Restore purchased plan" email-restore is gone: R37 #0/#1,
// see /refresh-token). If the residual 7-day window is ever deemed unacceptable,
// shorten the JWT exp — the re-issuance path (/refresh-token) already exists and
// knows the live plan, so a shorter exp no longer degrades the paying-user UX.
app.post('/validate-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token' });
  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return res.status(401).json({ error: 'Token expired' });
  }
  // Map the retired 'team' plan to 'pro' via the shared normalizePlan() helper
  // (parity with /verify-session and /refresh-token). Without this, a
  // still-valid Team JWT (issued before retirement, exp up to 7 days) would
  // yield plan='team' and PLAN_LIMITS['team'] === undefined → the client
  // receives limits=undefined and a plan outside its 'free'|'pro' type.
  const plan = normalizePlan(payload.plan);
  res.json({ valid: true, plan, limits: PLAN_LIMITS[plan] });
});

// ─── Webhook ───────────────────────────────────────
app.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    if (!STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    const parts = sig.split(',').reduce((acc, p) => {
      const [k, v] = p.trim().split('=');
      acc[k] = v;
      return acc;
    }, {});

    if (!parts.t || !parts.v1) {
      return res.status(400).json({ error: 'Invalid signature format' });
    }

    const expected = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(parts.t + '.' + payload, 'utf8')
      .digest('hex');

    // Length must match BEFORE timingSafeEqual: mismatched buffer lengths throw
    // a RangeError (uncaught → 500), same bug already fixed for CSRF above.
    const expectedSig = Buffer.from(expected, 'hex');
    const providedSig = Buffer.from(parts.v1, 'hex');
    if (expectedSig.length !== providedSig.length || !crypto.timingSafeEqual(expectedSig, providedSig)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);
    console.log('Webhook:', event.type, event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Subscription: ${session.id} — ${session.customer_email || 'no email'} — plan: ${session.subscription_data?.metadata?.plan || 'unknown'}`);
        break;
      }
      case 'invoice.payment_succeeded':
        console.log(`✅ Payment: ${event.data.object.id}`);
        break;
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`❌ Failed: ${invoice.id} — customer: ${invoice.customer}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`❌ Cancelled: ${sub.id} — customer: ${sub.customer}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── Start ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Billify Stripe API v2 on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
