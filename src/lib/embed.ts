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
    return new URLSearchParams(window.location.search).get('embed') === 'true';
  } catch {
    return false;
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