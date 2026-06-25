# Billify Stripe Integration — Security Audit Report
**Date:** 2026-05-20
**Auditor:** Hermes Agent
**Scope:** API server, frontend subscription flow, infrastructure, Stripe-specific controls

---

## Executive Summary

The Billify Stripe integration has **two CRITICAL findings** related to secret leakage/compromise, plus several MEDIUM and LOW issues. The API correctly validates price IDs, session payment status, and checkout URLs, but the authentication layer (JWT) is fully compromised because the signing secret was exposed in deployment metadata. Additionally, operational weaknesses (rate-limit bypass, localStorage tampering, and an open port 8000) increase attack surface.

**Immediate actions required:**
1. Rotate the Stripe live secret key and JWT secret **now**.
2. Restrict X-Forwarded-For parsing to the trusted proxy IP.
3. Implement server-side invoice-usage metering to replace the localStorage counter.

---

## 1. API Abuse Vectors

### 1.1 Fake priceId / injection / replay
**Severity:** LOW (mitigated)
**Status:** Price IDs are validated server-side against an explicit allow-list (PRICE_IDS). Stripe session creation is not replayable (Stripe generates unique cs_* IDs). No SQL/NoSQL injection vectors found in the checkout flow.

**Fix:** None required for this vector. Ensure the PRICE_IDS map is kept in sync with the Stripe dashboard.

---

### 1.2 Rate Limiting Bypass
**Severity:** MEDIUM
**Status:** The in-memory rate limiter is functionally effective (429 returned after ~30 req/min), but the IP extraction logic trusts the **leftmost** value of X-Forwarded-For:

```js
const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
```

An attacker can send `X-Forwarded-For: 1.1.1.1, <real-ip>` and the server will rate-limit `1.1.1.1` instead of the real source, effectively bypassing the limiter by rotating spoofed IPs.

**Fix:** Use the **rightmost** untrusted proxy IP, or rely on `req.socket.remoteAddress` because nginx is the only upstream proxy in this architecture:
```js
const ip = req.socket.remoteAddress;
```
If multiple proxies are ever added, use a library such as `request-ip` or parse X-Forwarded-For from the right with a known proxy allow-list.

---

### 1.3 CORS Bypass
**Severity:** INFO
**Status:** The API does **not** reflect Access-Control-Allow-Origin for disallowed origins (evil.com test returned no ACAO header). Browsers will block reading cross-origin responses. However, the server never rejects the request body itself — non-browser clients can hit the API freely. This is expected behavior for a public-ish API, but there is no CSRF token protection. Given the stateless localStorage design, CSRF impact is minimal.

**Fix:** Not strictly required. If you want defense-in-depth, add a custom X-Requested-With header check or a short-lived CSRF nonce for non-idempotent endpoints.

---

### 1.4 JWT Forgery
**Severity:** CRITICAL
**Status:** The JWT implementation is technically correct (HS256, timing-safe comparison, expiry check), but the **secret is compromised**. I forged a valid JWT (plan: team) using the known JWT_SECRET and the server accepted it:

```json
{"valid":true,"plan":"team","limits":{"invoicesPerMonth":null,"templates":"all","watermark":false,"csvExport":true,"teamMembers":5}}
```

Any actor with the secret can bypass all subscription gates.

**Fix:**
1. Immediately rotate JWT_SECRET to a new 256-bit random value.
2. Store the secret in a Docker secret or env var injected at runtime — do **not** commit it to the repo or include it in prompts/logs.
3. Consider adding `aud` (audience = billify.me) and `iss` claims to the token and validating them.
4. Add a `jti` claim and a short revocation list for stolen tokens if a breach is suspected.

---

### 1.5 verify-subscription Email Enumeration / Brute Force
**Severity:** MEDIUM
**Status:** The endpoint queries Stripe by email and returns `plan: "free"` for non-subscribers vs `plan: "pro"/"team"` for subscribers (plus a token). This creates an **oracle** that reveals whether a given email address has an active Billify subscription. Rate limiting (30 req/min) slows brute force but does not eliminate it.

**Fix:**
- Return a **uniform response** regardless of subscription existence (e.g., always return `{valid: false}`) and only deliver tokens via a **signed magic link sent to the email**.
- Alternatively, add exponential backoff / CAPTCHA after a few failed lookups.

---

## 2. Frontend Security

### 2.1 Plan Bypass via localStorage
**Severity:** LOW (partially mitigated)
**Status:** The `useSubscription` hook initializes state to 'free' and only promotes it after **server-side token validation**. Directly editing `localStorage.setItem('billify_plan', 'team')` and refreshing does **not** grant access because the hook ignores PLAN_KEY on mount unless a valid token is present.

However, if an attacker already possesses a **valid forged JWT** (see 1.4) and writes it to localStorage, the hook will validate it and grant full access.

**Fix:** Ensure JWT secret rotation (1.4). Additionally, validate the token on **every sensitive action** (not just mount) if you want defense-in-depth, though the current flow is acceptable for an SPA.

---

### 2.2 Monthly Invoice Counter Tamper-Proofing
**Severity:** MEDIUM
**Status:** The counter is stored in localStorage under `billify_count_YYYY-MM`:

```js
const key = `billify_count_${new Date().toISOString().slice(0, 7)}`;
localStorage.setItem(key, String(next));
```

A free-tier user can bypass the 3-invoice/month limit by:
- Opening DevTools and deleting/editing the key.
- Using a private/incognito window (fresh localStorage).

**Fix:** Move usage metering to the **server**.
- Add a lightweight `POST /api/stripe/usage` endpoint backed by a database or Redis counter keyed by customerId or IP.
- Gate generatePDF downloads behind this server-side check.
- Keep a client-side cache for UX, but treat it as untrusted.

---

### 2.3 XSS in Paywall / Subscription Components
**Severity:** LOW
**Status:** No direct XSS vectors found in PaywallModal.tsx or SubscriptionManager.tsx — they render only static text and Lucide icons.

**Potential indirect XSS:** In page.tsx, the invoice preview renders user-supplied fields. React escapes text content by default, so standard XSS is mitigated. However, **logo upload** uses:

```jsx
<img src={invoice.from.logo} alt="logo" className="..." />
```

The upload validation only checks `base64.startsWith('data:image/')`. An attacker can upload an SVG with `data:image/svg+xml;base64,...` containing JavaScript. When rendered in the preview <img>, SVG scripts may execute in some browsers/contexts.

**Fix:**
- Restrict logo MIME types in the ALLOWED_LOGO_TYPES constant to image/png, image/jpeg, image/webp only.
- After FileReader loads the file, parse the actual file header (magic bytes) before accepting it.
- Sanitize SVG content if SVG support is intentionally required.

---

## 3. Infrastructure

### 3.1 Stripe Secret Key Isolation
**Severity:** CRITICAL (operational)
**Status:** The source code correctly loads STRIPE_SECRET_KEY from process.env and the Dockerfile runs as USER node. The secret is **not** hardcoded in the repository image.

**However, the live secret key was exposed in the deployment context / task prompt (`sk_live_...`).** If this prompt is logged, stored, or shared, the key is fully compromised.

**Fix:**
1. **Rotate the Stripe secret key immediately** in the Stripe Dashboard.
2. Verify no old keys are present in shell history, CI logs, or chat logs.
3. Use Docker secrets or a vault (e.g., Coolify secrets, Doppler, 1Password) instead of plain env vars in documentation.

---

### 3.2 API Container Direct Internet Exposure
**Severity:** LOW
**Status:** The Stripe API container (billify-stripe-api:3000) is **not** directly reachable on common ports from the internet. Port scans on billify.me:3000 returned closed. Port 8000 is open but serves unrelated HTML (likely a Coolify panel or other service), not the Stripe API.

**Fix:** Close port 8000 if it is not required publicly, or harden the service running there.

---

### 3.3 Webhook Endpoint Accessibility and Signature Enforcement
**Severity:** LOW
**Status:** The webhook is publicly accessible (as required by Stripe). It **does** enforce signature verification via manual HMAC. My probe without a valid signature was rejected.

**Two sub-issues:**
1. The response "Webhook secret not configured" leaks operational state — an attacker can probe to determine if STRIPE_WEBHOOK_SECRET is set.
2. The manual signature parser is fragile; Stripe recommends `stripe.webhooks.constructEvent()`.

**Fix:**
- Return a generic 400 error message for all webhook failures (e.g., `{"error":"Invalid request"}`).
- Migrate to the official Stripe SDK webhook verification method to stay compatible with future signature formats.

---

## 4. Stripe-Specific Controls

### 4.1 Price ID Validation
**Severity:** INFO (positive finding)
**Status:** create-checkout-session validates priceId against an explicit PRICE_IDS map before calling Stripe. No arbitrary price IDs are accepted.

---

### 4.2 Checkout Success URL Manipulation / Open Redirect
**Severity:** INFO (positive finding)
**Status:** The success URL is constructed server-side from the SUCCESS_URL environment variable; users cannot inject arbitrary redirect targets. No open redirect vulnerability exists.

---

### 4.3 verify-session Payment Status Check
**Severity:** INFO (positive finding)
**Status:** The endpoint correctly verifies:

```js
if (session.status !== 'complete' || session.payment_status !== 'paid') {
  return res.status(400).json({ error: 'Session not complete or unpaid' });
}
```

This prevents granting premium access to unpaid or abandoned sessions.

---

## Remediation Priority Matrix

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| 1 | Rotate Stripe and JWT secrets (exposed in context) | **CRITICAL** | Low |
| 2 | JWT forgery possible with known secret | **CRITICAL** | Low |
| 3 | Rate-limit bypass via spoofed X-Forwarded-For | **MEDIUM** | Low |
| 4 | Email enumeration in verify-subscription | **MEDIUM** | Medium |
| 5 | Invoice counter is client-side only | **MEDIUM** | Medium |
| 6 | SVG/logo XSS possibility | **MEDIUM** | Low |
| 7 | Port 8000 open (unrelated service) | **LOW** | Low |
| 8 | Webhook info leak + manual sig verification | **LOW** | Low |
| 9 | No CSRF tokens / CORS blocking | **INFO** | Low |

---

## Files Reviewed

- `/root/projects/invoicepro/api/stripe-server.js`
- `/root/projects/invoicepro/src/hooks/useSubscription.ts`
- `/root/projects/invoicepro/src/components/SubscribeButton.tsx`
- `/root/projects/invoicepro/docker-billify/nginx.conf`
- `/root/projects/invoicepro/src/app/app/page.tsx`
- `/root/projects/invoicepro/src/components/PaywallModal.tsx`
- `/root/projects/invoicepro/src/components/SubscriptionManager.tsx`
- `/root/projects/invoicepro/src/lib/pdf.ts`
- `/root/projects/invoicepro/api/Dockerfile`
- `/root/projects/invoicepro/docker-billify/Dockerfile`

---

*End of report.*
