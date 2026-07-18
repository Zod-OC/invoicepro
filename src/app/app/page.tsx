'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Invoice, createEmptyInvoice, formatCurrency, calculateTotals, templates, currencies, currencySymbol, TemplateType, TaxCategory, PaymentMeans, TAX_CATEGORIES, TAX_CATEGORY_LABELS, UNIT_CODES, PAYMENT_METHODS, DEFAULT_PAYMENT_CODE, isValidCurrencyCode, validateInvoice, getTemplate, isTemplateId, freeFallbackTemplate, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES, isValidLogoDataUrl, stripLogos } from '@/types';
import { generatePDF } from '@/lib/pdf';
import { generateCSV } from '@/lib/csv';
import { useSubscription, getStoredPlan } from '@/hooks/useSubscription';
import { DEFAULT_LIMITS } from '@/lib/plan-limits';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { Sparkles, Plus, Trash2, Download, RotateCcw, FileText, Shield, Maximize2, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PaywallModal } from '@/components/PaywallModal';
import { isEmbedMode, isUntrustedFrame, embedKey, logoStorageKey, decodeInvoice, peekHandoff, consumeHandoff, peekPersistFlag, consumePersistFlag, takeDownloadFlag, cleanupStaleHandoffs, onTrustedMessage, handoffUrl, warnIfHandoffTooLarge, popupBlockedMsg, INVOICE_PARAM, HANDOFF_PARAM, PERSIST_PARAM, DOWNLOAD_PARAM, TEMPLATE_PARAM, MSG_SYNC_REQUEST, MSG_INVOICE_FRESH } from '@/lib/embed';
import { SITE_HOST } from '@/lib/site';
import { stripUrlParams } from '@/lib/url';
import { track } from '@/lib/analytics';
import { BackupRestore } from '@/components/BackupRestore';
import { ClientDirectory } from '@/components/ClientDirectory';
import { ClientAutocomplete } from '@/components/ClientAutocomplete';
import { useClients } from '@/hooks/useClients';
import { InvoiceHistory } from '@/components/InvoiceHistory';
import { useInvoiceCounter } from '@/hooks/useInvoiceCounter';
import { useInvoiceHistory } from '@/hooks/useInvoiceHistory';
import type { Client } from '@/types';

// Static currency-options list computed ONCE at module load (not per render).
// currencySymbol builds/caches an Intl formatter per code, so building this in
// the 160-option <datalist> body would re-run ~160 formatToParts calls on every
// keystroke. currencies + currencySymbol are imported above.
const CURRENCY_OPTIONS = currencies.map((c) => ({ code: c, label: `${c} — ${currencySymbol(c)}` }));
// The <datalist> is static — hoist the whole element to a module-level const so
// React reuses one reference across renders instead of reconciling ~160 <option>
// nodes on every keystroke in this already-heavy 'use client' component.
const CURRENCY_DATALIST = (
  <datalist id="billify-currencies">
    {CURRENCY_OPTIONS.map((o) => (
      <option key={o.code} value={o.code}>{o.label}</option>
    ))}
  </datalist>
);

// Host-session persistence lives in the component as persistInvoice (below),
// NOT here as a module function: it needs the component-scoped lastSavedLogosRef
// to skip re-writing the immutable ~1 MB logo on every text edit. Logos are now
// stored under logoStorageKey('from'/'to') and written ONLY on change; the main
// `current` blob is text-only, so the debounced save re-serializes the small text
// fields, not the logo. The load path (mount effect) reassembles logos from the
// side-keys, falling back to logos embedded in an old-format `current` so a
// pre-migration save still renders. Embed mode never auto-saves, so only host
// (billify_*) keys are ever written. The error boundary clears all three via
// clearHostInvoiceStorage().

// Shared user-facing copy for a download-path failure (PDF generation OR
// delivery). Both failure branches in handleDownload surface the same message so
// a wording change lands in one place — the two paths are the same user problem
// ("your PDF didn't come out") and must never drift apart.
const PDF_FAILED_MSG = 'PDF generation failed. Please try again.';

// Deterministic empty invoice for the initial render on BOTH the build-time
// prerender and the client first render, so the two HTML trees match. (A fresh
// createEmptyInvoice() is non-deterministic — Math.random invoice number,
// new Date() date/dueDate, crypto.randomUUID id — and those fields are rendered
// into the DOM, including the template preview, so using it as useState's
// initializer would cause a hydration mismatch on every /app load.) The mount
// effect populates the real invoice (saved restore, handoff, embed prefill, or
// a fresh createEmptyInvoice) — the same pattern EmbeddedEditor uses.
const PLACEHOLDER_INVOICE: Invoice = {
  id: '',
  number: '',
  date: '',
  dueDate: '',
  from: { name: '', email: '', address: '', phone: '' },
  to: { name: '', email: '', address: '', phone: '' },
  items: [{ description: '', quantity: 1, rate: 0 }],
  notes: '',
  terms: '',
  taxRate: 0,
  currency: 'USD',
  template: 'modern',
  status: 'draft',
  createdAt: 0,
  updatedAt: 0,
};

// stripUrlParams lives in the shared client lib src/lib/url.ts (R35 #2/#7) —
// it centralizes the delete + replaceState URL-cleanup trailer that the three
// /app mount branches below, useSubscription.verifySession, and
// CheckoutCanceledBanner all need, so a change to the URL-cleaning approach
// lands in one place. The per-site param names still come from the centralized
// embed.ts constants. See src/lib/url.ts.

// Monthly invoice-count helpers, reading fresh from storage so a tab open
// across a month boundary stays correct (the count state is mount-snapshotted
// and would otherwise gate on last month's total). The key derivation lives in
// one place (monthCountKey) so the read and the write can't drift. Client-only.
//
// Local month, not UTC: the free-tier "3 invoices/month" limit is a calendar
// concept the user thinks about in their own timezone. A UTC key
// (toISOString().slice(0,7)) rolls over at 00:00 UTC — for a user at UTC-8 that's
// 4pm on the last day of the month, so a free user in e.g. June could squeeze a
// 4th June download at 5pm local (now July in UTC, new empty key) and a user in
// UTC+13 could be blocked a day early. Deriving from the local year/month
// keeps the cap aligned with the user's calendar.
//
// TRUST MODEL — read this before "hardening" the cap further:
// This counter lives in client-writable localStorage, and generatePDF runs
// entirely client-side, so there is NO server authority for the download
// count. That is by design: Billify is privacy-first with no backend that
// stores per-user usage (the Stripe API is external and stateless w.r.t.
// download counts). A determined user can always reset the cap from devtools
// (`localStorage.setItem(monthCountKey(), '0')`) and download unlimited PDFs.
// This is the accepted tradeoff of the client-only model — the same one that
// lets a user forge billify_plan='pro' (see useSubscription.ts's transient-
// failure catch). The cap is a BEST-EFFORT nudge against casual overuse and a
// cross-tab double-count guard, NOT a tamper-proof enforcement boundary.
// The atomic reserve in handleDownload exists to stop two of the user's OWN
// tabs from both consuming a slot (a real cross-tab TOCTOU race), not to stop
// the user from editing their own storage. Do not add further "authoritative"
// machinery here without introducing a real server-side counter — it would
// only protect a value the user can overwrite. See useSubscription.ts.
// Local-calendar `YYYY-MM` string. The free-tier counter is keyed by LOCAL
// month (so a tab open across a month boundary stays correct in the user's
// calendar). Centralized here so the local-month format lives in exactly one
// place — monthCountKey routes through it.
function localMonthString(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthCountKey(): string {
  return embedKey(`count_${localMonthString()}`);
}
// No legacy UTC-key fallback: the counter is keyed by LOCAL month, and an empty
// local key means a fresh month (or fresh browser) → 0. A fallback to the UTC
// month key was removed because it was only reachable when local !== UTC, and
// in exactly that case the UTC month is a DIFFERENT calendar month, so
// inheriting its count would paywall the user for the new month (writing
// prevCount+1 into the empty new-month key). Empty → 0 is generous (more free
// downloads), never a paywall. The READ side has no UTC fallback, but the WRITE
// side's leftover UTC key (orphaned when local !== UTC) IS reaped once on mount
// — see the reap step in the mount effect below (and the matching billify_limits
// reap in src/hooks/useSubscription.ts). Host only — embed uses a namespaced
// key and has no monthly cap; the reap step is gated on `!embed` (R36 #1) and
// readMonthCount is only called past handleDownload's isEmbed early-return, so
// it is unreachable in embed mode (no embed guard needed here).
function readMonthCount(): number {
  try {
    const local = localStorage.getItem(monthCountKey());
    if (local) {
      const n = Number(local);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  } catch { return 0; }
}
function writeMonthCount(n: number): void {
  try {
    localStorage.setItem(monthCountKey(), String(n));
  } catch { /* ignore */ }
}

// Sync one logo side-key ('from' | 'to') with the invoice's current logo, using
// the component-scoped lastSavedLogosRef (passed in, not closed over, so this
// stays module-level while the ref itself remains component-scoped — see the
// persistInvoice note). An ABSENT logo unconditionally clears the side-key +
// resets that side of the ref, so deleting a logo always reaps its ~1 MB key
// (whether or not the ref was seeded). A PRESENT logo writes ONLY when it
// differs from the ref: the host restore path seeds the ref from the side-key
// load (new-format), so an unchanged logo skips the ~1 MB synchronous re-write
// on the first save; an unseeded side (a pre-migration logo from the text blob,
// or a handoff / ?invoice= / ?template= load) writes once — the migration that
// moves the logo out of the text blob into its own key. The two sides used to be
// copy-pasted blocks in persistInvoice; collapsing them here keeps the
// diff-gate + setItem/removeItem + ref-update contract in one place so a fix to
// one side can't drift from the other.
function syncLogoSide(
  side: 'from' | 'to',
  logo: string | undefined,
  ref: { current: { from: string | undefined; to: string | undefined } },
): void {
  if (logo) {
    if (logo !== ref.current[side]) {
      localStorage.setItem(logoStorageKey(side), logo);
      ref.current = { ...ref.current, [side]: logo };
    }
  } else {
    // Unconditionally reap the side-key + reset that side of the ref. An ABSENT
    // logo clears the side-key regardless of whether the ref was seeded — the
    // earlier `else if (ref.current[side] !== undefined)` guard short-circuited
    // the unseeded case (handoff / ?invoice= load, where lastSavedLogosRef is
    // still {from:undefined,to:undefined} because only the host-restore path
    // seeds it) and skipped this removeItem, leaving a stale ~1MB side-key from
    // a prior host session orphaned — then resurrected onto a logo-less invoice
    // on the next host-restore, where `lf ?? restored.from.logo` reads the
    // stale key first. removeItem on a never-set key is a no-op, so the
    // unconditional form is correct on the no-logo-ever hot path too (a no-op
    // removeItem plus a string concat against the cached IS_EMBED boolean).
    localStorage.removeItem(logoStorageKey(side));
    ref.current = { ...ref.current, [side]: undefined };
  }
}

export default function AppPage() {
  // Single useSubscription instance for the whole /app route. AppPage and
  // SubscriptionManager share it via props below — a second instance would fire
  // a duplicate POST /api/stripe/validate-token (and a duplicate CSRF-cookie
  // prefetch) on every /app load, doubling server load and the
  // "Checking access..." latency for token-bearing users. The hook is plain
  // state, not a context/singleton, so only one call site may exist.
  const { plan, limits, canCreateInvoice, hasTemplateAccess, initialized, clear, awaitInitialized, error } = useSubscription();
  const [invoice, setInvoice] = useState<Invoice>(PLACEHOLDER_INVOICE);
  const { consumeNextNumber } = useInvoiceCounter();
  const { history, ready, snapshots, recordInvoice, updateStatus, removeRecord, clearHistory, markOverdue } = useInvoiceHistory();
  const { clients } = useClients();
  const [isEmbed, setIsEmbed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState<{ open: boolean; feature: string } | null>(null);
  // R38-1: useSubscription still sets `error` in verifySession's catch (the
  // post-checkout ?checkout=success&session_id= redirect), but R37's removal of
  // the "Restore purchased plan" form deleted the only component that consumed
  // it — so a user who pays, gets redirected back, and whose session verification
  // fails (network blip, Stripe cold-start, 5xx, the 10s abort) landed on a silent
  // free-tier /app with the checkout params lingering and no notice that
  // access wasn't granted. This banner surfaces that failure. `error` is set
  // ONLY by verifySession's catch (and reset to null at its start), so error
  // truthy ⟹ a checkout verification just failed. Dismissible: dismissing
  // hides it for this mount; a reload remounts (state resets) AND re-runs
  // verifySession (the catch intentionally leaves the checkout params intact so
  // the redirect is retried), so the banner re-shows only if the retry fails
  // again — the recovery path stays reload, never blocked by the dismiss.
  const [checkoutErrorDismissed, setCheckoutErrorDismissed] = useState(false);
  // True when the loaded invoice came from a PASSIVE ?invoice= share link (no
  // one-time persist flag consumed). A passive prefill is untrusted (anyone can
  // craft /app?invoice=<their-invoice> and lure a user to it), so it must NOT be
  // bound to the debounced billify_current auto-save — otherwise the user's
  // first edit silently overwrites their saved invoice with the attacker-seeded
  // (or merely shared) invoice, an unrecoverable clobber with no provenance
  // signal (the mount effect strips ?invoice= from the URL). While isPrefill is
  // true the save effect early-returns, mirroring embed mode's scratch model;
  // the user can still edit + download the prefill in memory, and an explicit
  // "Make this my invoice" adopt (see the banner below) clears it and re-dirties
  // so the next debounced save persists — turning adoption from a silent side
  // effect of editing into a deliberate, banner-warned choice.
  const [isPrefill, setIsPrefill] = useState(false);
  // R35 #0: a SECOND read-only-load gate, distinct from isPrefill. isPrefill
  // serves TWO unrelated roles that must NOT be coupled — (a) the anti-phishing
  // banner + Download-disabled-until-adopt friction for an UNTRUSTED passive
  // share link, and (b) the debounced-save guard that preserves billify_current
  // (the save effect early-returns on isPrefill). The embed "Open full-screen"
  // download CTA (persist=false) loads the user's OWN same-origin scratch
  // read-only — it correctly skips isPrefill to avoid the phishing friction on
  // the user's own data, but skipping isPrefill ALSO removed the auto-save guard
  // (role b), so editing the scratch before downloading (e.g. fixing a typo)
  // flipped dirty=true, the debounced save fired, and billify_current was
  // silently overwritten with the scratch — violating the handleOpenFullScreen
  // contract ("persist=false ... saved billify_current is NOT overwritten").
  // isDownloadScratch carries role (b) ALONE for the download-CTA scratch: set
  // in BOTH persist=false load branches (the ?handoff= branch when !persist, and
  // the ?invoice=&download= fallback when download=true), added to the
  // debounced-save guard below, but NOT to the Download button's disabled prop
  // or the phishing banner — the user can still edit-and-download the scratch in
  // one click; only the silent clobber of their saved invoice is prevented.
  const [isDownloadScratch, setIsDownloadScratch] = useState(false);
  // True when the page is framed by an untrusted origin/path (clickjacking
  // defense-in-depth — see isUntrustedFrame). When true we render a refusal
  // instead of the host editor. Set in the mount effect, so SSR and the first
  // client render show the editor (no hydration mismatch); only an actually-
  // framed-untrusted client swaps to the refusal post-mount.
  const [untrustedFrame, setUntrustedFrame] = useState(false);
  // Dirty gate: only user edits persist to billify_current via the debounced
  // save, not programmatic loads and not the free-tier template clamp (which
  // doesn't touch dirtyRef). This avoids clobbering the user's existing saved
  // invoice on a passive load, preserves a free user's saved Pro-template
  // selection until they actually edit, and means the clamp can never clobber a
  // pending edit-save (dirty stays true through the clamp). An explicit "Edit
  // in full-screen" handoff (persist flag consumed) does NOT set dirtyRef=true:
  // it persists SYNCHRONOUSLY via persistInvoice in the mount effect (closing the
  // consume/persist TOCTOU), then sets dirtyRef=false so the debounced save
  // doesn't redundantly re-fire — dirtyRef flips true only if that synchronous
  // write fails (quota), so the debounced save retries once storage frees.
  const dirtyRef = useRef(false);
  // Latest invoice mirrored into a ref so the embed sync-request listener can
  // respond with the current invoice without re-binding on every keystroke.
  const invoiceRef = useRef(invoice);
  // Mirror in an effect, NOT during render: the project's ESLint config flags
  // `react-hooks/refs` (writing a ref during render) as an error. The effect
  // runs after commit, before any async postMessage event handler can fire, so
  // the listener still reads the current invoice.
  useEffect(() => { invoiceRef.current = invoice; }, [invoice]);
  // Apply an invoice into the editor. `commit` controls whether it auto-saves
  // to billify_current: the New button commits (the fresh invoice becomes the
  // current draft immediately, dirty=true → debounced save fires), while
  // Load-from-history does NOT commit — it loads the invoice for preview/editing
  // without overwriting billify_current or reaping the current invoice's logo
  // side-keys (dirty=false → the debounced save effect early-returns). The
  // user's first edit flips dirtyRef true, which is when the loaded invoice
  // persists. This makes Load non-destructive: peeking at a history row can't
  // destroy the in-progress invoice or its uploaded logo.
  const applyInvoiceToEditor = useCallback((inv: Invoice, commit: boolean) => {
    setInvoice(inv);
    setIsPrefill(false);
    setIsDownloadScratch(false);
    dirtyRef.current = commit;
  }, []);
  // Tracks the logo last written to the logo side-keys so persistInvoice can
  // skip the ~1 MB logo re-serialize when only text changed. Initialized to
  // {from:undefined,to:undefined}. On the host restore path the mount effect
  // SEEDS each side from the logo side-key load when that side-key is non-null
  // (the new-format case: the logo already lives in its own key, so re-writing
  // it on the first debounced save buys nothing and would block the main thread
  // on a ~1 MB synchronous setItem). It leaves a side at undefined when the
  // side-key is null — the pre-migration case, where the logo came from the
  // text blob and the first save MUST migrate it out to the side-key (seeding
  // would suppress that migration write and strand the logo in the text blob, so
  // the next reload — which reads the side-key first — would lose it). Handoff
  // / ?invoice= / ?template= loads do NOT seed: their invoice may carry a logo
  // that the first save must write to the side-key. After the first write the
  // ref holds the real logos, so subsequent text-only edits skip the logo key
  // entirely. Reset only by a full clear (error boundary's
  // clearHostInvoiceStorage).
  const lastSavedLogosRef = useRef<{ from: string | undefined; to: string | undefined }>({ from: undefined, to: undefined });
  // Free + host + resolved-plan: the free-tier gate predicate. Computed once
  // here and reused across the download gate, template-select paywall, and the
  // 🔒 badge — four copies of this expression would drift independently.
  const isFreeHost = !isEmbed && initialized && plan === 'free';

  // Analytics: fire once per mount so we can measure how often the editor is
  // opened in host mode (/app) vs. embedded on a profession page (mode:'embed'
  // — the profession-page view itself is counted separately as pseo_view).
  useEffect(() => {
    // Read isEmbedMode() directly — the isEmbed STATE is only flipped in a
    // later-declared mount effect, so capturing it here with [] deps would
    // always read the initial false and mis-attribute every embed session as 'host'.
    track('editor_open', { mode: isEmbedMode() ? 'embed' : 'host' });
  }, []);
  // Plan-resolve window: a host (non-embed) user whose plan is still being
  // validated (a token is present and /api/stripe/validate-token is in flight).
  // Embed and no-token users flip `initialized` synchronously, so this is a
  // zero-length window for them. With the optimistic stored-plan restore in
  // useSubscription, a returning Pro user starts `initialized=false` but already
  // `plan==='pro'`, so the `plan !== 'pro'` gating on previewPending and the
  // Download button label is a no-op for them — no Pro-template flash, no
  // paywall, for the whole round-trip. Only a token-bearing FREE user is held
  // here (plan stays 'free' from the optimistic restore); their preview is
  // gated (previewPending) until the plan settles, so a lapsed-free user cannot
  // see a Pro render before the authoritative response. Their Download button
  // is NOT disabled during the resolve window (a pre-click disable was
  // intentionally removed as redundant — see the Download button comment);
  // instead the cap is enforced inside handleDownload, which awaits
  // awaitInitialized(20000) (the authoritative-plan gate) and reads FRESH gates
  // from gatesRef before any cap-exempt delivery. So a click during the resolve
  // window pauses in that await until the plan settles, then is cap-checked
  // against the resolved plan — a lapsed-free user cannot download past their
  // limit before the authoritative response arrives. The resolve-window
  // predicate itself (`!isEmbed && !initialized`, formerly a `resolvingPlan`
  // const) is now inlined at its only use site — the Download button label,
  // where `!isEmbed` is statically true (the button renders in the `!isEmbed`
  // branch) — as `(!initialized && plan !== 'pro')`, so the const and its dead
  // `!isEmbed` conjunct were dropped (R31 #6).

  // Fresh gate snapshot, updated whenever the gates actually change so an async
  // handler that AWAITS the plan to settle (handleDownload) reads the
  // AUTHORITATIVE post-resolve values, not the stale closure it captured at
  // click-time (when initialized was false and the optimistic plan was still in
  // force). A promise continuation that resumes after `await awaitInitialized`
  // runs in a microtask AFTER the plan-settle commit's synchronous effect phase,
  // so it reads the freshly-updated ref. This is what closes the lapsed-Pro
  // cap-bypass: the click captured optimistic-pro gates (isFreeHost false → no
  // cap), but after awaiting the authoritative plan the ref holds the
  // server-confirmed free gates (isFreeHost true → cap enforced).
  //
  // Deps are [isFreeHost, canCreateInvoice, hasTemplateAccess] — exactly the
  // three values written into the ref — NOT no-deps (every commit). The prior
  // no-deps form re-ran the effect after every commit, including text-only edits
  // where `invoice` changed but the gates didn't (pointless work on every
  // keystroke). The dep array runs the effect ONLY when a gate value changes.
  // This is equivalent for the plan-settle case that matters: when validate-token
  // resolves, `initialized` flips, which flips `isFreeHost` for a user resolving
  // to free (false→true) — and `canCreateInvoice`/`hasTemplateAccess` are
  // useCallbacks with deps [plan, limits] / [limits] (verified in useSubscription),
  // so they change identity exactly when plan/limits change (i.e. on resolve).
  // Every gate-relevant change flows through one of these three deps, so the ref
  // is guaranteed fresh after the plan-settle commit; the dep array just skips
  // the no-op commits in between. (If `limits` ever churned identity per-render
  // the callbacks would too, making the effect run every render — still correct,
  // just no perf win; the array can never MISS a real gate change.)
  const gatesRef = useRef({ isFreeHost, canCreate: canCreateInvoice, hasAccess: hasTemplateAccess });
  useEffect(() => {
    gatesRef.current = { isFreeHost, canCreate: canCreateInvoice, hasAccess: hasTemplateAccess };
  }, [isFreeHost, canCreateInvoice, hasTemplateAccess]);
  // Whether the currently-loaded template is Pro-tier (the 10 paid templates).
  // Used by the preview gate: a free user with a loaded Pro template must not
  // see the Pro render before the clamp (a layout effect) downgrades it.
  // validateInvoice guarantees invoice.template is a real id, so the find
  // never returns undefined in practice.
  const isProTemplate = getTemplate(invoice.template)?.tier !== 'free';
  // Hide the template-specific preview while a clamp could still fire: the
  // loaded template is Pro-tier AND the user is non-embed and not (yet/actually)
  // Pro. Plan is the binary 'free'|'pro', so `plan !== 'pro'` covers both the
  // resolve window (plan optimistically 'free' or still settling) and a settled
  // free user — the two cases the prior `(resolvingPlan && plan !== 'pro') ||
  // isFreeHost` form spelled out separately but that reduce to the same
  // condition (`(!isEmbed && !initialized)` and isFreeHost are mutually
  // exclusive on `initialized`, and isFreeHost already implies plan === 'free'
  // ⊂ plan !== 'pro').
  // A returning Pro user (optimistic plan='pro') and any free-tier-template
  // load (isProTemplate false) short-circuit out, so they see their preview
  // immediately, even mid-resolve. The clamp runs in a LAYOUT effect
  // (useIsomorphicLayoutEffect), so it downgrades before the paint where
  // `initialized` flips — no one-frame Pro-template flash, and no separate
  // clampRan gate is needed: once the clamp downgrades the template,
  // isProTemplate flips false and this gate releases in the same commit.
  const previewPending = isProTemplate && !isEmbed && plan !== 'pro';

  // persistInvoice: write logos to separate side-keys ONLY when they changed vs
  // the last write (lastSavedLogosRef), then write the text-only invoice to
  // `current`. The side-key check is what keeps the debounced save cheap: a
  // text edit doesn't touch the ~1 MB logo, so the logo keys are skipped and
  // only the small text blob is re-serialized. The `logo: undefined` strip
  // below relies on JSON.stringify omitting undefined-valued keys, so `current`
  // never carries a logo — the load path reassembles it from the side-keys.
  // The catch around the logo writes is best-effort: a QuotaExceededError on the
  // logo (the big value) must NOT abort the text save, which is the part that
  // actually matters for not losing the user's typed data.
  //
  // Called from TWO places: the debounced save effect (edits) AND the mount
  // effect's persist-flag branches (handoff "Edit in full-screen", ?invoice=
  // persist fallback). The mount call is SYNCHRONOUS, not debounced: the
  // handoff stash and persist flag are one-time tokens consumed eagerly in the
  // mount effect, so if the persist were left to the 500ms debounced save a tab
  // close in that window would burn the tokens without ever writing
  // billify_current — silently dropping the user's explicit "make this my
  // current invoice" intent with no recovery. Persisting synchronously in the
  // same tick as the consume closes that TOCTOU window; dirtyRef is then set
  // false so the debounced save doesn't redundantly re-fire, and the user's
  // first real edit re-dirties and saves normally.
  // Returns true on a durable text-blob write, false otherwise (storage
  // unavailable/quota). The logo side-key writes are best-effort (their own
  // try/catch) and do NOT determine success — the text blob is the part that
  // matters for not losing typed data. Callers (the mount-effect persist-flag
  // branches and the debounced save) use the return value to decide whether to
  // leave dirtyRef true so the debounced save retries when storage frees: a
  // QuotaExceededError here, if swallowed with dirty=false, would silently lose
  // a consumed persist flag + leave billify_current untouched.
  const persistInvoice = useCallback((inv: Invoice): boolean => {
    if (typeof window === 'undefined') return false;
    // Logo side-keys: keep each side-key in lock-step with the invoice's logo via
    // syncLogoSide (one parameterized helper for both sides — see its comment).
    // An ABSENT logo unconditionally clears the side-key + resets that side of
    // the ref, so deleting a logo always reaps its ~1 MB key (whether or not the
    // ref was seeded — the host restore path seeds from the side-key load). A
    // PRESENT logo writes ONLY when it differs from the ref: when seeded
    // (new-format load) an unchanged logo skips the ~1 MB re-write on the first
    // save; when unseeded (pre-migration logo from the text blob, or a
    // handoff/?invoice=/?template= load) it writes once — the migration that
    // moves the logo out of the text blob into its own key. See lastSavedLogosRef's
    // declaration for the seeding nuance.
    try {
      syncLogoSide('from', inv.from.logo, lastSavedLogosRef);
      syncLogoSide('to', inv.to.logo, lastSavedLogosRef);
    } catch { /* logo write failed (quota/unavailable) — still try the text save */ }
    try {
      const textOnly = stripLogos(inv);
      // Cross-tab write semantics: last-write-wins, no Web Lock / compare-and-set.
      // localStorage has no atomic CAS, and unlike the month-count cap (which IS
      // serialized under navigator.locks.request because concurrent over-counts
      // would breach the monetization limit), billify_current is a single-user
      // working copy where two concurrent writers (e.g. two handoff tabs landing
      // together) simply race — the later write wins and the earlier invoice is
      // lost. That rare overwrite is an ACCEPTED tradeoff: a persist lock for a
      // single-user edge case adds cross-tab coordination complexity for little
      // benefit, and last-write-wins matches the "your current draft" intent.
      localStorage.setItem(embedKey('current'), JSON.stringify({ ...textOnly, updatedAt: Date.now() }));
      return true;
    } catch { return false; }
  }, []);

  // Mount: detect embed mode, then hydrate from storage (host) or prefill from
  // the embed/handoff URL param (embed). Runs once, client-side only. Also reaps
  // the legacy UTC-month count key once (host only) — see the reap step below.
  useEffect(() => {
    const embed = isEmbedMode();
    // isEmbedMode()/isUntrustedFrame() read window.parent.location and are
    // client-only — computing embed/untrusted state during render would
    // mismatch the prerendered HTML (the frame check can't run at build time),
    // so the initial flags must be set in this mount effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEmbed(embed);
    // Defense-in-depth against clickjacking: if we're framed by anything that
    // isn't the trusted same-origin SEO embed, refuse to render the host editor
    // (which would expose billify_* storage and be clickjackable). The CSP
    // frame-ancestors header is the primary guard; this catches a missing one.
    const untrusted = isUntrustedFrame();
    setUntrustedFrame(untrusted);
    if (untrusted) {
      // Data-layer mirror of the render-time refusal: bail before any host
      // storage access — do NOT run the host hydration branch below, which reads
      // the victim's billify_current / billify_sub_token from localStorage and
      // would hand that data to the framing page. The render path returns the
      // refusal UI once untrustedFrame flips, so no invoice state is shown on
      // this path (R36 #6: the prior setInvoice(createEmptyInvoice()) here was
      // dead — the refusal UI never reads invoice state, and the `return` alone
      // is what prevents the host-storage read). Embed (trusted) and top-level
      // tabs have untrusted=false and fall through to their normal branches.
      return;
    }
    // One-time reap of the legacy UTC-month count key (HOST only — `!embed`;
    // untrusted frames already returned above). master keyed the monthly invoice
    // counter by `billify_count_${UTCmonth}`; this PR re-keyed it by LOCAL month
    // (monthCountKey). For a user whose local month differs from UTC month at
    // upgrade time, the old UTC key is orphaned. Only remove it when it DIFFERS
    // from the local key: when local === UTC the strings coincide and the UTC
    // key IS the current month's live counter, so an unconditional remove would
    // wipe it. Mirrors the billify_limits reap in useSubscription's mount effect.
    // R36 #1: embed uses the namespaced billify_embed_count_<local> key (via
    // embedKey), so utcKey ALWAYS differs from monthCountKey() there and the
    // guard would always be true — when local === UTC, billify_count_<utc> IS the
    // host's live counter and the embed iframe's mount would wipe the host's
    // free-tier monthly cap (every profession-page visit → unlimited free
    // downloads). The embed has no host UTC orphan to migrate (namespaced
    // counter, no monthly cap), so skip the reap entirely there. removeItem on a
    // missing key is a no-op, so this is cheap and idempotent on every mount.
    if (!embed) {
      try {
        const utcKey = `billify_count_${new Date().toISOString().slice(0, 7)}`;
        if (utcKey !== monthCountKey()) localStorage.removeItem(utcKey);
      } catch { /* ignore */ }
    }
    try {
      const params = new URLSearchParams(window.location.search);
      // Shared persist-settle invariant for the two "bring an invoice into the
      // persistent editor" branches below (handoff + ?invoice= fallback): dirty
      // flips true ONLY when a persist was requested (the one-time same-origin
      // flag was consumed) AND the durable write failed (quota/unavailable), so
      // the debounced save retries once storage frees — otherwise the consumed
      // flag would be burned and the user's "make this my current invoice"
      // intent silently lost. A read-only load (no flag) settles dirty=false.
      // Centralized here so the two branches can't drift on the operator
      // precedence / short-circuit that makes this safe. Returns the failure
      // boolean it computes (the SAME `persist && !persistInvoice(toPersist)`
      // value it assigns to dirtyRef.current) so each caller's reload-recovery
      // guard reads `if (!failed) { consume + stripUrlParams(...) }` from one
      // source rather than re-rolling `persist && dirtyRef.current` at two sites
      // — the exact drift hazard stripUrlParams itself was centralized to close.
      const settlePersist = (inv: Invoice, persist: boolean): boolean => {
        // Pre-clamp the template when the OPTIMISTIC stored plan is free,
        // mirroring the debounced-save pre-clamp (the save effect below) so this
        // synchronous mount-effect persist can't land a Pro template in
        // billify_current for a free user either (R27 #7 — the handoff + ?invoice=
        // persist-fallback branches called persistInvoice directly, bypassing
        // the debounced-save pre-clamp and leaving a Pro template on disk for a
        // free user until the next edit). The authoritative plan is NOT in React
        // state yet at mount (the mount effect closes over the first render's
        // `plan`, which is the synchronous 'free' default for EVERYONE — including
        // a returning Pro user mid-resolve; the optimistic restore in
        // useSubscription's mount effect runs in the same effect flush and hasn't
        // reflected into `plan`). So gating on the closure `plan`/`!initialized`
        // (the finder's suggested condition) would pre-clamp a Pro user's
        // explicitly-adopted Pro template — a regression. Read the optimistic plan
        // synchronously via getStoredPlan() (the same billify_plan source the
        // mount-effect optimistic restore in useSubscription uses): a Pro user
        // (billify_plan='pro') persists
        // as-is; a free user persists the pre-clamped free template. The fallback
        // uses DEFAULT_LIMITS.templates (PLAN_LIMITS.free.templates) — the free
        // plan's allowed set, unambiguously correct for a free user regardless of
        // closure-`limits` timing (initial limits state IS DEFAULT_LIMITS).
        const tier = getTemplate(inv.template)?.tier;
        const toPersist = getStoredPlan() === 'free' && tier !== 'free'
          ? { ...inv, template: freeFallbackTemplate(DEFAULT_LIMITS.templates) }
          : inv;
        const failed = persist && !persistInvoice(toPersist);
        dirtyRef.current = failed;
        return failed;
      };
      if (embed) {
        // Embed: prefill from ?invoice=<base64url>. Throwaway scratch pad —
        // never read from or write to the host's billify_current. Don't strip
        // ?invoice= here: re-prefilling on reload (which discards scratch edits)
        // is the intended behavior. dirty stays false (embed never saves).
        const decoded = decodeInvoice(params.get(INVOICE_PARAM));
        if (decoded) {
          // decodeInvoice returns a fully-populated Invoice (validateInvoice sets
          // every field), so spreading the placeholder ...prev underneath is a
          // no-op — setInvoice(decoded) directly. (The clamp effect's
          // setInvoice(prev => ({ ...prev, template: fallback })) DOES need
          // ...prev since it patches only one field.)
          setInvoice(decoded);
        } else {
          // Missing or undecodable ?invoice= (a malformed share link, a
          // truncated URL, or the SEO page built a bad src). Without this
          // fallback the editor would stay on the deterministic
          // PLACEHOLDER_INVOICE — empty number/date, one blank line item —
          // which is not a usable scratch pad. Give the user a real fresh
          // invoice to edit. dirty stays false (embed never saves), so this
          // is non-persisting like every other embed load.
          setInvoice(createEmptyInvoice());
        }
        dirtyRef.current = false;
      } else {
        // Explicit handoff from the embed: "Edit in full-screen" (the user
        // chose to bring their scratch invoice into the persistent editor →
        // persisted, dirty=true) OR "Open full-screen" (the embed download CTA
        // → the user just wants to download, NOT replace their saved invoice →
        // read-only, dirty=false). The full invoice (incl. an uploaded logo) is
        // too large for a URL param, so it's stashed in localStorage under a short
        // ?handoff=<token>. Consume the stash BEFORE the stale-handoff sweep
        // below, so a pending token is not swept as an orphan before it can be
        // consumed.
        const handoffToken = params.get(HANDOFF_PARAM);
        const handedOff = peekHandoff(handoffToken);
        if (handedOff) {
          // peekHandoff returns a fully-populated Invoice (validateInvoice sets
          // every field), so setInvoice(handedOff) directly — no ...prev merge.
          // PEEK (not consumeHandoff) so the stash survives a failed
          // durable write — see the consume-on-success note below (R30 #3).
          setInvoice(handedOff);
          // Persist authority: the SAME one-time same-origin persist flag the
          // ?invoice= branch below uses (peekPersistFlag + consumePersistFlag).
          // "Edit in full-screen" stashes the flag (handoffUrl persist=true) →
          // the scratch becomes the current invoice, persisted SYNCHRONOUSLY
          // here (not via the debounced save) so a tab close in the 500ms debounce
          // window can't burn the one-time persist flag without ever writing
          // billify_current. The embed "Open full-screen" download CTA passes no
          // flag (handoffUrl
          // persist=false) → no persist, the scratch loads READ-ONLY so the
          // user's saved billify_current is NOT overwritten — they click
          // Download in this host tab, which enforces the cap/paywall.
          // Unconditional persist here would silently destroy a host user's
          // saved invoice the moment they open a scratch from the embed (the
          // round-15 data-loss regression). Mirroring the ?invoice= branch
          // keeps one persist-authority mechanism, not two. dirty stays false on
          // a read-only load (nothing to save) and on a durable persist (already
          // written); it flips true ONLY when a persist was requested but the
          // write failed (e.g. QuotaExceededError) so the debounced save retries
          // once storage frees. The user's first real edit re-dirties either way.
          // Peek the persist flag WITHOUT consuming it (R34 #1: mirror the
          // handoff-stash split). The flag is cleared (consumePersistFlag) only
          // after the durable billify_current write succeeds — a
          // QuotaExceededError leaves it + ?persist= in place so a reload re-
          // peeks, re-enters this persist branch, and re-attempts the auto-
          // persist (recovering the "make this my current invoice" intent, not
          // just the data). The prior one-call eager-consume form consumed the flag
          // BEFORE the write, so a failed persist burned it and the reload was
          // read-only (data preserved via the handoff stash peek, but the auto-
          // persist intent lost).
          const persistToken = params.get(PERSIST_PARAM);
          const persist = peekPersistFlag(persistToken);
          // R35 #0: a !persist handoff load is the embed "Open full-screen"
          // download CTA (handoffUrl persist=false) — the user's OWN scratch,
          // loaded read-only. Gate the debounced-save guard (isDownloadScratch)
          // so an edit before download doesn't silently overwrite billify_current
          // — WITHOUT the isPrefill phishing friction (it's the user's own data,
          // not an untrusted share link). A persist=true handoff ("Edit in
          // full-screen") is the make-current intent → leave isDownloadScratch
          // false so edits auto-save as normal.
          if (!persist) setIsDownloadScratch(true);
          const failed = settlePersist(handedOff, persist);
          // R30 #3: consume the handoff stash + strip the URL params ONLY when
          // the durable billify_current write succeeded (or this is a read-only
          // load, persist=false). The prior order consumed the handoff token
          // (the consume) BEFORE persistInvoice ran, so if that write then hit
          // QuotaExceededError (the storage-full case a large-logo scratch
          // produces) the scratch lived only in React state with a debounced
          // retry — and handoffUrl emits no ?invoice= fallback on the
          // stashHandoff-success path, so closing the tab before the 500ms retry
          // lost the scratch irrecoverably (reload → empty invoice). Peek-then-
          // consume-on-success closes that: on a failed persist (`failed`, the
          // boolean settlePersist returns — the SAME value it assigned to
          // dirtyRef.current) leave the handoff stash + the ?handoff= URL param
          // AND the persist flag + ?persist= param so a reload re-peeks the
          // scratch AND re-attempts the auto-persist (R34 #1 — previously the
          // eager one-call consume burn made the reload read-only: data preserved
          // via the stash, auto-persist intent lost). The debounced save
          // retries once storage frees either way. The persist flag stays
          // one-time (peekPersistFlag above + consumePersistFlag on success), so
          // a stale handoff URL revisited after a FAILED first persist re-loads
          // + re-persists within HANDOFF_TTL_MS; the sweep reaps the orphan
          // handoff stash + flag after HANDOFF_TTL_MS. A successful persist or
          // a read-only load consumes the stash + flag + strips the params.
          if (!failed) {
            if (persist) consumePersistFlag(persistToken);
            consumeHandoff(handoffToken);
            stripUrlParams(HANDOFF_PARAM, PERSIST_PARAM, INVOICE_PARAM);
          }
          // else: persist requested but the durable write failed — leave the
          // handoff stash + ?handoff= URL param AND the persist flag + ?persist=
          // for reload recovery. dirty stays true so the debounced save retries
          // once storage frees; the unconsumed flag lets the reload re-attempt
          // the auto-persist (R34 #1).
        } else {
          // ?invoice= prefill. Two intents share this param:
          //  - A share link / backwards-compat URL: passive — show it but do NOT
          //    persist on load (dirty=false), so merely visiting a share link
          //    doesn't clobber the user's existing saved invoice.
          //  - The "Edit in full-screen" fallback when stashHandoff() failed
          //    (localStorage full): the user still explicitly chose to make this
          //    their current invoice, so it IS persisted (dirty=true). The
          //    fallback navigates with &persist=<token> (a one-time same-origin
          //    localStorage flag stashed by handoffUrl, peeked by
          //    peekPersistFlag + consumed by consumePersistFlag only on a
          //    successful durable write — R34 #1) to mark that intent; a plain
          //    share link carries no such flag. Strip the params so a reload
          //    restores their saved work. (The token-based flag is described in
          //    full just below.)
          const decoded = decodeInvoice(params.get(INVOICE_PARAM));
          // Persist authority: "make this my current invoice" (dirty=true, the
          // debounced save overwrites billify_current) vs a passive share link
          // (dirty=false, so merely visiting doesn't clobber the saved invoice).
          // The embedded editor — a same-origin /invoice-template-for/* iframe
          // — stashes a one-time same-origin persist flag in localStorage and
          // carries only the token in ?persist=<token>; peekPersistFlag validates
          // it and consumePersistFlag clears it only after the durable write
          // succeeds. This replaces the old forgeable ?persist=1 boolean +
          // document.referrer gate. The URL is attacker-controllable: anyone can
          // craft /app?invoice=<attacker-invoice>&persist=1 and lure a host user
          // with a saved invoice into clicking it — the referrer check was the
          // only barrier and it is forgeable (a same-origin opener path, an open-
          // redirect, or a no-referrer edge case all slip through). The same-
          // origin localStorage flag is unforgable cross-origin: only the embed
          // iframe (same-origin with /app) can stash it, so an attacker page that
          // merely links to /app?persist=<anything> has no flag stashed and
          // peekPersistFlag returns false → the invoice loads read-only as a
          // prefill (dirty=false), the safe fallback. The handoff-stash path
          // (peekHandoff above) is separately safe — it reads a same-origin
          // localStorage token the attacker cannot write cross-origin.
          if (decoded) {
            // Peek the persist flag WITHOUT consuming it (R34 #1: mirror the
            // handoff-stash + handoff-branch split above). The flag is cleared
            // (consumePersistFlag) only after the durable billify_current write
            // succeeds — a QuotaExceededError leaves it + ?persist= in place so a
            // reload re-peeks, re-enters this persist branch (no isPrefill), and
            // re-attempts the auto-persist. The prior one-call eager-consume form
            // consumed the flag BEFORE the write: on a failed persist the reload
            // fell through to the read-only prefill branch — isPrefill=true gated
            // the debounced save so the user's edits did NOT auto-save until they
            // clicked "Make this my invoice", and stripUrlParams deleted ?invoice=
            // so a SECOND reload lost the scratch entirely — downgrading the
            // user's explicit "make this my current invoice" intent to an
            // untrusted-share-link experience for their OWN data. Peeking (not
            // consuming) when there's a decoded invoice to persist with it also
            // avoids wasting the one-time token on a malformed ?invoice=
            // (handoffUrl always emits ?persist= alongside ?invoice=, so a
            // ?persist-without-?invoice URL shouldn't occur anyway).
            const persistToken = params.get(PERSIST_PARAM);
            const persist = peekPersistFlag(persistToken);
            // The download flag (persist=false only — handoffUrl never emits
            // ?persist= and ?download= together: buildPersistParam stashes when
            // persist is true, buildDownloadParam only when persist is false)
            // marks the user's OWN same-origin download-CTA scratch as read-only-
            // but-downloadable, skipping isPrefill (the anti-phishing gate a
            // genuine passive share link triggers). A passive share link (no
            // persist, no download) DOES get isPrefill. Collapsed from a three-
            // way if/else-if/else that duplicated settlePersist(decoded, false)
            // across the two read-only arms (R34 #7) — the persist boolean
            // already captures the persist-vs-read-only decision, so the download
            // flag's only behavioral effect is whether isPrefill is set. The
            // short-circuit `!persist && takeDownloadFlag(...)` ensures the
            // download flag is consumed only when !persist, matching the prior
            // else-if ordering.
            const download = !persist && takeDownloadFlag(params.get(DOWNLOAD_PARAM));
            setInvoice(decoded);
            if (!persist && !download) setIsPrefill(true);
            // R35 #0: download=true means this ?invoice= load is the embed
            // "Open full-screen" download-CTA FALLBACK (handoffUrl persist=false
            // when stashHandoff failed) — the user's own scratch, read-only-but-
            // downloadable. Gate the debounced-save guard (isDownloadScratch) so
            // an edit before download doesn't silently overwrite billify_current,
            // WITHOUT the isPrefill phishing friction (download skips isPrefill
            // above; this restores the auto-save guard that skip removed).
            if (download) setIsDownloadScratch(true);
            const persistFailed = settlePersist(decoded, persist);
            // R31 #3 + R34 #1: consume the persist flag + strip the URL params
            // ONLY when the durable write succeeded (or this is a read-only load,
            // persist=false — peekPersistFlag returned false so there's no flag to
            // consume). On a failed persist (`persistFailed` — the boolean
            // settlePersist returned, the durable write hit QuotaExceededError)
            // leave ?invoice= + ?persist= in the URL so a reload re-decodes the
            // scratch from ?invoice= AND re-peeks the still-present flag to re-
            // enter this persist branch (no isPrefill) and re-attempt the auto-
            // persist — the same recovery R30 #3 gives the handoff stash, which
            // the prior eager one-call consume burn denied (the reload was read-
            // only: data preserved via ?invoice=, but auto-persist intent lost,
            // AND isPrefill gated the debounced save so edits didn't auto-save).
            // The debounced save retries once storage frees either way. A
            // successful persist, a read-only download CTA (persist=false), or a
            // passive share link (persist=false) consumes the flag (if any) +
            // strips all params.
            if (!persistFailed) {
              if (persist) consumePersistFlag(persistToken);
              stripUrlParams(INVOICE_PARAM, PERSIST_PARAM, DOWNLOAD_PARAM);
            }
            // else: persist requested but the durable write failed — leave
            // ?invoice= + ?persist= for reload recovery. dirty stays true so the
            // debounced save retries once storage frees; the unconsumed flag lets
            // the reload re-attempt the auto-persist (R34 #1).
          } else {
            // Host: restore the user's saved invoice, or start a fresh one.
            // Wrap the parse in its own try/catch so corrupt billify_current
            // (interrupted write, disk corruption, manual edit) yields a fresh,
            // usable invoice — not the deterministic PLACEHOLDER_INVOICE, which
            // has an empty number/date and is not something to edit. This
            // re-establishes the old loadInvoice() invariant.
            let restored: Invoice | null = null;
            try {
              const raw = localStorage.getItem(embedKey('current'));
              restored = raw ? validateInvoice(JSON.parse(raw)) : null;
            } catch { restored = null; }
            // Reassemble logos from the side-keys. `current` is text-only (logos
            // stripped by persistInvoice), so the invoice's from/to logos are
            // undefined here; read the dedicated logo keys instead. Fall back to
            // any logo still embedded in `current` — a pre-migration save (older
            // build, before the split) keeps its logo in the text blob, and the
            // first save after this load migrates it out to the side-key. The
            // `??` covers all cases: side-key present → use it; absent → embedded
            // (undefined for a new-format or never-logo invoice). SEED
            // lastSavedLogosRef from the side-key loads (lf/lt) when they're
            // non-null — the new-format case, where the ~1 MB data URL is already
            // in its own key and re-writing it on the first save would block the
            // main thread for nothing. Leave a side at undefined when its side-key
            // is null (pre-migration): the first save must migrate that logo out
            // of the text blob, and seeding would suppress that migration write
            // (stranding the logo in the text blob, so the next reload — which
            // reads the side-key first — would lose it). See lastSavedLogosRef's
            // declaration for the full seeding rationale.
            if (restored) {
              const lf = localStorage.getItem(logoStorageKey('from'));
              const lt = localStorage.getItem(logoStorageKey('to'));
              restored = {
                ...restored,
                from: { ...restored.from, logo: lf ?? restored.from.logo },
                to: { ...restored.to, logo: lt ?? restored.to.logo },
              };
              // Seed from the side-key loads (lf/lt), coercing null→undefined
              // (the ref holds `string | undefined`, and a null side-key means
              // "no logo in its own key" = undefined, which keeps the first-save
              // migration path live — see lastSavedLogosRef's declaration). The
              // prior `?? lastSavedLogosRef.current.from` fallback was dead: this
              // mount effect runs once (deps [persistInvoice], stable) and the ref
              // starts at {from:undefined,to:undefined}, so the fallback was always
              // undefined whenever lf/lt were null — `?? undefined` says exactly
              // that, without the misleading appearance of reading prior state.
              lastSavedLogosRef.current = {
                from: lf ?? undefined,
                to: lt ?? undefined,
              };
            }
            let next = restored ?? createEmptyInvoice();
            // Genuine first visit (no saved invoice AND the counter was never
            // set): pre-fill the first SEQUENTIAL number (INV-1001) instead of
            // createEmptyInvoice's random fallback, so the very first invoice a
            // new user sees starts the INV-1XXX series. Read the counter straight
            // from localStorage — useInvoiceCounter's state isn't populated at
            // first-mount (effect-timing, same trap as isEmbed) — and only
            // consume when it's genuinely null, so reloads, returning users, and
            // a counter set by the "New" button are all left untouched.
            if (!restored) {
              try {
                if (window.localStorage.getItem('billify_invoice_counter') === null) {
                  next = { ...next, number: consumeNextNumber() };
                }
              } catch {
                /* storage unavailable — keep the random number */
              }
            }
            // /templates "Use Template" link: /app?template=<id>. Apply the
            // chosen template to the loaded invoice (saved or fresh). Passive —
            // dirty=false so merely visiting doesn't clobber the user's saved
            // template choice (reload restores it). Validated against the real
            // template ids; an unknown id is ignored (lands on the restored/
            // fresh template) rather than producing a broken <select>. A free
            // user clicking a Pro template's "Use Template" is handled by the
            // clamp effect below, which downgrades it to a free template.
            const tpl = params.get(TEMPLATE_PARAM);
            if (tpl && isTemplateId(tpl)) {
              next = { ...next, template: tpl };
              stripUrlParams(TEMPLATE_PARAM);
            }
            setInvoice(next);
            dirtyRef.current = false;
          }
        }
      }
    } catch { /* ignore corrupt storage/param */ }
    // Sweep orphaned full-screen handoff stashes (the user abandoned the
    // full-screen tab before this host consumed its token). Each orphan would
    // otherwise leak ~1 MB of logo data URL in localStorage. Runs AFTER
    // consumeHandoff so a pending token is consumed first. Runs in embed mode too:
    // the embed iframe shares localStorage with the host (same-origin) and is the
    // most frequent /app mount path for profession-page users, so reaping here
    // prevents embed-only users from accumulating orphans (the producer,
    // EmbeddedEditor on the profession page, never runs the sweep itself). Safe
    // because the sweep only touches billify_handoff_* (host-namespace) keys —
    // fresh pending handoffs are < TTL so they're not reaped, and embed sessions
    // use the billify_embed_* namespace which the sweep never touches.
    cleanupStaleHandoffs();
    // No count-key migration: when local === UTC (the common case) the new
    // local key string is identical to the legacy UTC key master wrote, so the
    // user's existing count is read directly with no migration step. When local
    // !== UTC at first run the count resets to 0 (generous, never a paywall) —
    // see readMonthCount for why no always-on legacy fallback is safe.
  }, [persistInvoice]);

  // Debounced save to localStorage — persists only user edits, not programmatic
  // loads (handoff/?invoice= persist SYNCHRONOUSLY via persistInvoice when the
  // persist flag is consumed, then set dirty=false; restore and passive ?invoice=
  // set dirty=false too) and not the free-tier template clamp (which doesn't
  // touch dirtyRef). Skipped entirely in embed mode (throwaway scratch pad), for
  // a passive ?invoice= prefill (isPrefill) — a shared/untrusted invoice must
  // not auto-overwrite billify_current on the user's first edit; the user adopts
  // it explicitly via the prefill banner to re-enable the save — AND for a
  // download-CTA scratch (isDownloadScratch, R35 #0) — the embed "Open full-
  // screen" persist=false load is the user's own read-only scratch, so an edit
  // before download must NOT silently clobber their saved billify_current either
  // (the same data-preservation concern as isPrefill, decoupled from the
  // phishing friction the download flag correctly skips).
  //
  // The save persists IMMEDIATELY in every case — it is NOT held on plan
  // resolution. The prior form held an optimistic-FREE user's Pro-template edit
  // (`!initialized && templateTier !== 'free' && plan !== 'pro'` → return) until
  // validate-token settled. That hold opened a data-loss window of up to ~16s
  // (the worst-case validate-token settle: 8s CSRF prefetch + 8s POST): a
  // token-bearing FREE user who loaded a Pro template via ?template= / a handoff
  // and edited within that window lost their text if they closed the tab before
  // the plan resolved and the debounced save finally fired — nothing was
  // persisted while the hold was in force. Embed/no-token users flip
  // `initialized` synchronously, so the hold was a zero-length window for them;
  // only a token-bearing optimistic-FREE user on a Pro template hit it, which is
  // exactly why the window went unnoticed.
  //
  // The hold's INTENT — don't durably write a Pro template to billify_current for
  // a user the clamp will downgrade — is preserved WITHOUT the data-loss window
  // by pre-clamping ON SAVE: when the one held case applies (optimistic-free,
  // Pro template, plan unresolved), the debounced save writes the invoice with
  // `template` swapped to the SAME free-tier fallback the clamp effect below
  // would pick (templates.find(tier==='free' && allowed.includes(id)) ?? 'modern'),
  // NOT the Pro template the live state still shows. The user's text is
  // persisted immediately (no 16s window), and the durable state is already
  // clamp-compliant, so when plan resolves to free the clamp is a no-op on the
  // template field (it sets the same fallback the save already wrote). The user
  // keeps seeing the Pro template in the UI until the clamp swaps it on
  // plan-resolve — only the DURABLE state is pre-clamped, which is exactly what
  // the hold was protecting.
  //
  // The other two cases persist the live invoice as-is: a free-tier template is
  // safe regardless of plan, and an optimistic-PRO user's Pro-template edit is
  // safe (the clamp early-returns on plan !== 'free'). Pre-clamping only the
  // optimistic-free+Pro case also bounds the rare optimistic-free-but-actually-
  // Pro case (billify_plan missing) to losing the template CHOICE on disk, not
  // the text — strictly better than the hold, which lost everything for 16s.
  // Resolves dirty on a successful save so the next edit re-triggers it. The
  // cleanup clears the pending timer when a new edit arrives within the 500ms
  // window.
  //
  // Debounce-via-effect is the intentional choice over a ref-scheduler driven
  // from the edit callbacks (saveTimerRef + a scheduleSave() called in each
  // updater). The `invoice` dep makes this effect fire on EVERY mutation source
  // from ONE site — the six edit callbacks (update/updateFrom/updateTo/
  // updateItem/addItem/removeItem), handleLogoUpload, the "New" button, the
  // prefill-adopt handler, AND the mount-effect persist-retry that flips
  // dirty=true on a quota failure so the save retries once storage frees. A
  // ref-scheduler would have to be wired into each of those sites (and every
  // future one) or silently drop the user's edits — trading a critical data-
  // persistence safety property (no missed save = no lost work) for the
  // micro-optimization the per-keystroke effect re-run saves. That re-run is a
  // function call + the cheap early-return guard + clearTimeout/setTimeout
  // churn, and the only case it "wastes" is a PERMANENTLY gated session
  // (isEmbed/isPrefill/isDownloadScratch, stable for the session) — which is a
  // throwaway scratch pad whose per-keystroke perf is irrelevant, and which
  // early-returns before any storage work. The ungated host-editing case re-runs
  // per keystroke and resets the 500ms timer — exactly what a debounce should
  // do. Keeping the effect preserves the single-source "every mutation saves"
  // invariant; the alternative's fragility on this path is not worth the gain.
  useEffect(() => {
    if (isEmbed || isPrefill || isDownloadScratch || !dirtyRef.current) return;
    // isProTemplate is the single-source Pro-tier predicate (declared at render
    // scope above, derived from invoice.template which is in this effect's deps)
    // — reused here instead of recomputing getTemplate(invoice.template)?.tier,
    // so the clamp/pre-clamp/preview-gate sites can't drift on the tier test.
    const needsPreClamp = !initialized && isProTemplate && plan !== 'pro';
    // The free-tier fallback the clamp effect below picks — via the shared
    // freeFallbackTemplate helper (src/types) so the pre-clamped durable state
    // and the post-clamp live state can't drift. `limits` is in deps so a
    // plan/limits change re-runs and recomputes the fallback. Computed LAZILY
    // (only when needsPreClamp) so the O(templates×list) scan doesn't run on
    // every keystroke when not pre-clamping — the common case (initialized, or a
    // free-tier template, or a Pro plan), where the prior unconditional call
    // threw the fallback away (R32-c).
    const toPersist = needsPreClamp
      ? { ...invoice, template: freeFallbackTemplate(limits.templates) }
      : invoice;
    const timer = setTimeout(() => {
      // Clear dirty only on a durable write; on a quota failure leave it true so
      // the next render's edit (or this same invoice re-running) retries once
      // storage frees — otherwise a transiently-full localStorage would silently
      // drop the user's edits the way a consumed-but-unwritten persist would.
      if (persistInvoice(toPersist)) dirtyRef.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [invoice, isEmbed, isPrefill, isDownloadScratch, initialized, plan, limits, persistInvoice, isProTemplate]);

  // Embed handoff down-channel: when the user clicks "Edit in full-screen" on
  // the profession page, the parent EmbeddedEditor posts 'billify-sync-request'
  // asking for the current invoice. Respond immediately with the live invoice
  // so the handoff carries the user's latest keystrokes — no debounce race and
  // no per-keystroke postMessage. Replaces the prior debounced up-channel,
  // which lagged the handoff by up to 200ms and re-rendered the parent on every
  // edit. Reads invoiceRef so the listener binds once, not on every keystroke.
  useEffect(() => {
    // isEmbedMode() already guarantees window.parent !== window, so the prior
    // `if (window.parent === window) return;` here was dead (never true when
    // isEmbed is true) — removed.
    if (!isEmbed || typeof window === 'undefined') return;
    const onMessage = onTrustedMessage(
      MSG_SYNC_REQUEST,
      () => {
        window.parent.postMessage({ type: MSG_INVOICE_FRESH, invoice: invoiceRef.current }, window.location.origin);
      },
    );
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isEmbed]);

  const update = useCallback((patch: Partial<Invoice>) => {
    setInvoice(prev => ({ ...prev, ...patch, updatedAt: Date.now() }));
    dirtyRef.current = true;
  }, []);

  // Clamp a free user's loaded Pro template down to a free one — but only once
  // `plan` has actually resolved. validateInvoice accepts all 12 template ids
  // with no tier check, and the <select> paywall only fires on user onChange,
  // so a Pro template arriving via the handoff or a crafted ?invoice= URL would
  // otherwise load and render for a free user. useSubscription initializes plan
  // to 'free' synchronously and only flips to 'pro' after /api/stripe/
  // validate-token resolves. The `initialized` flag is false until the hook's
  // validation settles. On a transient validate-token failure (network blip,
  // 5xx), the hook now restores the stored plan instead of collapsing to 'free',
  // so this clamp cannot fire on a momentary outage and downgrade a logged-in
  // Pro user's saved template. Embed is exempt (all 12 templates are free).
  //
  // The clamp mutates the template in state (so the <select> and preview show a
  // free template) via setInvoice directly — NOT update() — so it does NOT mark
  // the invoice dirty and never causes a save by itself. A free user's saved
  // Pro-template selection therefore stays in billify_current on disk until
  // their first edit — at which point the now-downgraded free-tier invoice
  // persists normally, retiring the saved Pro selection. That is intentional,
  // not a regression: a free user can no longer DOWNLOAD a Pro-template invoice
  // (the download gate above paywalls it), so keeping a Pro template they can't
  // use would be misleading. The clamp shows them a usable free template
  // instead, and the first edit makes that the durable choice. A pending
  // edit-save is never clobbered by the clamp (dirty stays true through it).
  // ACCEPTED TRADEOFF (behavior change vs master): a returning free user who
  // saved a Pro template (e.g. saved while Pro, then lapsed) sees it swapped to
  // a free template on load, and their first edit overwrites the saved Pro
  // selection — the capability removal that pairs with the download gate.
  //
  // Runs as a LAYOUT effect (useIsomorphicLayoutEffect) so the downgrade commits
  // before the browser paints the render where `initialized` flipped — a free
  // user loading a Pro template never sees a one-frame Pro flash. That also
  // removes the need for the clampRan gate the prior passive-effect version
  // needed to cover that frame: by the time paint happens, isProTemplate is
  // already false and the preview gate (previewPending) releases in the same
  // commit. (useIsomorphicLayoutEffect falls back to useEffect during the
  // build-time prerender so React doesn't warn about useLayoutEffect on the
  // server — the clamp is a no-op there anyway, plan being 'free' is a client
  // runtime concern.) setInvoice is the first sync setState lexically in this
  // effect, so it carries the set-state-in-effect suppression.
  useIsomorphicLayoutEffect(() => {
    if (isEmbed || !initialized || plan !== 'free') return;
    // isProTemplate is the single-source Pro-tier predicate (declared at render
    // scope above, derived from invoice.template). It is in this effect's deps,
    // so every tier-relevant template change (free→pro or pro→free) re-runs the
    // effect via the boolean — the raw invoice.template is NOT in the deps
    // because the body never reads it directly (a same-tier switch, e.g.
    // modern→classic, leaves isProTemplate unchanged and the body is a no-op, so
    // re-running on the raw id would be wasted work) — reused here instead of
    // recomputing getTemplate(invoice.template), so the clamp/pre-clamp/preview-
    // gate sites can't drift on the tier test.
    if (isProTemplate) {
      // Downgrade to a free template the user actually has access to, derived
      // from the server-configured limits.templates — NOT a hardcoded
      // 'modern'. If the free plan were ever configured to exclude 'modern'
      // (e.g. limits.templates = ['classic']), a hardcoded 'modern' would pick a
      // template the download gate (hasTemplateAccess) then paywalls — locking
      // the user out of the very invoice the UI chose for them. Pick the first
      // free-tier template id that's in the allowed set, so the result is a
      // TemplateType the download gate will accept. DEFAULT_LIMITS includes
      // 'modern', so this is 'modern' in the common case. Routed through the
      // shared freeFallbackTemplate helper (src/types) so this and the pre-clamp
      // save effect above pick the SAME fallback and can't drift.
      const fallback = freeFallbackTemplate(limits.templates);
      // This writes the clamped template into state (so the <select> and preview
      // show a free template). It does NOT set dirtyRef, so it does NOT trigger
      // auto-save by itself — the saved Pro template stays in billify_current on
      // disk until the user's first edit, at which point the now-free-tier invoice
      // persists (retiring the Pro selection the user can no longer download —
      // see the docblock above for the accepted tradeoff). It only fires on a
      // plan/template transition (guarded above), not every render.
      setInvoice(prev => ({ ...prev, template: fallback }));
    }
  }, [plan, isEmbed, initialized, limits, isProTemplate]);

  const updateFrom = useCallback((patch: Partial<Invoice['from']>) => {
    setInvoice(prev => ({ ...prev, from: { ...prev.from, ...patch }, updatedAt: Date.now() }));
    dirtyRef.current = true;
  }, []);

  const updateTo = useCallback((patch: Partial<Invoice['to']>) => {
    setInvoice(prev => ({ ...prev, to: { ...prev.to, ...patch }, updatedAt: Date.now() }));
    dirtyRef.current = true;
  }, []);

  // Payment-means (bank details) editor. paymentMeans is only retained by
  // validateInvoice when it has a `code`, so default to SEPA '58' the moment any
  // field is entered — otherwise an IBAN typed alone would be dropped on reload.
  const updatePayment = useCallback((patch: Partial<PaymentMeans>) => {
    setInvoice(prev => ({
      ...prev,
      // Spread prev first so a future PaymentMeans field flows through without
      // editing this merge; DEFAULT_PAYMENT_CODE only applies when no code is
      // set yet (validateInvoice drops a paymentMeans with no code).
      paymentMeans: {
        code: DEFAULT_PAYMENT_CODE,
        ...(prev.paymentMeans ?? {}),
        ...patch,
      },
      updatedAt: Date.now(),
    }));
    dirtyRef.current = true;
  }, []);

  const updateItem = useCallback((idx: number, patch: Partial<Invoice['items'][0]>) => {
    setInvoice(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, items, updatedAt: Date.now() };
    });
    dirtyRef.current = true;
  }, []);

  const addItem = useCallback(() => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }],
      updatedAt: Date.now(),
    }));
    dirtyRef.current = true;
  }, []);

  const removeItem = useCallback((idx: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
      updatedAt: Date.now(),
    }));
    dirtyRef.current = true;
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, target: 'from' | 'to') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      // R35 #6: special-case SVG with the security-specific message master had
      // (master hand-rolled `data:image/svg+xml` prefix checks). SVG is rejected
      // by the allowlist either way (security enforced — an SVG logo can carry
      // scripts/external refs), but the generic 'PNG, JPEG, or WebP' message
      // hid WHY svg is rejected. Call it out so a user uploading an SVG knows
      // it's a deliberate security boundary, not a format oversight.
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        setLogoError('SVG files are not supported for security reasons.');
        return;
      }
      setLogoError('Logo must be PNG, JPEG, or WebP.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Logo must be under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader fires onloadend on BOTH success and error (the terminal
      // handler), so no separate onerror is needed. On a failed read
      // reader.result is null and reader.error is set — check it first: without
      // it, a failed read would cast `null as string` into isValidLogoDataUrl
      // and surface the wrong message ("Invalid image file." instead of the
      // honest read-failure one).
      if (reader.error) {
        setLogoError('Failed to read image.');
        return;
      }
      const base64 = reader.result as string;
      // Re-check the data-URL shape with the shared allowlist-derived validator
      // (isValidLogoDataUrl — MIME prefix against ALLOWED_LOGO_TYPES + decoded
      // byte cap). The authoritative gate is file.type/file.size above; this is
      // defense-in-depth. One source of truth for the accepted logo data-URL
      // shape, shared with sanitizeLogo (every non-upload ingestion path) so
      // the two can't drift.
      if (!isValidLogoDataUrl(base64)) {
        setLogoError('Invalid image file.');
        return;
      }
      if (target === 'from') updateFrom({ logo: base64 });
      else updateTo({ logo: base64 });
    };
    reader.readAsDataURL(file);
  }, [updateFrom, updateTo]);

  const handleDownload = useCallback(async () => {
    // Embed is a try-only scratch surface, not a download path: the Download
    // button is hidden in embed (see the nav below) and download is driven
    // through the host "Open full-screen" handoff so the free-tier cap and Pro
    // paywall apply. Guard here too as defense-in-depth so a future code path
    // that invokes handleDownload from embed can't bypass the monetization wall
    // (every gate below is isFreeHost-gated, which is false in embed, so without
    // this guard the PDF would deliver with no count, no paywall, no server
    // round-trip — the embed bypass).
    if (isEmbed) return;
    // R38-5: a single outer try/finally spans the whole body so the Download
    // button is re-enabled and any created blob URL is revoked on EVERY path —
    // including the three early returns (Pro-template paywall, monthly-cap
    // paywall, PDF-generation failure) that previously each hand-rolled
    // setDownloading(false) before returning. `return` inside the try runs the
    // finally, so those three manual setDownloading(false) calls are gone and
    // the re-enable guarantee is structural (one place) instead of spread
    // across four. `url` is hoisted here — declared before the first early
    // return — so the finally's `if (url)` is never read in a temporal dead zone
    // on an early-return path: it is null until reserveAndDeliver (below)
    // assigns it, so the finally is a no-op revoke until then.
    // navigator.locks.request can reject (lock manager unavailable mid-request,
    // the document loses lock access, a SecurityError); without the outer
    // finally, that rejection would skip setDownloading(false) (button stuck
    // disabled on "Generating..." with no in-app recovery short of reload) and
    // leak any object URL created before the rejection — the same guarantee the
    // prior inner-only try/finally provided, now extended to the early returns.
    let url: string | null = null;
    setDownloading(true);
    try {
    // Wait for the AUTHORITATIVE plan before any cap-exempt delivery path. The
    // optimistic plan restored from billify_plan during the resolve window is
    // NOT authoritative — an EXPIRED-JWT lapsed-Pro still has billify_plan='pro'
    // optimistically until validate-token returns 401 → resetToFree/free. Without
    // this await, the click captures the optimistic-pro gates (isFreeHost false,
    // no cap) and that lapsed-Pro downloads uncapped during the window — a no-
    // devtools grace bypass. Awaiting the hook's `initialized` (which flips in
    // validate-token's finally) then reading the FRESH post-resolve gates from
    // gatesRef means the expired-token lapsed-Pro is cap-checked against the
    // server's free. A genuine Pro user awaits sub-second (until Pro is
    // confirmed) then downloads uncapped, so the optimistic-preview UX win (no
    // flash, the button is clickable immediately) is preserved.
    //
    // "Authoritative" = the JWT is valid and unexpired, NOT that the live Stripe
    // subscription is still active. validate-token verifies the JWT signature +
    // exp only and never re-queries Stripe (see api/stripe-server.js: stateless,
    // no revocation list, cancellation webhook writes no revocation record). So a
    // CANCELLED Pro whose JWT has not yet hit its 7-day exp still resolves to
    // plan='pro' here and downloads uncapped — the cancellation grace is bounded
    // to the JWT's 7-day lifetime (an accepted tradeoff of the no-backend model,
    // documented on the route), NOT closed by this await. This await closes only
    // the EXPIRED-token lapsed-Pro window (401 → resetToFree → free).
    //
    // The safety net MUST exceed the worst-case settle of `initialized` across
    // EVERY path that flips it, not just validate-token. Three paths flip it
    // (each POST is made via postJson in useSubscription, which wraps
    // fetchWithTimeout + postHeaders — the primitives named in these budgets
    // are the real mechanism postJson composes, not a stale literal):
    //  - validate-token's happy path: `fetchWithTimeout(..., { headers:
    //    await postHeaders(), ... }, 8000)`, and `await postHeaders()` resolves
    //    BEFORE the POST's 8s timer starts — and on a first visit / after the
    //    billify_csrf cookie has aged out (Max-Age=3600), postHeaders runs a
    //    SEPARATE `fetchWithTimeout(API_BASE+'/', ..., 8000)` CSRF prefetch. So
    //    validate-token's worst case is 8s (prefetch) + 8s (POST) = 16s.
    //  - validate-token's 401 → refresh-token path (R37 #0/#1): on an EXPIRED
    //    JWT the validate-token POST returns 401 (a response, not an abort, so
    //    the 8s POST completes just under its deadline) and the IIFE then calls
    //    `await refreshToken(token)`. refreshToken's own `await postHeaders()`
    //    reuses the billify_csrf cookie just set by validate-token's prefetch
    //    (~0s, the cookie is still valid), then fires
    //    `fetchWithTimeout(refresh-token, ..., 10000)` (up to 10s). So this
    //    path's worst case is 8s (prefetch) + 8s (validate POST) + 0s (cookie
    //    reuse) + 10s (refresh POST) = 26s — the LARGEST of the three, and the
    //    one the safety net must clear. setInitialized(true) runs in the IIFE's
    //    finally only AFTER refreshToken resolves, so `initialized` flips at
    //    worst ~26s on this path.
    //  - verifySession (the ?checkout=success&session_id= redirect): its POST is
    //    `fetchWithTimeout(..., 10000)` (10s, a touch longer to absorb the Stripe
    //    session-lookup round-trip), ALSO preceded by the same 8s CSRF prefetch
    //    when the billify_csrf cookie is absent (often so here — the user is
    //    redirected back from external Stripe and may not have visited /app
    //    within the cookie's Max-Age). So verifySession's worst case is 8s + 10s
    //    = 18s.
    // A safety net below 26s times out while the 401→refresh path is still in
    // flight on a merely SLOW-but-reachable API, returns authoritative=false,
    // and the cap/paywall gates are skipped — the exact latency-triggered bypass
    // this gate exists to close (the docblock on awaitInitialized in
    // useSubscription.ts walks through the same budget). The prior 20000ms was
    // sized against the 18s verifySession path only and omitted the 26s
    // 401→refresh path; 28000ms restores a 2s jitter margin over the true 26s
    // worst case, so the safety net fires only for a genuinely unreachable API
    // (no response within ~26s) — the accepted "block the API" trust-model
    // bypass, NOT a slow-but-reachable one.
    const authoritative = await awaitInitialized(28000);
    const gates = gatesRef.current;
    // Read the FRESH invoice from invoiceRef too — the twin of the gatesRef fix
    // above. handleDownload is a useCallback that closes over the click-time
    // `invoice` (deps [invoice, ...]); during the await the plan can settle,
    // `initialized` flips, and the free-tier clamp (a useIsomorphicLayoutEffect)
    // runs in the layout phase of that commit — BEFORE the passive-effect flush
    // that drains the awaitInitialized waiters AND updates invoiceRef.current
    // (the [invoice] effect at its declaration). The clamp calls
    // setInvoice(prev => ({ ...prev, template: fallback })), downgrading the
    // template in state to a free-tier id while the still-running handleDownload
    // closure still holds the click-time `invoice` with the Pro template. Reading
    // the closure `invoice` post-await would check the pre-clamp Pro template
    // against the FRESH free gates → `gates.hasAccess('bold'|'creative'|...)=
    // false` → a spurious 'Pro Template' paywall on the first click during
    // resolve, recoverable only by clicking again (the second click's
    // handleDownload was recreated with the post-clamp invoice). The passive
    // flush that drains the await waiters also sets invoiceRef.current to the
    // clamped invoice, and the continuation runs as a microtask AFTER that flush,
    // so invoiceRef.current is guaranteed to hold the post-clamp invoice here —
    // exactly the freshness guarantee gatesRef.current relies on. Use `inv`
    // (not the closure `invoice`) for the template-access check, generatePDF,
    // and the download filename. `invoice` is therefore no longer referenced in
    // this body, so it's dropped from the deps below (handleDownload no longer
    // recreates on every keystroke — it reads both refs at call time, the same
    // pattern the gatesRef read already uses).
    const inv = invoiceRef.current;
    // Re-derive cap-bound from the FRESH gates (post-await), not the stale
    // click-time closure. The Download button was already disabled above
    // (setDownloading(true)), so the await can't be double-clicked.
    const capBound = authoritative && gates.isFreeHost;
    // Defense in depth: the <select> paywall only fires on user onChange, so a
    // Pro template that arrived via the handoff or a crafted ?invoice= URL (and
    // survived the load-time clamp) must still be gated at download. Embed is
    // exempt — all 12 templates are free there. This is an INTENTIONAL gate
    // added by this PR: master gated only the monthly count at download (a free
    // user could download a saved Pro-template invoice). Reverting it would
    // re-open the Pro-template paywall to anyone who loads a Pro template via
    // handoff or ?invoice= — the exact bypass the gate + load-time clamp close.
    // ACCEPTED TRADEOFF (behavior change vs master): a free user who already
    // holds a Pro-template invoice — one that arrived via a ?invoice= share
    // link, or a billify_current saved while they were Pro (master's
    // validateInvoice accepted clean/bold/executive/…) — can no longer download
    // it; they now hit the Pro Template paywall instead. That capability removal
    // is the desired monetization boundary (free tier = modern + classic only;
    // see api/plan-limits.json), not a regression: a free user was never meant
    // to export Pro-tier templates, and master's omission was the bypass. The
    // load-time clamp (below) downgrades the template in the editor so the
    // <select> shows a free template; this gate is the export-side backstop for
    // any Pro template that survived the clamp. Surface in release notes.
    //
    // BEST-EFFORT, NOT tamper-proof — the SAME trust model as the monthly count
    // cap above (lines 77-92). capBound requires gates.isFreeHost, i.e.
    // plan === 'free' authoritatively; but the plan reads client-writable
    // billify_plan, and useSubscription's transient-failure catch PRESERVES the
    // optimistic restore rather than resetting to free. So a user who forges
    // localStorage.billify_plan='pro' + a junk token AND makes validate-token
    // fail transiently (block /api/stripe/*, or let the 8s/16s abort fire on a
    // hung connection) lands plan='pro' with initialized=true → isFreeHost=false
    // → capBound=false → BOTH this Pro-template gate AND the monthly cap are
    // skipped. That is the SAME self-bypass the count cap already accepts (a
    // user defeats their own gate by editing their own storage + blocking their
    // own API): the no-backend model has no server authority to close it, and
    // option (a) (treat transient failure as 'free' for gate decisions) would
    // regress genuine Pro UX during a real API outage. So this gate is a best-
    // effort nudge that closes the handoff/?invoice= Pro-template bypass for
    // the honest-and-online user, NOT a hard monetization wall — frame it that
    // way in the release notes, alongside the count cap's caveat.
    if (capBound && !gates.hasAccess(inv.template)) {
      setShowPaywall({ open: true, feature: 'Pro Template' });
      return;
    }
    // Free host: pre-check the monthly cap with the hook's authoritative
    // canCreateInvoice (which respects limits.invoicesPerMonth, NOT a hardcoded
    // 3 — a server-configured cap of, say, 5 would be bypassed by a hardcoded 3)
    // so we fail fast before spending the CPU on a PDF. `capBound` already
    // requires the plan to be authoritatively free (initialized), so a token-
    // bearing lapsed-free user can't download before validate-token resolves.
    // Embed is unlimited (capBound is false — isFreeHost requires !isEmbed).
    if (capBound && !gates.canCreate(readMonthCount())) {
      track('cap_hit', { feature: 'Unlimited Invoices' });
      setShowPaywall({ open: true, feature: 'Unlimited Invoices' });
      return;
    }
    let blob: Blob;
    try {
      blob = await generatePDF(inv);
    } catch (err) {
      // No slot was reserved yet (reserve happens AFTER generation), so a PDF
      // failure never consumes a monthly slot — no rollback is needed. This
      // closes the close-leak the old reserve-BEFORE-gen path had (reserve, then
      // on PDF failure release — a second read-write that raced with another
      // tab and could leak a consumed slot). Reserving after gen eliminates the
      // failure path entirely.
      console.error(err);
      alert(PDF_FAILED_MSG);
      return;
    }
    // Reserve + deliver the month-count slot under a cross-tab-exclusive Web
    // Lock. localStorage has no compare-and-set, and JS is single-threaded only
    // PER TAB — so two tabs that finish `await generatePDF` in the same
    // microsecond window can both run the synchronous read-check-write
    // interleaved (T1 reads 2, T2 reads 2, T1 writes 3, T2 writes 3): the count
    // advances by one but TWO PDFs deliver, under-counting the cap and letting
    // a free user exceed 3/month with just two tabs and timing (no devtools).
    // The Web Locks API serializes the reserve across tabs so the read-check-
    // write is genuinely atomic: T1 acquires, reads 2, writes 3, clicks,
    // releases; T2 then acquires, reads 3, fails canCreateInvoice, paywalls.
    // Falls back to the (single-tab-atomic, cross-tab-racy) path only if Web
    // Locks is unavailable. The lock is scoped with embedKey so host and embed
    // (which never reserves — embed is unlimited) don't share a lock.
    let reserved = false;
    // `url` is declared at the top of the outer try (R38-5) so the finally can
    // revoke it on every path; assigned here when reserveAndDeliver creates it.
    let deliveryError: unknown = null;
    // `capBound` (authoritatively-free, fresh post-await) drives the count
    // branch instead of the stale click-time `isFreeHost`. The Pro branch
    // (capBound false) tracks usage so a lapsed Pro who used N downloads while
    // Pro is correctly limited once they drop to free within the same calendar
    // month. handleDownload early-returns on isEmbed, so capBound false here
    // means Pro (authoritatively, since `authoritative` was required for
    // capBound) OR the API-unreachable optimistic-Pro path (the accepted
    // trust-model bypass above) — both track as Pro usage, which is correct.
    const reserveAndDeliver = (): 'ok' | 'paywall' | 'error' => {
      try {
        // Read the count once. capBound (authoritatively-free, fresh post-await)
        // re-checks canCreate at reserve time — not just the pre-check above — so
        // a tab that consumed the last slot during the await generatePDF is
        // caught here, synchronously, before the click (under the lock this check
        // is authoritative across tabs too). Pro (capBound false) skips the check
        // — canCreate is always true for Pro — but still tracks usage so a lapsed
        // Pro who used N downloads while Pro is correctly limited once they drop
        // to free within the same calendar month. The single read + single write
        // collapses the prior two-arm form that duplicated writeMonthCount(...+1)
        // + reserved=true.
        const cur = readMonthCount();
        if (capBound && !gates.canCreate(cur)) {
          // Another tab consumed the last slot during PDF generation. Paywall
          // (not an error — no alert). reserved stays false → no rollback.
          setShowPaywall({ open: true, feature: 'Unlimited Invoices' });
          return 'paywall';
        }
        writeMonthCount(cur + 1);
        reserved = true;
        url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${inv.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return 'ok';
      } catch (err) {
        // Roll back the reserved slot WHILE STILL HOLDING the Web Lock — this
        // catch runs inside the navigator.locks.request callback, so the
        // decrement is atomic against concurrent reserves (the whole reason the
        // reserve is under the lock). The prior design rolled back AFTER
        // navigator.locks.request resolved, i.e. after the lock was released:
        // another tab could then reserve between our read and write, and our
        // decrement would erase ITS slot — under-counting the cap (a free user
        // exceeding 3/month with just two tabs + a delivery failure, no devtools).
        // Decrement RELATIVELY (current count - 1), NOT a captured pre-reserve
        // absolute value: writing a captured pre-value would clobber a concurrent
        // tab's already-reserved unit. Under the lock, current-1 restores exactly
        // our own reserved unit. When Web Locks is unavailable (so the outer
        // try/catch falls back to running reserveAndDeliver unlocked), this runs
        // unlocked too — the already-accepted degraded path.
        if (reserved) writeMonthCount(Math.max(0, readMonthCount() - 1));
        deliveryError = err;
        return 'error';
      }
    };
    let outcome: 'ok' | 'paywall' | 'error';
    // usedFallback: once the 5s timeout fallback has run reserveAndDeliver
    // UNLOCKED (below), a LATE lock acquisition — the holding tab finally
    // releases after our timeout fired — must NOT run the callback again, or
    // the still-pending navigator.locks.request would reserve + deliver a
    // SECOND time (double-count + double-click). The guard turns a late
    // acquisition into a no-op 'ok' whose resolved value we already discarded
    // (the race settled on the timeout's rejection).
    let usedFallback = false;
    const lockCallback = (): 'ok' | 'paywall' | 'error' => {
      if (usedFallback) return 'ok';
      return reserveAndDeliver();
    };
    // A single try/catch covers all three Web Locks failure modes. If the API
    // is absent (navigator.locks.request is undefined/non-function), invoking
    // it throws a synchronous TypeError during operand evaluation (before
    // await); if it's present but rejects after acquiring (SecurityError,
    // lock manager unavailable mid-request, the document losing lock access),
    // the await rejects; if it's present but NEVER settles (a holding tab
    // frozen/suspended, a lock-manager edge case) the 5s timeout below
    // rejects. All three land in the catch, which falls back to running
    // reserveAndDeliver unlocked — so no separate API-presence guard is
    // needed here (the catch already covers the API-absent case, and this
    // only runs from a Download-button click so `navigator` is always
    // defined).
    //
    // The unlocked fallback re-opens the cross-tab race the lock exists to
    // close (two tabs finishing generatePDF in the same window can both read
    // N, both write N+1, and both deliver — exceeding 3/month by one PDF with
    // no devtools). This is an ACCEPTED, bounded tradeoff, not a regression:
    // (1) it only fires when the Web Locks API is unavailable — a rare
    // environment condition (some privacy/embedding contexts disable the
    // Locks API), not the common case; (2) it requires the conjunction of that
    // rare environment AND two tabs finishing PDF generation in the same
    // microsecond window; (3) the over-shoot is bounded to ONE extra PDF (the
    // count advances by 1 while 2 deliver — 3→4, not unbounded); and (4) the
    // cap is client-only and defeatable by design anyway (block the API / edit
    // billify_plan — see the trust-model note in useSubscription), so refusing
    // the download here would punish legit users in a Locks-disabled
    // environment for a cap that is defeatable through other accepted paths,
    // with no real security gain. Without a Web Lock (or a server) cross-tab
    // atomicity is impossible in localStorage — the options are refuse or
    // deliver-with-a-bounded-weakening; this chooses deliver. The
    // reserve-time re-check inside reserveAndDeliver still enforces the cap
    // within a single tab (the common case), so only the cross-tab edge
    // weakens.
    try {
      // navigator.locks.request has NO built-in timeout — without the race,
      // a never-settling request (the rare frozen-holding-tab case above)
      // would hang the await forever and skip the finally, leaving the
      // Download button stuck on "Generating..." with no in-app recovery
      // short of a full reload. Race it against a 5s timeout; on timeout
      // reject into the catch (the same unlocked fallback the rejection path
      // takes) so the download still proceeds and the finally always runs.
      // usedFallback (declared above) prevents a late lock acquisition from
      // double-delivering after the fallback already delivered.
      outcome = await Promise.race([
        navigator.locks.request(embedKey('month-count-lock'), { mode: 'exclusive' }, lockCallback),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('lock-timeout')), 5000)),
      ]);
    } catch {
      usedFallback = true;
      outcome = reserveAndDeliver();
    }
    if (outcome === 'error') {
      // Delivery failed (createObjectURL OOM, click threw, etc.). The slot
      // rollback already ran inside reserveAndDeliver's catch (under the Web
      // Lock, so atomic across tabs), so a FAILED DELIVERY does not consume the
      // monthly quota. Alert — master always alerted on a download-path failure.
      console.error(deliveryError);
      alert(PDF_FAILED_MSG);
    } else if (outcome === 'ok') {
      // Record the delivered invoice in history (status 'sent') so the History
      // panel auto-populates on download; the user can mark it 'paid' from there.
      recordInvoice(inv, 'sent');
    }
    } finally {
      if (url) URL.revokeObjectURL(url);
      setDownloading(false);
    }
  }, [isEmbed, awaitInitialized, recordInvoice]);

  // Embed's only way to download: open a top-level /app tab carrying the current
  // invoice via the same-origin handoff. The opened tab runs in HOST mode (no
  // embed param), so the free-tier cap and Pro paywall apply — embed stays a
  // try-only scratch surface (every Pro template free to TRY, none free to
  // DOWNLOAD) while download still has a path that goes through the
  // monetization wall. Reuses handoffUrl (shared with EmbeddedEditor's
  // "Edit in full-screen" button) so the stash/fallback/too-long logic lives in
  // one place. Called from the in-embed "Open full-screen" nav button below.
  //
  // persist=false: this is a DOWNLOAD, not a "replace my saved invoice" — the
  // scratch loads READ-ONLY (dirty=false) so the user's saved billify_current is
  // NOT overwritten. The user clicks Download PDF in the opened host tab, which
  // goes through the cap/paywall. (Contrast EmbeddedEditor's "Edit in
  // full-screen", which passes persist=true to make the scratch the current
  // invoice.) persist=false here is what closes the round-15 data-loss regression
  // where the download CTA silently clobbered a host user's saved invoice.
  const handleOpenFullScreen = useCallback(() => {
    // Read invoiceRef.current at call time (not the `invoice` closure) so the
    // callback's identity is stable across every keystroke — the embed "Open
    // full-screen" CTA always hands off the LATEST scratch, never a stale
    // capture from when this callback was last memoized. Mirrors handleDownload,
    // which reads invoiceRef.current with `[isEmbed, awaitInitialized]` deps;
    // this handler references neither isEmbed nor awaitInitialized (it only
    // calls stable module imports handoffUrl/warnIfHandoffTooLarge + window
    // APIs), so `[]` deps is correct (R31 #7: the prior `[invoice]` dep
    // recreated the callback on every keystroke for no reason — invoiceRef is
    // the live source, the closure was a stale shadow of it).
    const inv = invoiceRef.current;
    const url = handoffUrl(inv, false);
    // Check the too-large case BEFORE opening, not after. handoffUrl returns
    // '/app' (no query) only when the invoice was too large to stash (storage
    // full + long URL); warnIfHandoffTooLarge surfaces the alert and returns true
    // so we skip the now-pointless navigation to an empty editor. Calling it
    // AFTER window.open (the prior order) opened the empty '/app' tab first and
    // only warned after, defeating the guard. Shared with
    // EmbeddedEditor.openFullScreen via warnIfHandoffTooLarge so both full-screen
    // CTAs honor the handoffUrl caller contract from one place.
    if (warnIfHandoffTooLarge(url)) return;
    const win = window.open(url, '_blank');
    if (!win) {
      // Popup blocked (embed iframes can be subject to stricter popup rules).
      // Surface it instead of silently no-op'ing so the user knows why nothing
      // opened. popupBlockedMsg(true) shares the prefix with EmbeddedEditor's
      // blocked-popup alert (src/lib/embed.ts) so the two CTAs can't drift.
      alert(popupBlockedMsg(true));
      return;
    }
  }, []);

  // Clickjacking defense-in-depth: if framed by an untrusted origin/path,
  // refuse to render the host editor (which would expose billify_* storage and
  // be clickjackable). The CSP frame-ancestors header is the primary guard; this
  // catches a missing/misconfigured one. Only true on the client (set in the
  // mount effect), so SSR is unaffected. Returned BEFORE the preview JSX is
  // built so an untrusted frame does no template/table/totals work.
  if (untrustedFrame) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-20 text-center">
        <Shield className="w-10 h-10 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">This content can&#39;t be embedded</h1>
        <p className="text-muted-foreground max-w-md">
          Billify&#39;s invoice editor can&#39;t be loaded inside another site. Open it directly at{' '}
          <a className="text-primary underline" href="/app">{SITE_HOST}/app</a>.
        </p>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotals(invoice.items, invoice.taxRate);
  const sym = currencySymbol(invoice.currency);
  const currencyValid = isValidCurrencyCode(invoice.currency);

  // Preview — returned by renderPreview() as a plain element (NOT a component,
  // so React reconciles it in place on every render instead of unmounting/
  // remounting, which would reset DOM focus and lose animation state on each
  // keystroke). Called ONLY at the render site when it will actually render:
  // while previewPending is true the placeholder is shown instead and the
  // editor form stays editable, and the render-site ternary short-circuits so
  // renderPreview() is never invoked during the (sub-second, up-to-8s-abort)
  // resolve window — allocating the ~50-100-element preview tree on every
  // keystroke just to discard it would be pure waste. (The prior form assigned
  // `const preview = previewPending ? null : (JSX)` and rendered `: preview`;
  // the `null` half was never read — the ternary already routed to the
  // placeholder — so it was a dead branch dressed up as a lazy-allocation
  // sentinel. Routing through a call instead makes the lazy allocation real and
  // the dead branch disappears.) calculateTotals/sym above stay eager — totals
  // is a cheap O(items) reduce and `sym` is also used by the editor form (the
  // Rate input placeholder), so gating them would either duplicate or force
  // non-null assertions for no meaningful gain; the JSX tree is the material
  // cost.
  const renderPreview = () => (
    <div className="bg-white text-black p-8 min-h-[600px] shadow-lg rounded-lg">
      {invoice.template === 'modern' && (
        <div className="border-b-4 border-blue-500 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-blue-600">INVOICE</h2>
              <p className="text-sm text-gray-500">#{invoice.number}</p>
            </div>
            {invoice.from.logo && <img src={invoice.from.logo} alt="logo" className="h-12 object-contain" />}
          </div>
        </div>
      )}
      {invoice.template === 'classic' && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">INVOICE</h2>
          <p className="text-sm text-gray-500">#{invoice.number}</p>
        </div>
      )}
      {invoice.template === 'minimal' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Invoice</h2>
          <p className="text-sm text-gray-500">#{invoice.number} • {invoice.date}</p>
        </div>
      )}
      {invoice.template === 'clean' && (
        <div className="mb-6 border-b-2 border-slate-200 pb-4">
          <h2 className="text-3xl font-light text-slate-700">Invoice</h2>
          <p className="text-sm text-slate-400 mt-1">#{invoice.number} — {invoice.date} — Due {invoice.dueDate}</p>
        </div>
      )}
      {invoice.template === 'bold' && (
        <div className="mb-6 bg-slate-900 text-white -mx-8 -mt-8 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-bold">INVOICE</h2>
              <p className="text-sm text-slate-300 mt-2">#{invoice.number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">{invoice.date}</p>
              <p className="text-sm text-slate-400">Due {invoice.dueDate}</p>
            </div>
          </div>
        </div>
      )}
      {invoice.template === 'executive' && (
        <div className="mb-6">
          <div className="h-1 bg-amber-700 mb-4 -mx-8 -mt-8 w-[calc(100%+4rem)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-700 tracking-wide">TAX INVOICE</h2>
              <p className="text-sm text-slate-500 mt-1">Invoice #: {invoice.number}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{invoice.date}</p>
              <p>Due Date: {invoice.dueDate}</p>
            </div>
          </div>
          <div className="h-px bg-amber-700 mt-4"></div>
        </div>
      )}
      {invoice.template === 'corporate' && (
        <div className="mb-6">
          <div className="h-1 bg-blue-800 mb-4 -mx-8 -mt-8 w-[calc(100%+4rem)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-sm text-slate-500 mt-1">No: {invoice.number} • {invoice.date} • Due {invoice.dueDate}</p>
            </div>
            <div className="text-right text-sm text-blue-800 font-semibold">
              {invoice.from.name || 'Your Company'}
            </div>
          </div>
          <div className="h-px bg-blue-800 mt-4"></div>
        </div>
      )}
      {invoice.template === 'startup' && (
        <div className="mb-6 flex gap-0 -mx-8 -mt-8">
          <div className="w-32 bg-purple-600 text-white p-6 flex flex-col items-center justify-center min-h-[140px]">
            <p className="text-xs font-semibold mb-2">{invoice.from.name || 'Your Brand'}</p>
            <p className="text-2xl font-bold">INVOICE</p>
            <p className="text-xs">#{invoice.number}</p>
          </div>
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold">Invoice</h2>
            <p className="text-sm text-slate-500">Date: {invoice.date} • Due: {invoice.dueDate}</p>
          </div>
        </div>
      )}
      {invoice.template === 'freelancer' && (
        <div className="mb-6 border-l-4 border-pink-500 pl-4">
          <h2 className="text-3xl font-light">Invoice</h2>
          <p className="text-sm text-slate-500 mt-1">#{invoice.number} • {invoice.date} • Due {invoice.dueDate}</p>
        </div>
      )}
      {invoice.template === 'agency' && (
        <div className="mb-6 -mx-8 -mt-8 bg-slate-900 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg">{invoice.from.name || 'Your Agency'}</p>
              <p className="text-xs text-slate-400 mt-1">{invoice.from.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">INVOICE</p>
              <p className="text-xs text-slate-400">#{invoice.number}</p>
            </div>
          </div>
          <div className="h-1 bg-yellow-400 mt-4 -mx-6"></div>
        </div>
      )}
      {invoice.template === 'consulting' && (
        <div className="mb-6 font-mono">
          <h2 className="text-base font-bold tracking-wider">INVOICE</h2>
          <p className="text-xs text-slate-600 mt-1">No: {invoice.number} • Date: {invoice.date} • Due: {invoice.dueDate}</p>
          <div className="h-0.5 bg-slate-900 mt-3"></div>
        </div>
      )}
      {invoice.template === 'creative' && (
        <div className="mb-6 flex items-start gap-6">
          <div className="text-6xl font-bold text-amber-500 leading-none">#{invoice.number}</div>
          <div className="text-right text-xs text-slate-600 flex-1">
            <p className="text-sm font-bold text-slate-900">INVOICE</p>
            <p>{invoice.date}</p>
            <p>Due: {invoice.dueDate}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">From</p>
          <p className="font-semibold">{invoice.from.name || 'Your Company'}</p>
          <p className="text-sm text-gray-600">{invoice.from.email}</p>
          <p className="text-sm text-gray-600">{invoice.from.address}</p>
          <p className="text-sm text-gray-600">{invoice.from.phone}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Bill To</p>
          <p className="font-semibold">{invoice.to.name || 'Client Name'}</p>
          <p className="text-sm text-gray-600">{invoice.to.email}</p>
          <p className="text-sm text-gray-600">{invoice.to.address}</p>
          <p className="text-sm text-gray-600">{invoice.to.phone}</p>
        </div>
      </div>

      {invoice.template !== 'minimal' && (
        <div className="flex gap-8 mb-6 text-sm">
          <div><span className="text-gray-500">Date: </span>{invoice.date}</div>
          <div><span className="text-gray-500">Due: </span>{invoice.dueDate}</div>
        </div>
      )}

      <table className="w-full mb-6">
        <thead>
          <tr className={`text-left text-xs uppercase ${
            invoice.template === 'modern' ? 'bg-blue-500 text-white' :
            invoice.template === 'classic' ? 'bg-gray-100' :
            invoice.template === 'clean' ? 'border-b-2 border-slate-300 text-slate-600' :
            invoice.template === 'bold' ? 'bg-slate-900 text-white' :
            invoice.template === 'executive' ? 'bg-slate-700 text-white' :
            invoice.template === 'corporate' ? 'bg-blue-800 text-white' :
            invoice.template === 'startup' ? 'bg-purple-600 text-white' :
            invoice.template === 'freelancer' ? 'text-pink-500 border-b border-pink-500' :
            invoice.template === 'agency' ? 'bg-slate-900 text-white' :
            invoice.template === 'consulting' ? 'bg-slate-900 text-white font-mono' :
            invoice.template === 'creative' ? 'border-b-2 border-amber-500 text-amber-500' :
            'border-b-2 border-black'
          }`}>
            <th className="p-2">Description</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Rate</th>
            <th className="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{item.description || '—'}</td>
              <td className="p-2 text-right">{item.quantity}</td>
              <td className="p-2 text-right">{formatCurrency(item.rate, invoice.currency)}</td>
              <td className="p-2 text-right">{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(subtotal, invoice.currency)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(tax, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div className="mt-8 text-sm text-gray-600">
          {invoice.notes && <div className="mb-2"><span className="font-semibold">Notes: </span>{invoice.notes}</div>}
          {invoice.terms && <div><span className="font-semibold">Terms: </span>{invoice.terms}</div>}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-bold text-lg hidden sm:inline">Billify</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={() => {
              const fresh = createEmptyInvoice();
              fresh.number = consumeNextNumber();
              applyInvoiceToEditor(fresh, true);
            }}>
              <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline ml-1">New</span>
            </Button>
            {/* Sticky features — hidden in embed mode (embed is try-only, no persistence) */}
            {!isEmbed && (
              <>
                <InvoiceHistory
                  history={history}
                  ready={ready}
                  snapshots={snapshots}
                  onUpdateStatus={updateStatus}
                  onRemoveRecord={removeRecord}
                  onClearHistory={clearHistory}
                  onMarkOverdue={markOverdue}
                  onLoadInvoice={(id) => {
                    // Funnel the snapshot through the shared validateInvoice
                    // ingestion boundary (same as the other 4 load paths) and
                    // load it NON-destructively: commit=false leaves dirtyRef
                    // false, so the debounced save early-returns and
                    // billify_current + the current invoice's logo side-keys
                    // stay untouched until the user edits the loaded invoice.
                    const raw = snapshots[id];
                    if (!raw) return;
                    const v = validateInvoice(raw);
                    if (v) applyInvoiceToEditor(v, false);
                  }}
                />
                <ClientDirectory
                  invoice={invoice}
                  isPro={plan !== 'free'}
                  onSelectClient={(client: Client) => {
                    setInvoice((prev) => ({
                      ...prev,
                      to: {
                        ...prev.to,
                        name: client.name,
                        email: client.email,
                        phone: client.phone,
                        address: client.address,
                        taxId: client.taxId,
                      },
                      currency: client.defaultCurrency || prev.currency,
                    }));
                    dirtyRef.current = true;
                  }}
                />
                <BackupRestore />
              </>
            )}
            {/* Download path is host-only. In embed the free-tier cap and Pro
                paywall can't be enforced (embed short-circuits to plan='pro' with
                all templates free), so a live Download button here would make the
                profession-page editor a fully-functional unlimited free Pro
                downloader. Embed is a try-only scratch surface: every Pro
                template is free to TRY, none free to DOWNLOAD — download is
                driven through "Open full-screen", which opens a top-level /app
                tab (HOST mode) where the cap/paywall apply. */}
            {isEmbed ? (
              <Button size="sm" variant="outline" className="px-2 sm:px-3" onClick={handleOpenFullScreen}>
                <Maximize2 className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Open full-screen</span>
                <span className="sm:hidden">Full-screen</span>
              </Button>
            ) : (
              // Enabled as soon as it's clickable — master's behavior. The cap
              // is NOT enforced by pre-disabling the button: handleDownload
              // awaits awaitInitialized (the authoritative-plan gate) and reads
              // FRESH gates before any cap-exempt delivery, so a click during
              // the resolve window simply pauses in that await until the plan
              // settles, then is cap-checked against the resolved plan. Disabling
              // the button pre-click (the prior `resolvingPlan && plan !== 'pro'`
              // term) was redundant for cap enforcement and needlessly held
              // token-bearing FREE users on "Checking access..." for the whole
              // validate-token round-trip (up to the 8s abort on a hung API) — a
              // regression of master's instant download for that subset, with no
              // cap benefit (the await already gates). The label still reflects
              // the resolve state so the user knows why a click pauses.
              //
              // ONE pre-click gate remains: isPrefill. A passive ?invoice= share
              // link loaded an untrusted invoice (anyone can craft one and lure a
              // user here). The banner above warns the user to review the
              // From/payee details, but warning alone is weak — without gating the
              // export, a user could click Download immediately and produce a PDF
              // that looks like a genuine Billify invoice but pays the attacker.
              // Disabling Download until the user explicitly adopts the prefill
              // ("Make this my invoice", which clears isPrefill) forces a
              // deliberate adoption click PAST the yellow warning before any PDF
              // can be generated. This is friction + a warning, NOT a
              // cryptographic review verification: a user who deliberately ignores
              // the warning and clicks adopt can still export the attacker's
              // payee details. No client-side gate can prevent that (the user
              // controls their own browser); what this DOES is raise the bar for a
              // phishing lure — the attacker must now convince the victim to
              // dismiss an explicit "this came from a shared link" warning and
              // click adopt, rather than just landing on a download button. That
              // is the proportionate client-side defense for a passive share-link
              // threat; a stronger guarantee would need a server-side review
              // step this no-backend model doesn't have.
              <>
              <Button size="sm" className="px-2 sm:px-3" onClick={handleDownload} disabled={downloading || isPrefill}>
                <Download className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{downloading ? 'Generating...' : isPrefill ? 'Review first' : (!initialized && plan !== 'pro') ? 'Checking access...' : 'Download PDF'}</span>
              </Button>
              <Button size="sm" variant="outline" className="px-2 sm:px-3" disabled={isPrefill} title="Download as CSV (Excel / Google Sheets)" onClick={() => {
                try {
                  const blob = new Blob([generateCSV(invoice)], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Invoice-${invoice.number || 'export'}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error(err);
                  alert(PDF_FAILED_MSG);
                }
              }}>
                <span className="hidden sm:inline">CSV</span>
              </Button>
              </>
            )}
            {/* Hide the plan badge / pricing link in embed mode — the embed has
                no signup flow, so there's nothing to upgrade to. */}
            {!isEmbed && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pricing">
                  <span className={`text-xs font-semibold ${plan !== 'free' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {plan === 'free' ? 'Free' : 'Pro'}
                  </span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Editor */}
        <div className="flex-1 p-3 sm:p-4 space-y-4 overflow-y-auto lg:max-h-[calc(100vh-3.5rem)]">
          {error && !checkoutErrorDismissed && (
            // R38-1: post-checkout verification failed. Mirrors CheckoutCanceledBanner
            // (the /pricing cancel-side banner) so the success + cancel redirect
            // notices share styling. A paid user whose verifySession failed sees
            // this instead of a silent free-tier app. Reload retries (verifySession
            // re-runs, resetting error to null on a successful retry so the banner
            // clears); the Pricing link offers re-subscribing if access can't be
            // recovered. See the checkoutErrorDismissed state comment above.
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border border-muted bg-muted/40 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="flex-1">
                {error} We couldn&apos;t confirm your subscription after checkout. Reload to retry, or re-subscribe from{' '}
                <Link href="/pricing" className="underline hover:text-foreground">Pricing</Link>.
              </p>
              <button
                type="button"
                onClick={() => setCheckoutErrorDismissed(true)}
                aria-label="Dismiss"
                className="shrink-0 rounded p-0.5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Prefill provenance banner. A passive ?invoice= share link loaded an
              untrusted invoice (anyone can craft /app?invoice=<…> and lure a user
              here). It is NOT auto-saved over the user's billify_current (isPrefill
              gates the debounced save), so edits here live only in memory until the
              user explicitly adopts it — preventing a silent saved-invoice clobber.
              It is also NOT exportable until adoption: the Download button is
              disabled while isPrefill is true (see its comment), so a lured user
              can't immediately generate a PDF that looks like a genuine Billify
              invoice but pays the attacker — they must first dismiss this warning
              and click adopt. That is friction + a warning, not a closure: a
              user who deliberately ignores the warning can still export the
              attacker's payee details (no client-side gate can stop a user who
              controls their own browser). It raises the bar for a phishing lure
              vs the prior warn-only approach, which left the export button live.
              Adopt ("Make this my invoice") clears isPrefill, re-enables the save,
              and marks the invoice dirty so the next debounce persists it. */}
          {isPrefill && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30 text-sm">
              <Shield className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="flex-1 text-yellow-900 dark:text-yellow-100">
                This invoice came from a shared link. It won&apos;t replace your saved invoice unless you choose to. Review the <strong>From</strong> details before sending.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setIsPrefill(false); dirtyRef.current = true; }}
              >
                Make this my invoice
              </Button>
            </div>
          )}
          {/* Hide subscription management in embed mode — no signup flow. */}
          {!isEmbed && (
            <SubscriptionManager
              plan={plan}
              initialized={initialized}
              limits={limits}
              clear={clear}
            />
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Number</Label>
                <Input data-testid="invoice-number" value={invoice.number} onChange={e => update({ number: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                  <Input
                    list="billify-currencies"
                    value={invoice.currency}
                    onChange={e => update({ currency: e.target.value.toUpperCase() })}
                    onBlur={() => { if (!isValidCurrencyCode(invoice.currency)) update({ currency: 'USD' }); }}
                    aria-invalid={!currencyValid}
                    className={currencyValid ? '' : 'border-red-500 focus-visible:border-red-500'}
                    autoComplete="off"
                  />
                  {CURRENCY_DATALIST}
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={invoice.date} onChange={e => update({ date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={invoice.dueDate} onChange={e => update({ dueDate: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* Advanced fields — collapsed by default for first-time users */}
          {(invoice.purchaseOrder || invoice.leitwegId) && !showAdvanced ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ChevronDown className="w-3 h-3" /> Show advanced fields (PO, Leitweg-ID)
            </button>
          ) : null}
          {showAdvanced || invoice.purchaseOrder || invoice.leitwegId ? (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Advanced</CardTitle>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(false)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ChevronUp className="w-3 h-3" /> Hide
                </button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Purchase Order #</Label>
                  <Input placeholder="PO number (optional)" value={invoice.purchaseOrder ?? ''} onChange={e => update({ purchaseOrder: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Leitweg-ID (DE e-invoice routing)</Label>
                  <Input placeholder="Leitweg-ID (optional)" value={invoice.leitwegId ?? ''} onChange={e => update({ leitwegId: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">From (Your Company)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Company name" value={invoice.from.name} onChange={e => updateFrom({ name: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Email" value={invoice.from.email} onChange={e => updateFrom({ email: e.target.value })} />
                <Input placeholder="Phone" value={invoice.from.phone} onChange={e => updateFrom({ phone: e.target.value })} />
              </div>
              <Input placeholder="Address" value={invoice.from.address} onChange={e => updateFrom({ address: e.target.value })} />
              <Input placeholder="Address line 2 (optional)" value={invoice.from.addressLine2 ?? ''} onChange={e => updateFrom({ addressLine2: e.target.value })} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input placeholder="City" value={invoice.from.city ?? ''} onChange={e => updateFrom({ city: e.target.value })} />
                <Input placeholder="Region / State" value={invoice.from.region ?? ''} onChange={e => updateFrom({ region: e.target.value })} />
                <Input placeholder="Postal code" value={invoice.from.postalCode ?? ''} onChange={e => updateFrom({ postalCode: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Country (ISO code, e.g. DE)" maxLength={2} value={invoice.from.country ?? ''} onChange={e => updateFrom({ country: e.target.value.toUpperCase() })} />
                <Input placeholder="Tax ID / VAT number" value={invoice.from.taxId ?? ''} onChange={e => updateFrom({ taxId: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Logo</Label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors w-fit">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => handleLogoUpload(e, 'from')}
                  />
                  <span>{invoice.from.logo ? 'Change Logo' : 'Upload Logo'}</span>
                </label>
              {logoError && (
                <p className="text-xs text-destructive mt-1">{logoError}</p>
              )}
              {invoice.from.logo && (
                <div className="mt-2 w-16 h-16 rounded-md border overflow-hidden">
                  <img src={invoice.from.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">To (Client)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ClientAutocomplete
                value={invoice.to.name}
                clients={clients}
                onChange={(val) => updateTo({ name: val })}
                onSelect={(client) => {
                  setInvoice((prev) => ({
                    ...prev,
                    to: {
                      ...prev.to,
                      name: client.name,
                      email: client.email,
                      phone: client.phone,
                      address: client.address,
                      taxId: client.taxId,
                    },
                  }));
                }}
                placeholder="Client name (type to search saved clients)"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Email" value={invoice.to.email} onChange={e => updateTo({ email: e.target.value })} />
                <Input placeholder="Phone" value={invoice.to.phone} onChange={e => updateTo({ phone: e.target.value })} />
              </div>
              <Input placeholder="Address" value={invoice.to.address} onChange={e => updateTo({ address: e.target.value })} />
              <Input placeholder="Address line 2 (optional)" value={invoice.to.addressLine2 ?? ''} onChange={e => updateTo({ addressLine2: e.target.value })} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input placeholder="City" value={invoice.to.city ?? ''} onChange={e => updateTo({ city: e.target.value })} />
                <Input placeholder="Region / State" value={invoice.to.region ?? ''} onChange={e => updateTo({ region: e.target.value })} />
                <Input placeholder="Postal code" value={invoice.to.postalCode ?? ''} onChange={e => updateTo({ postalCode: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Country (ISO code, e.g. FR)" maxLength={2} value={invoice.to.country ?? ''} onChange={e => updateTo({ country: e.target.value.toUpperCase() })} />
                <Input placeholder="Tax ID / VAT number" value={invoice.to.taxId ?? ''} onChange={e => updateTo({ taxId: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Line Items</CardTitle>
              <p className="text-xs text-muted-foreground">Per-line tax category is saved for e-invoicing (UBL/EN 16931) and will affect totals in a future update.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateItem(idx, { description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 sm:col-span-6 gap-2">
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-3">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder={`Rate (${sym})`}
                          value={item.rate}
                          onChange={e => updateItem(idx, { rate: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="w-full h-10" onClick={() => removeItem(idx)} disabled={invoice.items.length <= 1}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label={`Tax category for line ${idx + 1}`}
                      value={item.taxCategory ?? ''}
                      onChange={e => updateItem(idx, { taxCategory: (e.target.value as TaxCategory) || undefined })}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
                    >
                      <option value="">Tax: invoice default</option>
                      {TAX_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{TAX_CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                    <select
                      aria-label={`Unit for line ${idx + 1}`}
                      value={item.unitCode ?? ''}
                      onChange={e => updateItem(idx, { unitCode: e.target.value || undefined })}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
                    >
                      <option value="">Unit: piece</option>
                      {UNIT_CODES.map((u) => (
                        <option key={u.code} value={u.code}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Extras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tax Rate (%)</Label>
                  <Input type="number" min={0} max={100} value={invoice.taxRate} onChange={e => update({ taxRate: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Template</Label>
                  <select
                    data-testid="template-select"
                    value={invoice.template}
                    onChange={e => {
                      const selected = e.target.value as TemplateType;
                      const t = getTemplate(selected);
                      const required = t?.tier ?? 'free';
                      // Embed mode unlocks all 12 templates — the marketing point:
                      // every Pro template is free to use in the SEO page editor.
                      // Gate on a resolved plan too so a logged-in Pro user isn't
                      // falsely paywalled during the validate-token window.
                      if (isFreeHost && required !== 'free') {
                        setShowPaywall({ open: true, feature: t?.name ?? 'Pro Template' });
                        return;
                      }
                      update({ template: selected });
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {isFreeHost && t.tier !== 'free' ? ' 🔒 Pro' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input placeholder="Notes" value={invoice.notes} onChange={e => update({ notes: e.target.value })} />
              <Input placeholder="Terms" value={invoice.terms} onChange={e => update({ terms: e.target.value })} />
            </CardContent>
          </Card>

          {/* Payment Details — collapsible (most users don't need this) */}
          {invoice.paymentMeans?.code ? (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Payment Details</CardTitle>
                <button
                  type="button"
                  onClick={() => update({ paymentMeans: undefined })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Method</Label>
                  <select
                    value={invoice.paymentMeans?.code ?? ''}
                  onChange={e => {
                    const code = e.target.value;
                    if (!code) {
                      setInvoice(prev => ({ ...prev, paymentMeans: undefined, updatedAt: Date.now() }));
                      dirtyRef.current = true;
                    } else {
                      updatePayment({ code });
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— None —</option>
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Account name</Label>
                <Input value={invoice.paymentMeans?.accountName ?? ''} onChange={e => updatePayment({ accountName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">IBAN</Label>
                <Input placeholder="e.g. DE89 3704 0044 0532 0130 00" value={invoice.paymentMeans?.iban ?? ''} onChange={e => updatePayment({ iban: e.target.value.toUpperCase().replace(/\s/g, '') })} />
              </div>
              <div>
                <Label className="text-xs">BIC / SWIFT</Label>
                <Input value={invoice.paymentMeans?.bic ?? ''} onChange={e => updatePayment({ bic: e.target.value.toUpperCase() })} />
              </div>
            </CardContent>
          </Card>
          ) : (
            <button
              type="button"
              onClick={() => update({ paymentMeans: { code: 'credit-transfer' } })}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-3 h-3" /> Add payment details (IBAN, BIC)
            </button>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 p-3 sm:p-4 bg-gray-100 dark:bg-zinc-900 overflow-y-auto lg:max-h-[calc(100vh-3.5rem)]">
          <div className="sticky top-0">
            <Badge variant="outline" className="mb-2">Live Preview</Badge>
            {/* Don't render the template-specific preview while a Pro template is
                loaded AND a clamp could still fire: during the plan-resolve window
                for a token-bearing host user, and for the one frame between
                `initialized` flipping and the clamp effect downgrading a free user's
                loaded Pro template (via handoff or a crafted ?invoice=). Free-tier
                templates are never clamped, so a saved free-tier-template preview
                shows immediately even while the plan resolves — the gate is scoped
                to the only case at clamp risk (isProTemplate), not every host user.
                The form stays editable; only the rendered preview waits.
                No-token/embed users flip initialized synchronously, so the
                `!initialized` term is zero-length for them; the clamp term still
                guards a no-token free user's crafted Pro template for the one frame
                until the clamp runs. */}
            {previewPending ? (
              <div className="bg-white text-black p-8 min-h-[600px] shadow-lg rounded-lg flex items-center justify-center text-gray-400">
                Preparing your workspace…
              </div>
            ) : renderPreview()}
          </div>
        </div>
      </div>

      <PaywallModal
        open={!isEmbed && (showPaywall?.open ?? false)}
        onClose={() => setShowPaywall(null)}
        feature={showPaywall?.feature ?? ''}
      />
    </div>
  );
}
