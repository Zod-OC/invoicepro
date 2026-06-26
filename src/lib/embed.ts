import { Invoice, validateInvoice } from '@/types';

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
    // (b) be framed by a same-origin page (the profession pages on this site).
    // Without the framing check, anyone opening /app?embed=true in a normal tab
    // spoofs embed mode and gets Pro for free (useSubscription short-circuits to
    // plan='pro'). Without the same-origin check, a third-party site could embed
    // the editor for free. Accessing a cross-origin parent's location throws.
    if (window.self === window.top) return false;
    if (new URLSearchParams(window.location.search).get('embed') !== 'true') return false;
    return window.parent.location.origin === window.location.origin;
  } catch {
    return false; // cross-origin parent or sandboxed frame → not a trusted embed
  }
}

/**
 * Namespaced storage key. Host session uses `billify_*`; the embed iframe uses
 * `billify_embed_*` so the two never read or write each other's data.
 */
export function embedKey(base: string): string {
  return isEmbedMode() ? `billify_embed_${base}` : `billify_${base}`;
}

/**
 * URL-safe (base64url) encode of a full Invoice, for the embed/handoff URL
 * contract: `/app?embed=true&invoice=<encoded>`. Used both for the profession
 * prefill (EmbeddedEditor) and the lossless "Edit in full-screen" handoff.
 */
export function encodeInvoice(invoice: Invoice): string {
  const bytes = new TextEncoder().encode(JSON.stringify(invoice));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a base64url Invoice param; returns null if missing or invalid. */
export function decodeInvoice(s: string | null): Invoice | null {
  if (!s) return null;
  try {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
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
 * takeHandoff(), which deletes the key. Client-only (Date.now/Math.random are
 * fine here — never called from a build-time render path).
 */
const HANDOFF_PREFIX = 'billify_handoff_';

export function stashHandoff(invoice: Invoice): string {
  if (typeof window === 'undefined') return '';
  const token = Math.random().toString(36).slice(2);
  try {
    localStorage.setItem(HANDOFF_PREFIX + token, JSON.stringify({ invoice, ts: Date.now() }));
  } catch { /* storage full — caller falls back to empty handoff */ }
  return token;
}

export function takeHandoff(token: string | null): Invoice | null {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const raw = localStorage.getItem(HANDOFF_PREFIX + token);
    if (!raw) return null;
    localStorage.removeItem(HANDOFF_PREFIX + token); // one-time consume
    return validateInvoice(JSON.parse(raw).invoice);
  } catch {
    return null;
  }
}