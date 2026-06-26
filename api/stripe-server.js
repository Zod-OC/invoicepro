// Billify Stripe API Server v2 — with subscription verification, JWT, rate limiting
// Endpoints:
//   POST /create-checkout-session  → Creates Stripe Checkout Session
//   POST /verify-session           → Verify checkout session_id → JWT
//   POST /verify-subscription      → Check email → active plan from Stripe
//   POST /webhook                  → Stripe webhook receiver
//   GET  /                         → Health check
//
// Env vars:
//   STRIPE_SECRET_KEY         = sk_live_...
//   STRIPE_WEBHOOK_SECRET     = whsec_...
//   JWT_SECRET                = random 256-bit string (for signing tokens)
//   SUCCESS_URL               = https://billify.me/pricing?success=true
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
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://billify.me/pricing?success=true';
const CANCEL_URL = process.env.CANCEL_URL || 'https://billify.me/pricing?canceled=true';
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!STRIPE_SECRET_KEY) { console.error('FATAL: STRIPE_SECRET_KEY'); process.exit(1); }
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET'); process.exit(1); }

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

// Fallback to test-mode IDs if env not set (dev/preview only)
if (Object.keys(PRICE_IDS).length === 0) {
  console.warn('WARNING: STRIPE_PRICE_* env vars not set — using test-mode price IDs');
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

const PLAN_LIMITS = {
  free: { invoicesPerMonth: 3, templates: ['basic'] },
  pro: { invoicesPerMonth: Infinity, templates: 'all' },
};

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
app.use('/webhook', (req, res, next) => next());

app.use((req, res, next) => {
  // Issue CSRF token cookie on all GET requests (sets/refreshes token)
  if (req.method === 'GET' && !req.headers['x-csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie', `billify_csrf=${token}; Path=/; HttpOnly; SameSite=Strict${IS_PROD ? '; Secure' : ''}; Max-Age=3600`);
  }
  // On mutating requests (POST/PUT/DELETE), validate the double-submit token
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const cookieToken = req.headers.cookie?.match(/billify_csrf=([a-f0-9]+)/)?.[1];
    const headerToken = req.headers['x-csrf-token'];
    if (!cookieToken || !headerToken || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
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
    successUrl.searchParams.set('checkout', 'success');

    const params = new URLSearchParams({
      'mode': 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': successUrl.toString(),
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

    const subscription = await stripeFetch(`/subscriptions/${session.subscription}`);
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const plan = PRICE_IDS[priceId] || 'free';

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

// ─── Verify subscription by email ────────────────
app.post('/verify-subscription', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Search Stripe customers by email
    const customers = await stripeFetch(`/customers/search?query=email:'${encodeURIComponent(normalizedEmail)}'`);

    let plan = 'free';
    let customerId = null;
    let subscriptionId = null;

    for (const customer of customers.data || []) {
      const subs = await stripeFetch(`/subscriptions?customer=${customer.id}&status=active&limit=1`);
      if (subs.data?.length > 0) {
        const sub = subs.data[0];
        const priceId = sub.items?.data?.[0]?.price?.id;
        let detectedPlan = PRICE_IDS[priceId];
        // Team tier is retired (no UI to subscribe). Map to 'pro' so existing
        // Team subscribers keep working after their renewal.
        if (detectedPlan === 'team') detectedPlan = 'pro';
        if (detectedPlan) {
          if (detectedPlan === 'pro' || plan === 'free') {
            plan = detectedPlan;
            customerId = customer.id;
            subscriptionId = sub.id;
          }
        }
      }
    }

    const token = plan !== 'free' ? signJWT({
      plan,
      customerId,
      subscriptionId,
      email: normalizedEmail,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    }) : null;

    res.json({ plan, limits: PLAN_LIMITS[plan], token });
  } catch (err) {
    console.error('Verify subscription error:', err.message);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
});

// ─── Validate JWT (for client-side refresh) ────────
app.post('/validate-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token' });
  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return res.status(401).json({ error: 'Token expired' });
  }
  res.json({ valid: true, plan: payload.plan, limits: PLAN_LIMITS[payload.plan] });
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

    if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'))) {
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
