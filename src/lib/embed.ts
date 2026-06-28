import { Invoice, validateInvoice, generateId } from '@/types';
import { PROFESSION_PATH_PREFIX } from '@/lib/site';

/**
 * Shared URL query-param + postMessage type constants for the embed/handoff
 * contract. The writer (EmbeddedEditor) and reader (app/page.tsx) used to
 * duplicate these as bare string literals, which drifts silently — a rename on
 * one end breaks the handoff/prefill with no type-system help. Centralizing
 * here means both ends import one source of truth.
 */
export const EMBED_PARAM = 'embed';
export const INVOICE_PARAM = 'invoice';
export const HANDOFF_PARAM = 'handoff';
export const PERSIST_PARAM = 'persist';
// The embed "Open full-screen" DOWNLOAD CTA's storage-full fallback (?invoice=
// when the handoff stash couldn't be written) carries a one-time same-origin
// "download" flag under this param, consumed by the host /app mount to load the
// scratch READ-ONLY but DOWNLOADABLE — skipping the isPrefill anti-phishing
// gate (yellow "came from a shared link" warning + Download disabled until
// adopt) that a genuine passive share link triggers. The download CTA is the
// user's OWN same-origin scratch (they explicitly chose to download it), so
// classifying it as an untrusted share link would show a misleading phishing
// warning about their own invoice and force needless adoption friction. The
// same-origin flag is unforgable cross-origin (only the embed iframe, same-
// origin with /app, can stash it), mirroring the persist flag's security model.
export const DOWNLOAD_PARAM = 'download';
// The /templates "Use Template" links navigate to /app?template=<id>. This is
// the only param the templates page emits and the host /app mount consumes, so
// it joins the centralized embed/handoff contract surface here (one source of
// truth for both ends) instead of being a bare string literal on one side that
// the other side never read — which is exactly the producer/consumer mismatch
// this constant exists to prevent.
export const TEMPLATE_PARAM = 'template';
// Checkout redirect contract — the one cross-file URL-param pair that lives
// OUTSIDE the embed/handoff surface (the embed params above are writer=
// EmbeddedEditor/reader=app/page.tsx; these are writer=api/stripe-server.js
// success_url builder / reader=useSubscription.ts post-checkout redirect).
// Both ends used bare literals ('checkout'/'session_id'/'success'), which drifts
// silently: a single-side rename (e.g. normalizing the snake_case session_id to
// match the create-checkout-session response's camelCase sessionId field) would
// break post-checkout auto-verification — useSubscription would read
// session_id=null, skip verifySession, and a paying user stays on the
// synchronous 'free' plan until their stored JWT auto-refreshes via
// /refresh-token, with no type-system signal (URLSearchParams.get returns
// string|null). Keep
// snake_case here: it is the current working value on both sides and matches
// the Stripe success_url substitution placeholder {CHECKOUT_SESSION_ID}.
export const CHECKOUT_PARAM = 'checkout';
export const SESSION_ID_PARAM = 'session_id';
export const CHECKOUT_SUCCESS = 'success';
// Checkout CANCEL redirect contract — the cancel_url pair. The success pair
// above (CHECKOUT_PARAM/SESSION_ID_PARAM/CHECKOUT_SUCCESS) is written by
// api/stripe-server.js's success_url builder and consumed by useSubscription's
// post-checkout redirect on /app. The cancel pair is the OTHER half of the
// same redirect: written by the cancel_url builder
// (https://billify.me/pricing?canceled=true) and consumed by
// CheckoutCanceledBanner on /pricing. Prior to this the pricing page never
// read ?canceled=true at all — the producer wrote it and nothing consumed it
// (a canceled checkout silently landed on /pricing with no acknowledgement),
// the dangling producer the R34 #6 review finding flagged. Centralizing the
// param name + value here means a single-side rename (e.g. the canceled↔
// cancelled spelling, or normalizing to match a Stripe cancel_url placeholder)
// is caught by the type system on both ends instead of drifting silently —
// exactly the producer/consumer mismatch the CHECKOUT_* constants above exist
// to prevent. Keep 'canceled' (one l): it is the current working value on the
// producer side and matches the bare literal in CANCEL_URL.
export const CANCEL_PARAM = 'canceled';
export const CANCEL_TRUE = 'true';
export const MSG_SYNC_REQUEST = 'billify-sync-request';
export const MSG_INVOICE_FRESH = 'billify-invoice-fresh';

/**
 * Trusted-message receive helper for the embed↔host postMessage contract. Both
 * ends (EmbeddedEditor.onFresh and app/page.onMessage) hand-rolled the same
 * scaffolding — same-origin guard + payload-shape cast + type match — which is
 * security-sensitive (the origin check is the sole barrier stopping a cross-
 * origin frame from driving the on-demand handoff). Centralizing it here means a
 * future tightening (e.source validation, a nonce) lands in one place, not in
 * lockstep across two files with no type-system help — exactly the
 * producer/consumer drift the MSG_* constants were centralized to prevent.
 *
 * Returns the raw listener to add/remove, matching addEventListener's shape.
 * `handler` receives the validated payload (typed only with `type` plus whatever
 * the caller narrows via the generic); each call site declares only the fields
 * it reads, so the two listeners' payload types can stay intentionally different
 * (onFresh reads `invoice`, onMessage doesn't) without that being "drift".
 */
export function onTrustedMessage<T extends { type?: string } = { type?: string }>(
  type: string,
  handler: (e: MessageEvent, payload: T) => void,
): (e: MessageEvent) => void {
  return (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    const payload = e.data as T | null;
    if (!payload || payload.type !== type) return;
    handler(e, payload);
  };
}

/**
 * Embed mode = the Billify editor is rendered inside an iframe on a
 * programmatic-SEO page (/invoice-template-for/[profession]/). The iframe is
 * same-origin, so it shares localStorage/cookies with the top-level /app
 * session — it is NOT an isolation boundary. Embed mode engineers that
 * isolation: namespaced storage keys, disabled paywall, no auto-save.
 */
export function isEmbedMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // The embed iframe must (a) actually be framed — not a top-level tab — and
    // (b) be framed by a same-origin /invoice-template-for/* page on this site.
    // Without the framing check, anyone opening /app?embed=true in a normal tab
    // spoofs embed mode and gets Pro for free (useSubscription short-circuits to
    // plan='pro'). Without the same-origin check, a third-party site could embed
    // the editor for free. Without the pathname check, any other same-origin page
    // (a future blog/profile page, or an open-redirect) could embed /app?embed=
    // true and unlock Pro for its visitors — the embed privilege is scoped to
    // the programmatic-SEO profession pages only. Accessing a cross-origin
    // parent's location throws.
    if (window.self === window.top) return false;
    if (new URLSearchParams(window.location.search).get(EMBED_PARAM) !== 'true') return false;
    if (window.parent.location.origin !== window.location.origin) return false;
    return window.parent.location.pathname.startsWith(PROFESSION_PATH_PREFIX);
  } catch {
    return false; // cross-origin parent or sandboxed frame → not a trusted embed
  }
}

/**
 * Detect an UNAUTHORIZED embed: the page is framed (not top-level) but NOT by
 * a trusted same-origin /invoice-template-for/* page. This covers a
 * third-party site framing /app?embed=true (cross-origin parent —
 * isEmbedMode's parent.location access throws → false) or a same-origin
 * non-SEO page framing it. In both cases isEmbedMode() returns false, so
 * without this guard the editor would run in HOST mode inside the frame —
 * exposing the victim's billify_* storage/subscription and enabling
 * clickjacking. The CSP frame-ancestors 'self' header is the primary defense
 * (it blocks the framing outright), but it is operator-deployed and may be
 * absent (nginx/Coolify misconfiguration) — this is defense-in-depth so the
 * app refuses to render the host editor even if the header is missing.
 */
export function isUntrustedFrame(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.self === window.top) return false; // top-level tab — trusted
  return !isEmbedMode(); // framed but not the trusted SEO embed → untrusted
}

/**
 * Storage-namespace prefixes. Host sessions use `billify_*` and the embed
 * iframe uses `billify_embed_*` so the two never read or write each other's
 * data. HOST_PREFIX is the single source of truth for the host namespace —
 * embedKey's host branch and the handoff stash prefix both derive from it, so a
 * rename lands everywhere at once instead of orphaning handoff stashes under
 * the old prefix.
 */
const HOST_PREFIX = 'billify_';
const EMBED_PREFIX = 'billify_embed_';

// Cache isEmbedMode() once at module load. Its result is invariant for a page's
// lifetime (embed mode can't toggle without a full navigation), yet embedKey is
// called 3× per debounced save (logoStorageKey('from') + logoStorageKey('to') +
// embedKey('current')) and each call re-ran isEmbedMode() — a URLSearchParams
// parse + window.parent.location access on the after-every-edit save path.
// Module evaluation is per-document (once per page load), the right granularity
// across the embed/host boundary — the same pattern useSubscription.ts uses for
// TOKEN_KEY/PLAN_KEY. isEmbedMode() stays exported for the live mount-effect
// frame checks (isUntrustedFrame etc.); only embedKey's hot path reads the
// cache, and the two can't disagree (embed mode is stable for the page's life).
const IS_EMBED = isEmbedMode();

/**
 * Namespaced storage key. Host session uses `billify_*`; the embed iframe uses
 * `billify_embed_*` so the two never read or write each other's data.
 */
export function embedKey(base: string): string {
  return IS_EMBED ? `${EMBED_PREFIX}${base}` : `${HOST_PREFIX}${base}`;
}

/**
 * Storage key for a side's (from/to) logo. Logos are stored OUTSIDE the main
 * `current` invoice blob so the debounced save doesn't re-serialize the
 * immutable ~1 MB data URL on every keystroke — only the small text fields are
 * re-written to `current`, and a logo key is (re)written only when the logo
 * actually changes. See persistInvoice in src/app/app/page.tsx. Embed mode
 * never auto-saves, so only host (`billify_logo_from`/`_to`) keys are ever
 * written; the embed-namespace counterparts exist only for symmetry.
 */
export function logoStorageKey(side: 'from' | 'to'): string {
  return embedKey(side === 'from' ? 'logo_from' : 'logo_to');
}

/**
 * Remove every key the host uses to persist an invoice — the text-only
 * `current` blob plus the two logo side-keys. Used by the error boundary's
 * "Clear & Reload" so a corrupted session doesn't leak stale logos back into a
 * freshly-cleared invoice on the next load (the load path reassembles logos
 * from these keys, so leaving them behind would undo the clear).
 */
export function clearHostInvoiceStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(embedKey('current'));
    localStorage.removeItem(logoStorageKey('from'));
    localStorage.removeItem(logoStorageKey('to'));
  } catch { /* storage unavailable — nothing to clear */ }
}

/**
 * URL-safe (base64url) encode of a full Invoice, for the embed/handoff URL
 * contract: `/app?embed=true&invoice=<encoded>`. Used both for the profession
 * prefill (EmbeddedEditor) and the lossless "Edit in full-screen" handoff.
 */
export function encodeInvoice(invoice: Invoice): string {
  const bytes = new TextEncoder().encode(JSON.stringify(invoice));
  // Build the binary string in chunks. String.concat on each byte (the naive
  // bytes.forEach form) is O(n²) — each append copies the whole accumulator —
  // which stalls the main thread for large invoices (e.g. a ~1 MB logo).
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Upper bound on a ?invoice= param before attempting to decode it. atob + the
 * Uint8Array indexed loop materialize the full binary string in memory and walk
 * it per char, so a crafted multi-MB ?invoice= param would stall the main
 * thread on the /app mount path (the same per-byte cost encodeInvoice avoids on
 * the encode side). Legit ?invoice= uses are always small: the embed prefill
 * carries no logo (profession defaults only) and the logo-stripped share-link
 * fallback is capped at 2000 chars by handoffUrl — logos travel via the handoff
 * stash (peekHandoff/consumeHandoff), never through ?invoice=. 256KB is far above any real
 * payload yet blocks the atob-DoS; atob of 256KB is a few ms, vs. seconds for a
 * multi-MB crafted blob.
 */
const MAX_INVOICE_PARAM_LEN = 256 * 1024;

/** Decode a base64url Invoice param; returns null if missing or invalid. */
export function decodeInvoice(s: string | null): Invoice | null {
  if (!s) return null;
  // Bound before atob so a crafted oversized param can't stall the main thread.
  if (s.length > MAX_INVOICE_PARAM_LEN) return null;
  try {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    // Pre-sized typed array + indexed loop. Uint8Array.from(bin, fn) dispatches
    // a function call per char (~1.4M calls for a ~1MB-logo share link after atob)
    // and measured ~36x slower than this form on a 1.4MB binary string — main-
    // thread jank on the /app mount path. Mirrors the chunked pattern in
    // encodeInvoice: avoid per-element callbacks on large payloads.
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return validateInvoice(JSON.parse(json));
  } catch {
    return null;
  }
}

/**
 * One-time same-origin handoff channel for "Edit in full-screen". The full
 * invoice (which may include a ~1 MB logo data URL) is too large for a URL
 * param — browsers/nginx cap navigation URLs well below that, so encoding it
 * into ?invoice= silently lost the user's scratch edit. Instead stash the
 * invoice in localStorage under a short token and carry only the token in the
 * URL: `/app?handoff=<token>`. The host /app consumes it once via
 * consumeHandoff() (after peekHandoff validates), which deletes the key.
 * Client-only (Date.now/Math.random are fine here — never called from a
 * build-time render path).
 *
 * Returns null if the stash could not be persisted (localStorage full / disabled)
 * — the caller MUST handle this and fall back to the ?invoice= URL form, since
 * opening /app?handoff=<dead-token> would land the user on an empty invoice and
 * silently lose their scratch edit.
 */
const HANDOFF_PREFIX = HOST_PREFIX + 'handoff_';
const HANDOFF_TTL_MS = 10 * 60 * 1000; // 10 minutes — well past any realistic handoff
// Rate-limit the orphan sweep: cleanupStaleHandoffs runs on EVERY /app mount,
// including the embed iframe that mounts on each profession-page visit. When an
// orphaned handoff exists (popup blocked / host tab closed before consume) it
// carries up to a ~1MB logo data URL, and without a rate limit the sweep's
// localStorage.getItem materializes that ~1MB on EVERY mount — including every
// embed iframe on every profession page browsed — for the full TTL window. The
// last-sweep timestamp (a tiny value, shared same-origin across host + embed)
// lets a mount skip the scan entirely if any same-origin tab swept within the
// last SWEEP_MIN_INTERVAL_MS, bounding the per-mount read cost to once per
// interval instead of once per mount. Expired orphans are still reaped within
// SWEEP_MIN_INTERVAL_MS by whichever mount runs first — negligible vs the 10-
// minute TTL. This does NOT change the handoff key/value format (the ts-in-key
// rewrite was rejected for backward-compat — see the cleanupStaleHandoffs
// comment), so a pending handoff at the deploy cutover is unaffected.
// NOTE: this key is deliberately OUTSIDE the HANDOFF_PREFIX namespace
// (`billify_last_handoff_sweep`, not `billify_handoff_last_sweep`). The sweep
// scans every key starting with HANDOFF_PREFIX and deletes any whose stashed
// timestamp parses as stale. If the last-sweep marker lived under
// HANDOFF_PREFIX, the scan would visit it, read its bare `String(now)` value
// (no `;` separator) → ts=NaN → stale → delete it — so every full scan would
// delete its own rate-limit marker and the next mount would always run a full
// scan, making the throttle inert (the per-mount ~1MB re-read jank it exists to
// prevent). Keeping it outside the prefix means the scan never visits it.
const HANDOFF_LAST_SWEEP_KEY = HOST_PREFIX + 'last_handoff_sweep';
const SWEEP_MIN_INTERVAL_MS = 60 * 1000; // 1 minute — bounds orphan re-read cost

// One-time same-origin "persist" flag for the embedded editor's "Open in
// full-screen" handoff. The producer (EmbeddedEditor, running inside the
// same-origin embed iframe) stashes a flag under this prefix and carries only
// the token in the ?persist=<token> URL param; the host /app mount peeks it via
// peekPersistFlag (validate WITHOUT deleting) before persisting the handed-off
// invoice to the host's billify_current storage (embedKey('current'), i.e.
// HOST_PREFIX + 'current'), and consumes it via consumePersistFlag (delete)
// only AFTER the durable write succeeds — so a QuotaExceededError leaves the
// flag for a reload to re-peek + re-attempt the auto-persist (R34 #1; the prior
// one-call eager-consume form consumed the flag before the write and burned it
// on a failed persist). This replaces the old ?persist=1 boolean +
// document.referrer gate: the referrer is forgeable (an attacker page can
// navigate /app?invoice=<their-invoice>&persist=1 and the referrer check passes
// against any same-origin opener path), so a forged persist=1 could trick /app
// into saving an attacker-chosen invoice into the victim's storage. The same-
// origin localStorage flag is unforgable cross-origin (only the embed iframe,
// same-origin with /app, can stash it), so an attacker page that merely links to
// /app?persist=<anything> has no flag stashed and peekPersistFlag returns false
// — no persist, the invoice loads read-only as a prefill, exactly the safe
// fallback.
//
// The prefix nests under HANDOFF_PREFIX so cleanupStaleHandoffs (which scans
// every key starting with HANDOFF_PREFIX) reaps orphaned persist flags by the
// same TTL — no second sweep needed.
const PERSIST_FLAG_PREFIX = HANDOFF_PREFIX + 'persist_';
// One-time same-origin "download" flag for the embed download CTA's storage-
// full ?invoice= fallback — see DOWNLOAD_PARAM. Same nesting-under-HANDOFF_
// PREFIX rationale as the persist flag (cleanupStaleHandoffs reaps orphans by
// the same TTL, no second sweep), and the same `<ts>;1` value shape.
const DOWNLOAD_FLAG_PREFIX = HANDOFF_PREFIX + 'download_';

// Stash value format: `<ts>;<invoice-json>`. The leading `<ts>;` lets the TTL
// sweep read the timestamp with a cheap string slice + Number(), NOT a full
// JSON.parse of the (up to ~1MB-logo) invoice payload — the old `{invoice,ts}`
// form parsed the whole object just to read ts, jank on the /app mount path.
// peekHandoff reads the JSON after the separator. The separator is unambiguous:
// ts is a decimal number, so the first ';' is the end of the ts prefix.
//
// The same `<ts>;<value>` wire format, generateId() token, and remove-on-
// success consume pattern are shared by the handoff stash AND the persist-flag
// stash (two security-load-bearing one-time same-origin token contracts). The
// write side is implemented once here as stashToken; the READ side is parsed
// once by parseStash (used by consumeToken, peekToken, and the stale sweep), so
// a future change to the wire format (separator, nonce, TTL-in-value) lands in
// one place instead of drifting across copies with no type-system signal — the
// same producer/consumer centralization the rest of this module (MSG_*,
// onTrustedMessage, handoffUrl) was built around.

/**
 * Stash a one-time, same-origin token: write `<ts>;<value>` under `prefix+token`
 * and return the token to carry in a URL param. Returns null if storage is
 * unavailable/full so the caller degrades gracefully (handoff → ?invoice=
 * fallback, persist flag → passive read-only prefill). The token is a
 * generateId() UUID (CSPRNG-or-fallback) — reused, not re-hand-rolled, so the
 * crypto-availability decision can't drift between the two call sites.
 */
function stashToken(prefix: string, value: string): string | null {
  if (typeof window === 'undefined') return null;
  const token = generateId();
  try {
    localStorage.setItem(prefix + token, `${Date.now()};${value}`);
  } catch {
    return null;
  }
  return token;
}

/**
 * Parse the `<ts>;<value>` stash wire format — the ONE read-side parse site for
 * the handoff stash and the persist/download flags (R31 #1: consumeToken,
 * peekToken, and cleanupStaleHandoffs each hand-rolled this indexOf+slice+Number
 * before, so a separator/ts-encoding change — a nonce, a `|` separator — would
 * have had to land in three places with no type-system signal, exactly the
 * producer/consumer drift the module's write side, stashToken, was centralized
 * to avoid). Returns {value, ts} for any non-empty raw (ts is NaN when there's
 * no separator or the prefix isn't numeric — the caller's validate / staleness
 * check decides whether that's acceptable, preserving consumeToken/peekToken's
 * exact prior behavior of passing value+ts including a NaN ts to validate). The
 * write side (stashToken) writes `${Date.now()};${value}` in one place; this
 * makes the read side match — one parse for one wire format. Declared before
 * consumeToken/peekToken (its callers) so the read-side helper reads top-down.
 */
function parseStash(raw: string): { value: string; ts: number } {
  const sep = raw.indexOf(';');
  const value = sep < 0 ? raw : raw.slice(sep + 1);
  const ts = sep < 0 ? NaN : Number(raw.slice(0, sep));
  return { value, ts };
}

/**
 * Consume a one-time, same-origin token: read `prefix+token`, split the
 * `<ts>;<value>` form, pass `value` + `ts` to `validate`, and — only on a
 * non-null result — remove the key (best-effort one-time consume). Returns the
 * validated result, or null for a missing/invalid/expired/corrupt token WITHOUT
 * removing the key (an invalid payload is left for the TTL sweep, not destroyed
 * for nothing — the validate-before-remove invariant). Cross-tab caveat:
 * localStorage has no compare-and-set, so two same-origin tabs sharing a token
 * can both validate and both succeed (the removeItem then runs at most once
 * effectively) — best-effort one-time, NOT cross-tab atomic; don't rely on
 * stricter guarantees without a Web Lock around the consume.
 */
function consumeToken<T>(
  prefix: string,
  token: string | null,
  validate: (value: string, ts: number) => T | null,
): T | null {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const raw = localStorage.getItem(prefix + token);
    if (!raw) return null;
    const { value, ts } = parseStash(raw);
    const result = validate(value, ts);
    if (result !== null) localStorage.removeItem(prefix + token);
    return result;
  } catch {
    return null;
  }
}

/**
 * Peek: validate a token WITHOUT removing it — the recovery-on-failure
 * companion to consumeToken. The /app mount effect peeks the handoff, attempts
 * the durable billify_current write, and consumes (clears) the token only AFTER
 * the write succeeds (R30 #3): a QuotaExceededError during the write leaves the
 * handoff stash in place, so a reload re-reads the scratch instead of landing
 * on an empty invoice. The prior order consumed the handoff token (the consume)
 * BEFORE persistInvoice ran, so a failed write + tab close lost the scratch
 * irrecoverably (handoffUrl emits no ?invoice= fallback on the stashHandoff-
 * success path). Validates identically to consumeToken (so an invalid/expired/
 * corrupt token is refused and left for the sweep, never validated-then-left
 * as if good) but does NOT removeItem. Security is unchanged — the token is
 * same-origin and unforgable cross-origin, so leaving a not-yet-consumed token
 * for the user's OWN reload to re-read is legitimate; an attacker can't read or
 * consume it cross-origin.
 */
function peekToken<T>(
  prefix: string,
  token: string | null,
  validate: (value: string, ts: number) => T | null,
): T | null {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const raw = localStorage.getItem(prefix + token);
    if (!raw) return null;
    const { value, ts } = parseStash(raw);
    return validate(value, ts);
  } catch {
    return null;
  }
}

/**
 * Unconditional best-effort removeItem of `prefix+token` — the consume
 * companion to peekToken, called only after the durable write it authorizes
 * has succeeded (or a read-only load has consumed it). No validate: the caller
 * already peeked + validated, so this just reaps. The TTL sweep is the backstop
 * if a clear is missed — a tab close between peek and clear leaves the token for
 * the sweep, which is correct (it was a valid token that never got consumed
 * because the write failed; the sweep reaps it after HANDOFF_TTL_MS).
 */
function clearToken(prefix: string, token: string | null): void {
  if (!token) return;
  try {
    localStorage.removeItem(prefix + token);
  } catch {
    /* best-effort; the TTL sweep reaps orphans */
  }
}

export function stashHandoff(invoice: Invoice): string | null {
  return stashToken(HANDOFF_PREFIX, JSON.stringify(invoice));
}

// Peek + clear: the /app mount effect's handoff consume, split into a read-
// WITHOUT-delete (peekHandoff) + a separate clear (consumeHandoff) for the
// persist-before-consume ordering (R30 #3). The mount effect peeks the handoff
// (read the scratch WITHOUT deleting the stash), attempts the durable
// billify_current write, and calls consumeHandoff (clear) only after the write
// succeeds (or for a read-only load) — so a QuotaExceededError during the write
// leaves the stash + URL ?handoff= param in place for a reload to re-read
// (recovering the scratch) instead of losing it irrecoverably on tab close.
// The persist flag is split the same way (peekPersistFlag + consumePersistFlag,
// R34 #1), so a failed-persist reload re-peeks the flag too and re-attempts the
// auto-persist — the data AND the auto-persist intent both recover (the prior
// one-call eager-consume burn made the recovered reload read-only: data
// preserved, auto-persist intent lost). See peekToken/clearToken.
// (R32-a: the former one-call `takeHandoff` wrapper — consumeToken + validate
// in a single call — had no call sites after this split shipped and was removed;
// callers that want one-call consume can use consumeToken directly. R35 #3
// removed the analogous dead `takePersistFlag` wrapper for the same reason.)
export function peekHandoff(token: string | null): Invoice | null {
  return peekToken<Invoice>(HANDOFF_PREFIX, token, (value) =>
    validateInvoice(JSON.parse(value)),
  );
}
export function consumeHandoff(token: string | null): void {
  clearToken(HANDOFF_PREFIX, token);
}

/**
 * Sweep expired handoff stashes left behind by never-consumed / abandoned
 * full-screen opens (user closed the tab before the host consumed the token,
 * browser crashed, etc.). Each stash carries a timestamp; anything older than
 * the TTL is dead and would otherwise leak ~1 MB of logo data URL per orphan.
 *
 * Iterates the full localStorage key set rather than maintaining a side index:
 * an index that is appended-to in stashHandoff and filtered-in consumeHandoff
 * drifts out of sync whenever a stash is removed out-of-band (storage
 * eviction, another tab's cleanup, manual clear) — leaving index entries
 * pointing at stashes that no longer exist (orphan metadata) and, worse,
 * stashes with no index entry that this sweep would never visit (leaked data
 * URLs). A full scan is O(#keys the page owns) and runs on every /app mount
 * (host and embed — embed is the most frequent mount path, so reaping there
 * prevents embed-only users from accumulating orphans), which is negligible,
 * and it can never miss a stash. Called AFTER consumeHandoff so a pending token
 * is consumed first. Best-effort and silent.
 *
 * Iterates BACKWARD by index. localStorage keys are dense, so removing the key
 * at index i slides the key at i+1 into slot i — a forward loop would skip that
 * slid key on the next i++. Iterating backward sidesteps this entirely:
 * removing key i only shifts indices > i, which the loop has already visited,
 * so every stash is seen exactly once and removal-by-index is stable. No
 * intermediate collect-then-remove array is needed.
 *
 * The ts is read via a string slice of the `<ts>;<json>` prefix, NOT a full
 * JSON.parse — so sweeping N stashes does N cheap slices, not N full parses of
 * ~1MB payloads.
 *
 * getItem cost tradeoff: localStorage has no prefix/partial read, so reading the
 * ts from the value materializes the full stash (up to a ~1MB logo data URL)
 * into a JS string per handoff-prefixed key. This is a deliberate accepted
 * tradeoff: the alternative — encoding the ts in the KEY (e.g.
 * billify_handoff_<ts>_<token>) so the sweep reads the TTL from localStorage.key
 * alone and skips getItem for fresh entries — would break the direct token→key
 * map (peekHandoff/consumeHandoff, which receive only the token, would become an
 * O(#keys) scan) AND, worse, break backward compatibility at the deploy boundary:
 * a user with a pending handoff at deploy time carries an old-format value
 * (`<ts>;<json>`); a new consume expecting pure JSON would fail to parse it
 * and silently lose their scratch edit, for a ~1ms-per-mount gain that only
 * materializes in the narrow window where a pending/orphan handoff exists (0-1
 * keys, not user-perceptible). The full value-shape (ts prefix) is kept for both
 * the cheap-slice optimization and forward/backward compatibility. A separate
 * index key (billify_handoff_index = '<ts>:<token>;…') so the sweep reads ts
 * values from a few-hundred-byte string instead of each ~1MB stash is rejected
 * for the same reason: it adds a key that must be kept in sync across
 * stashHandoff/consumeHandoff/cleanupStaleHandoffs (a new drift/un-sync failure
 * mode) for a gain that only materializes in the 0-1-key orphan window, rate-
 * limited to once per SWEEP_MIN_INTERVAL_MS — not user-perceptible, not a
 * confirmed hot path.
 */
export function cleanupStaleHandoffs(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  try {
    // Rate-limit: skip the scan if any same-origin tab swept within the last
    // interval. A pending/orphan handoff survives the skip (it's < TTL), and the
    // next mount after the interval reaps it — the whole point is to bound the
    // per-mount ~1MB getItem cost while an orphan exists, not to delay reaping
    // meaningfully (the interval ≪ TTL). A missing/unparseable timestamp sweeps
    // immediately (first mount, or corrupt key). Set the timestamp BEFORE the
    // scan so a concurrent tab mounting mid-scan sees it and skips.
    const lastRaw = localStorage.getItem(HANDOFF_LAST_SWEEP_KEY);
    const last = lastRaw ? Number(lastRaw) : NaN;
    if (Number.isFinite(last) && now - last < SWEEP_MIN_INTERVAL_MS) return;
    try { localStorage.setItem(HANDOFF_LAST_SWEEP_KEY, String(now)); } catch { /* ignore */ }
    const cutoff = now - HANDOFF_TTL_MS;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(HANDOFF_PREFIX)) continue;
      let stale = false;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        // parseStash is the single wire-format parse site (see consumeToken) —
        // the sweep reads only ts, but routing through it keeps the staleness
        // check's ts-encoding in lockstep with consume/peek's.
        const { ts } = parseStash(raw);
        // A missing/unparseable ts (corrupt stash) is treated as dead so it
        // can't leak ~1MB forever — a corrupt handoff is never consumable.
        stale = !Number.isFinite(ts) || ts < cutoff;
      } catch {
        // Unreadable / corrupt stash — treat as dead so it can't leak forever.
        stale = true;
      }
      if (stale) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
      }
    }
  } catch {
    // ignore — best-effort cleanup
  }
}

// Parameterized one-time same-origin flag stash — the shared core of the
// persist and download flags. Both share the `<ts>;1` wire shape, the
// generateId token, and the HANDOFF_TTL_MS expiry, so the `1`-marker validation
// (security-load-bearing for BOTH the overwrite-billify_current persist
// authority AND the skip-isPrefill download authority) lives in exactly ONE
// place: a future tightening (shorter TTL, a nonce marker) applies to both at
// once with no producer/consumer drift. R28 #8 introduced the download flag by
// copy-pasting the persist pair verbatim, leaving two byte-identical validate
// callbacks — collapsing them here makes the check a single-source invariant.
function stashFlag(prefix: string): string | null {
  return stashToken(prefix, '1');
}
// Shared `<ts>;1` flag validation — the `1` marker + unexpired-within-
// HANDOFF_TTL_MS check that authorizes BOTH the overwrite-billify_current
// persist flag AND the skip-isPrefill download flag. Each consumer calls
// consumeToken/peekToken with this as the validate callback so the read paths
// can't drift on the marker/TTL contract. consumeToken removes the key only
// when validate returns non-null, so an expired (sweep hasn't reaped it yet) or
// marker-mismatched flag is refused WITHOUT being consumed — left for the sweep.
const flagValid = (value: string, ts: number): boolean =>
  value === '1' && Number.isFinite(ts) && ts >= Date.now() - HANDOFF_TTL_MS;

/**
 * Stash a one-time, same-origin "persist" flag and return the token to carry in
 * the ?persist=<token> URL param. The host /app mount peeks it via
 * peekPersistFlag to authorize persisting the handed-off invoice to the host's
 * storage ONLY when a valid flag is present, and consumes it via
 * consumePersistFlag only after the durable write succeeds (R34 #1) — see
 * PERSIST_FLAG_PREFIX for why this is the secure replacement for the forgeable
 * ?persist=1 + document.referrer gate.
 *
 * Returns null if the flag could not be stashed (localStorage full/disabled) —
 * the caller MUST degrade gracefully: emit no persist token and let /app treat
 * the invoice as a read-only prefill (load it into the editor but do NOT save it
 * to billify_current (embedKey('current'))). Losing auto-save on a storage-full handoff is the lesser
 * evil vs. silently persisting an attacker-chosen invoice, and matches the
 * handoff-fallback contract already used for stashHandoff.
 *
 * Value shape `<ts>;1` mirrors the handoff stash so the TTL sweep reads ts via a
 * cheap slice (no JSON.parse) and reaps orphans by the same HANDOFF_TTL_MS.
 */
export const stashPersistFlag = (): string | null => stashFlag(PERSIST_FLAG_PREFIX);

/**
 * Peek the persist flag for `token` WITHOUT removing it — the recovery-on-
 * failure read side of the persist-flag transfer (mirrors peekHandoff). The
 * /app mount effect peeks the flag, attempts the durable billify_current write,
 * and calls consumePersistFlag (clear) only after the write succeeds (or for a
 * read-only load with no flag): a QuotaExceededError during the write leaves the
 * flag + ?persist= param in place so a reload re-peeks, re-enters the persist
 * branch (no isPrefill), and re-attempts the auto-persist — closing the R34 #1
 * asymmetry where the prior one-call eager-consume form burned the flag before
 * the write and the reload fell through to the read-only prefill branch.
 * Validates via flagValid but does NOT removeItem; security is unchanged (the
 * flag is same-origin, unforgable cross-origin).
 *
 * There is intentionally NO eager one-call `takePersistFlag` companion here (the
 * download flag has one — takeDownloadFlag — because its path needs no failed-
 * write recovery): the persist branches MUST peek-then-consume-on-success, so an
 * eager consume would be dead-and-misleading exported code. See R35 #3.
 */
export const peekPersistFlag = (token: string | null): boolean =>
  peekToken<boolean>(PERSIST_FLAG_PREFIX, token, (value, ts) =>
    flagValid(value, ts) ? true : null,
  ) === true;

/**
 * Consume (clear) the persist flag for `token` — the clear-on-success companion
 * to peekPersistFlag, called only after the durable billify_current write it
 * authorizes has succeeded (or a read-only load had no flag to clear). No
 * validate: the caller already peeked + validated. The TTL sweep is the
 * backstop if a clear is missed — a tab close between peek and clear leaves the
 * flag for the sweep, which is correct (it was a valid flag that never got
 * consumed because the write failed; the sweep reaps it after HANDOFF_TTL_MS).
 * Mirrors consumeHandoff.
 */
export const consumePersistFlag = (token: string | null): void =>
  clearToken(PERSIST_FLAG_PREFIX, token);

/**
 * Stash a one-time same-origin "download" flag for the embed download CTA's
 * storage-full ?invoice= fallback — the host consumes it via takeDownloadFlag
 * to load the scratch read-only but downloadable (skip isPrefill). Shares
 * stashFlag/flagValid with the persist flag (same `<ts>;1` shape, same TTL, same
 * one-time best-effort semantics — see the parameterized core above). Returns
 * null on storage failure — the caller degrades to a passive-share-link load
 * (isPrefill applies), the safe fallback.
 */
export const stashDownloadFlag = (): string | null => stashFlag(DOWNLOAD_FLAG_PREFIX);

/**
 * Consume the one-time download flag for `token`. Same validation as the persist
 * flag (shared via flagValid). False for a
 * missing/expired/corrupt/already-consumed flag — the host then treats the
 * ?invoice= as a passive share link → isPrefill.
 */
export const takeDownloadFlag = (token: string | null): boolean =>
  consumeToken<boolean>(DOWNLOAD_FLAG_PREFIX, token, (value, ts) =>
    flagValid(value, ts) ? true : null,
  ) === true;

/**
 * Build the `&persist=<token>` URL segment for a handoff URL. When `persist` is
 * true, stash a one-time same-origin flag the host peeks via peekPersistFlag +
 * consumes via consumePersistFlag (only on a successful durable write — R34 #1)
 * to authorize overwriting billify_current, and append it to the URL; when
 * false (the embed download CTA — a read-only load), emit nothing. Hoisted from
 * handoffUrl so the two branches (token handoff and the logo-stripped fallback)
 * share one implementation of the stash-write-order-then-append contract — a
 * prior duplication meant a fix to one branch's persist handling could drift
 * from the other. The flag MUST be stashed in the same branch that builds the
 * URL it decorates, so this helper is called inline per branch (not once up
 * front), preserving the original write order in each path.
 */
function buildPersistParam(persist: boolean): string {
  const persistToken = persist ? stashPersistFlag() : null;
  return persistToken !== null ? `&${PERSIST_PARAM}=${persistToken}` : '';
}

/**
 * The user-facing message shown when handoffUrl returns '/app' (no query) — the
 * invoice was too large to transfer even with logos stripped (storage full +
 * over-length URL), so the opened full-screen editor starts empty. Shared by
 * EmbeddedEditor.openFullScreen (embed → full-screen CTA) and AppPage.
 * handleOpenFullScreen (host download CTA) so the wording lives in one place
 * and the two callers can't drift. Caller responsibility: handoffUrl's contract
 * is that '/app' means "too large" — the caller MUST detect that return value
 * and surface this message instead of silently landing the user in an empty
 * editor with no explanation.
 */
export const HANDOFF_TOO_LARGE_MSG =
  'Your invoice is too large to carry into the full-screen editor (browser storage is full). Open the full editor and re-enter it, or clear some browser storage.';

/**
 * The user-facing message shown when handoffUrl's storage-full fallback strips
 * the user's logo(s) to fit the invoice into the ?invoice= URL (the stash
 * failed, usually because a large logo already filled localStorage). Unlike
 * the too-large case (which refuses the handoff outright), this fallback still
 * transfers the invoice — but WITHOUT the logo, and (for persist=true) the
 * host persists that logo-less invoice to billify_current. Surfacing the loss
 * here (rather than letting the user discover the missing logo only after
 * reload) mirrors the HANDOFF_TOO_LARGE_MSG contract: the silent-data-loss path
 * is made observable. Alerted inside handoffUrl only when the invoice ACTUALLY
 * had a logo to strip, so logo-less invoices (the common case) don't trigger a
 * false alarm on a storage-full fallback.
 */
export const HANDOFF_LOGO_STRIPPED_MSG =
  'Your logo could not be carried into the full-screen editor (browser storage is full), so it was left behind. Re-upload it in the full editor.';

/**
 * The user-facing message shown when window.open fails to launch the full-screen
 * editor (the browser blocked the pop-up). The two handoff producers —
 * EmbeddedEditor.openFullScreen (embed → host) and AppPage.handleOpenFullScreen
 * (host download CTA) — both surface this on the same window.open-fails path,
 * and the wording had already drifted between the two sites (one said
 * '...editor.', the other '...editor and download your invoice.'). Centralize
 * it alongside the other handoff UX-copy constants (HANDOFF_TOO_LARGE_MSG /
 * HANDOFF_LOGO_STRIPPED_MSG) so the shared prefix lives in one literal and can't
 * drift. `withDownload` selects the host variant's trailing CTA (the host opens
 * the full-screen editor specifically to download); the embed variant omits it.
 */
const POPUP_BLOCKED_PREFIX = 'Allow pop-ups for Billify to open the full-screen editor';
export function popupBlockedMsg(withDownload = false): string {
  return `${POPUP_BLOCKED_PREFIX}${withDownload ? ' and download your invoice' : ''}.`;
}

/**
 * Enforce handoffUrl's "too large" caller contract in one place. handoffUrl
 * returns '/app' (no query) when the invoice was too large to stash; the caller
 * MUST detect that and warn the user instead of silently opening an empty
 * editor. Both handoff producers (EmbeddedEditor.openFullScreen and
 * AppPage.handleOpenFullScreen) call this right after computing the url, so a
 * future third caller gets the contract enforced by reuse rather than by
 * remembering to copy the `if (url === '/app') alert(...)` line. Returns true
 * when the too-large warning was surfaced (so the caller can skip the now-
 * pointless navigation), false when the url is a real handoff URL.
 */
export function warnIfHandoffTooLarge(url: string): boolean {
  if (url === '/app') {
    alert(HANDOFF_TOO_LARGE_MSG);
    return true;
  }
  return false;
}

/**
 * Build the host-/app navigation URL that carries `invoice` into the persistent
 * editor via the one-time same-origin handoff. Shared by BOTH handoff producers
 * so the stash/fallback/too-long logic lives in one place (the prior
 * EmbeddedEditor.openFullScreen hand-rolled this; the in-embed "Open
 * full-screen" download CTA added to close the embed monetization bypass reuses
 * it rather than reinventing the wheel):
 *
 *  1. Stash the full invoice (which may carry a ~1MB logo data URL) in
 *     localStorage and carry only a short token in ?handoff=<token>. Preferred
 *     because encoding the whole invoice into ?invoice= exceeds browser/nginx
 *     URL caps and silently lost the user's scratch edit.
 *  2. If the stash fails (storage full — usually a large logo filled it), fall
 *     back to the ?invoice= URL form with logos stripped. When the invoice
 *     actually had a logo, this surfaces HANDOFF_LOGO_STRIPPED_MSG so the silent
 *     logo loss is observable (mirrors the too-large contract below).
 *  3. If even the logo-less ?invoice= URL would be too long (many line items /
 *     long notes), return '/app' (empty) rather than a truncated URL that
 *     decodeInvoice would reject (landing the user on an empty invoice). The
 *     caller MUST detect this ('/app' with no query) and warn the user their
 *     edit was too large to transfer — see EmbeddedEditor.openFullScreen and
 *     AppPage.handleOpenFullScreen (BOTH callers must honor this).
 *
 * `persist` binds the "make this my current invoice" intent to the caller, NOT
 * to the handoff mechanism. Two buttons reuse this helper with opposite intent:
 *  - EmbeddedEditor "Edit in full-screen" → persist=true: the user chose to
 *    bring their scratch into the persistent editor, so the host marks it dirty
 *    and the debounced save overwrites billify_current with the scratch.
 *  - AppPage "Open full-screen" (the embed download CTA) → persist=false: the
 *    user just wants to download, NOT replace their saved invoice, so the host
 *    loads the scratch READ-ONLY (dirty=false) and billify_current is untouched;
 *    the user then clicks Download in the host tab, which enforces the cap/paywall.
 *    Reusing the persisting (persist=true) path here would silently destroy a
 *    host user's saved invoice the moment they open a scratch from the embed.
 *
 * Persist authority is the SAME one-time same-origin localStorage flag the
 * ?invoice= fallback uses (stashPersistFlag / peekPersistFlag +
 * consumePersistFlag), so the handoff and ?invoice= branches share ONE persist-
 * authority mechanism — not two. When persist=true, a flag is stashed and
 * ?persist=<token> is appended; the host's handoff branch peeks the flag +
 * settles dirty exactly like the ?invoice= branch, consuming the flag only on a
 * successful durable write (R34 #1). When persist=false (or the flag stash
 * fails on storage-full), no ?persist token is emitted and the host loads
 * read-only (the safe direction: losing auto-save on a storage-full handoff is
 * the lesser evil vs. silently persisting an attacker-chosen invoice — the
 * same contract the ?invoice= fallback already uses). The flag is unforgable
 * cross-origin (only a same-origin embed iframe can stash it), so a forged
 * ?persist=<anything> from an attacker page authorizes nothing.
 *
 * The opened URL is a top-level /app tab (no embed param), so it runs in HOST
 * mode where the free-tier cap and Pro-template paywall are enforced — this is
 * the contract that lets the embed iframe stay a try-only/scratch surface while
 * download still has a path (open full-screen) that goes through the
 * monetization wall.
 */
export function handoffUrl(invoice: Invoice, persist = true): string {
  const token = stashHandoff(invoice);
  if (token) {
    // persist=true stashes a one-time same-origin flag the host peeks via
    // peekPersistFlag + consumes via consumePersistFlag (only on a successful
    // durable write — R34 #1) to authorize overwriting billify_current.
    // persist=false (the embed download CTA) emits no flag → the host loads
    // read-only.
    return `/app?${HANDOFF_PARAM}=${token}${buildPersistParam(persist)}`;
  }
  // Storage-full fallback: ?invoice= with logos stripped. Persist authority is
  // the same flag mechanism (only stashed when persist=true), so the fallback
  // honors the caller's intent the same way the primary handoff path does.
  // When persist=false (the embed DOWNLOAD CTA), ALSO stash a one-time
  // "download" flag and carry it as &download=<token> so the host /app loads
  // this scratch READ-ONLY but DOWNLOADABLE — skipping isPrefill (the anti-
  // phishing gate a genuine passive share link triggers). The primary handoff
  // path (the ?handoff= branch above, persist=false) already loads read-only
  // WITHOUT isPrefill (the handoff branch never sets it), so only the fallback
  // needs the download flag to match that behavior. Without it, the storage-
  // full fallback would classify the user's own same-origin scratch as an
  // untrusted share link → a misleading "came from a shared link" phishing
  // warning about their own invoice + Download disabled until they click "Make
  // this my invoice" — needless friction contradicting the download CTA intent.
  // The strip is a silent data-loss path: for persist=true the host persists
  // the logo-less invoice to billify_current, and for persist=false the
  // downloaded PDF lacks the logo — either way the user's uploaded logo
  // vanishes with no signal. Surface HANDOFF_LOGO_STRIPPED_MSG when the invoice
  // ACTUALLY had a logo (so logo-less invoices don't false-alarm), mirroring
  // the warnIfHandoffTooLarge contract that makes the too-large refusal
  // observable. The alert fires before the caller's warnIfHandoffTooLarge
  // check; it fires ONLY when the strip actually produced a usable (≤2000)
  // handoff URL. If the stripped URL is STILL over 2000 the handoff is refused
  // outright (→ '/app' below): the logo-stripped alert is SKIPPED (the strip
  // was abandoned, not transferred — the invoice is not handed off at all), and
  // ONLY the caller's too-large alert fires. So the >2000 case surfaces one
  // alert, not two — the logo-stripped alert is exclusive to the successful-
  // strip path above.
  const hadLogo = Boolean(invoice.from.logo || invoice.to.logo);
  const stripped: Invoice = {
    ...invoice,
    from: { ...invoice.from, logo: undefined },
    to: { ...invoice.to, logo: undefined },
  };
  const encoded = encodeInvoice(stripped);
  // The download flag is stashed ONLY on the persist=false (embed download CTA)
  // branch — the host /app loads the scratch read-only but downloadable (skip
  // isPrefill). '' if the flag couldn't be stashed (storage full — the very
  // condition that forced this ?invoice= fallback), in which case the host
  // treats the ?invoice= as a passive share link → isPrefill applies (the safe
  // fallback). Inline (not a buildPersistParam mirror) because this is the sole
  // call site and the branch condition (persist=false) lives here, not in the
  // helper. The flag MUST be stashed in the same branch that builds the URL it
  // decorates (see buildPersistParam) — stashing here preserves that order.
  const downloadToken = persist ? null : stashDownloadFlag();
  const downloadParam = downloadToken ? `&${DOWNLOAD_PARAM}=${downloadToken}` : '';
  const url = `/app?${INVOICE_PARAM}=${encoded}${buildPersistParam(persist)}${downloadParam}`;
  if (url.length <= 2000) {
    if (hadLogo) alert(HANDOFF_LOGO_STRIPPED_MSG);
    return url;
  }
  // 2000 chars stays well under nginx's default 8KB request-line limit and all
  // browser URL caps. A longer URL would be truncated/rejected by decodeInvoice.
  return '/app';
}
