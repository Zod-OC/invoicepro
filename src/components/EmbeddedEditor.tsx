'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Profession } from '@/data/professions';
import { Invoice, createEmptyInvoice, validateInvoice } from '@/types';
import { encodeInvoice, handoffUrl, warnIfHandoffTooLarge, popupBlockedMsg, onTrustedMessage, EMBED_PARAM, INVOICE_PARAM, MSG_SYNC_REQUEST, MSG_INVOICE_FRESH } from '@/lib/embed';
import { track } from '@/lib/analytics';

/**
 * The real Billify editor, embedded on a profession landing page via an
 * same-origin iframe to /app?embed=true&invoice=<base64url>. In embed mode the
 * editor is a throwaway scratch pad (no auto-save, namespaced storage, no
 * paywall) — see src/lib/embed.ts.
 *
 * Handoff: "Edit in full-screen" carries the user's scratch edits (from/to,
 * logo, notes, terms, dates, template) into the persistent /app. Rather than
 * mirroring the live invoice up on every keystroke (which lagged the handoff by
 * the up-channel debounce and re-rendered this parent on every edit), the
 * parent asks the iframe for its current invoice on demand at click time via a
 * same-origin postMessage round-trip. The iframe responds immediately with the
 * exact current state, so there is no debounce race and no per-keystroke
 * re-render of the parent.
 *
 * Hydration: the prefill invoice (and therefore the iframe src) is built in a
 * mount effect, not at render time. createEmptyInvoice() is non-deterministic
 * (crypto.randomUUID vs Date.now+Math.random, build-time vs runtime dates), so
 * computing the encoded src during render would emit a prerendered <iframe src>
 * that differs from the hydrated value → a React hydration mismatch + src swap.
 * SSR and the first client render both emit the placeholder; the effect
 * (client-only) then sets the real src, so the iframe loads exactly once.
 */
export function EmbeddedEditor({ profession }: { profession: Profession }) {
  // null = prefill not yet computed (also gates the button); string = iframe src.
  // A separate `ready` flag would be a redundant derivation of `iframeSrc !== null`.
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  // Guards the full-screen button against a rapid second click while a
  // postMessage round-trip + stash are in flight (which would open two tabs).
  const [busy, setBusy] = useState(false);
  // Analytics: fire once per profession-page view to measure which pSEO pages
  // get traffic. (The host /app editor fires editor_open separately.)
  useEffect(() => {
    track('pseo_view', { profession: profession.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The prefill invoice, held in a ref so postMessage round-trips never
  // re-render this parent. Only consumed by the full-screen handoff (a click
  // handler), never rendered into SSR HTML, so its non-deterministic init is
  // hydration-safe.
  const liveRef = useRef<Invoice | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Mounted gate + in-flight teardown for requestFreshInvoice (R34 #4). The
  // sync round-trip registers a window message listener, a 250ms interval, and
  // a 2s timer inside a Promise — none of which a useCallback/Promise tears down
  // on unmount. Without this, navigating away mid-round-trip leaks the listener/
  // interval/timer on window for up to 2s, and the pending openFullScreen()
  // continuation then runs after unmount (navigating the blank tab, or surfacing
  // the timeout alert on a page the user already left). mountedRef gates the
  // continuation to a no-op; the cleanup effect tears the round-trip down
  // immediately by invoking the pending finish (resolving the promise with null
  // so it doesn't hang, and clearing the listener/interval/timer).
  const mountedRef = useRef(true);
  const pendingFinishRef = useRef<((value: Invoice | null) => void) | null>(null);

  useEffect(() => {
    const prefilled: Invoice = {
      ...createEmptyInvoice(),
      items: profession.defaultLineItems,
      taxRate: profession.defaultTaxRate,
      currency: profession.defaultCurrency,
    };
    liveRef.current = prefilled;
    // createEmptyInvoice() is non-deterministic (crypto.randomUUID /
    // Date.now / Math.random), so computing the iframe src during render would
    // emit a prerendered <iframe src> that differs from the hydrated value (a
    // hydration mismatch + src swap). The src must be set in this mount effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIframeSrc(`/app?${EMBED_PARAM}=true&${INVOICE_PARAM}=${encodeInvoice(prefilled)}`);
  }, [profession]);

  // Unmount teardown for an in-flight requestFreshInvoice round-trip (R34 #4).
  // Set the mounted gate false, then invoke the pending finish(null) to clear the
  // window message listener, the 250ms interval, and the 2s timer immediately
  // (rather than leaving them live on window for up to 2s after navigation) and
  // resolve the promise so the openFullScreen continuation resumes — the
  // mountedRef gate below makes that continuation a silent no-op (close the blank
  // tab, no alert/navigate/setBusy on the unmounted component).
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pendingFinishRef.current?.(null);
      pendingFinishRef.current = null;
    };
  }, []);

  // On-demand sync: ask the iframe for its current invoice (the iframe responds
  // immediately, bypassing any debounce). Resolves with the fresh invoice, or
  // falls back to the prefill in liveRef if the iframe hasn't loaded / doesn't
  // respond within the timeout.
  const requestFreshInvoice = useCallback(async (): Promise<Invoice | null> => {
    const iframe = iframeRef.current?.contentWindow;
    const fallback = liveRef.current;
    if (!iframe) return fallback;
    return new Promise((resolve) => {
      let settled = false;
      const onFresh = onTrustedMessage<{ type?: string; invoice?: unknown }>(
        MSG_INVOICE_FRESH,
        (_e, payload) => finish(validateInvoice(payload.invoice)),
      );
      // Re-send the sync request on a short interval until a reply lands or the
      // 2s deadline elapses. A single postMessage is best-effort: if the iframe's
      // /app is still mounting and its MSG_SYNC_REQUEST listener isn't wired yet,
      // the posted message is DROPPED (there is no queue — a message to a window
      // with no matching listener is simply gone), so the parent would wait the
      // full 2s for a reply that can never arrive, then fall back to the prefill
      // and silently drop the user's scratch edits. Re-posting every 250ms gives
      // a slow-to-mount iframe a fresh chance to catch a request once its
      // listener is live — the first reply wins, and `finish`'s `settled` guard
      // makes every later reply a no-op, so multiple responses are safe. 250ms is
      // well under the 2s deadline (≤ ~7 attempts) and cheap (a postMessage to a
      // same-origin iframe), and it does nothing for the healthy iframe case
      // (it replies in single-digit ms, settling before the first re-post).
      const interval = window.setInterval(() => {
        iframe.postMessage({ type: MSG_SYNC_REQUEST }, window.location.origin);
      }, 250);
      // 2000ms (was 400). The iframe's MSG_SYNC_REQUEST listener (app/page.tsx)
      // responds synchronously from its own event loop, so a healthy iframe
      // replies in single-digit ms. The deadline exists for the case where the
      // iframe CAN'T reply in time: its main thread is blocked (a long preview
      // render, a large logo re-encode) or /app is still mounting and the
      // listener isn't wired yet (the interval above handles the latter; this
      // deadline handles the former). 400ms was too tight for the busy-main-
      // thread case — a real preview render or logo encode can block dispatch
      // past it. `fallback` is `liveRef.current`, which holds ONLY the original
      // profession prefill (never updated from the iframe's edits, by design, to
      // avoid per-keystroke parent re-renders) — so resolving with it would
      // silently carry the prefill instead of the user's typed work, landing the
      // full-screen tab on the original template with no indication the edits
      // were dropped. 2000ms covers a busy-but-alive iframe; only a genuinely
      // dead/unloaded/saturated iframe falls through. On timeout we REFUSE the
      // handoff (resolve null) and surface a user-visible alert (in
      // openFullScreen's !invoice branch, mirroring warnIfHandoffTooLarge) so the
      // user knows to try again, rather than silently losing their scratch — the
      // console.warn alone was not observable to the user.
      const timer = setTimeout(() => {
        console.warn('EmbeddedEditor: iframe did not respond to sync-request within 2s — refusing full-screen handoff so the user\'s scratch edits are not silently replaced by the prefill.');
        finish(null);
      }, 2000);
      const finish = (value: Invoice | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearInterval(interval);
        window.removeEventListener('message', onFresh);
        // Drop the ref so a later unmount cleanup doesn't re-invoke a finished
        // finish (the settled guard would no-op it anyway, but this is clearer).
        pendingFinishRef.current = null;
        resolve(value);
      };
      window.addEventListener('message', onFresh);
      // Track the active finish so the unmount cleanup (R34 #4) can tear down
      // the listener/interval/timer immediately instead of leaking them on
      // window for up to 2s after navigation.
      pendingFinishRef.current = finish;
      iframe.postMessage({ type: MSG_SYNC_REQUEST }, window.location.origin);
    });
  }, []);

  const openFullScreen = async () => {
    // Open a blank tab synchronously, within the click's user-gesture stack.
    // Awaiting requestFreshInvoice first breaks that gesture chain, and
    // Safari/Firefox-strict block the subsequent window.open as a popup. We
    // navigate the already-opened tab once the invoice is ready.
    const win = window.open('', '_blank');
    if (!win) {
      // Popup blocked (no gesture survived, or a popup blocker fired). The
      // browser's tiny address-bar blocked-popup icon is easy to miss — and
      // embed iframes are the context most likely to hit stricter popup rules
      // (the sibling host CTA in app/page.tsx handles the same case with an
      // explicit alert, and notes exactly this). Surface it in-app instead of
      // silently re-enabling the button (handleFullScreen's .finally does that
      // regardless) so the user knows why nothing opened. Mirrors
      // app/page.tsx's handleOpenFullScreen blocked-popup alert (shared
      // popupBlockedMsg in src/lib/embed.ts so the two CTAs can't drift).
      alert(popupBlockedMsg());
      return;
    }

    // Ask the iframe for its current invoice so the handoff carries the user's
    // latest keystrokes (no debounce race).
    const invoice = await requestFreshInvoice();
    // Unmount gate (R34 #4): if the EmbeddedEditor unmounted during the
    // requestFreshInvoice await (the user navigated away from the profession
    // page), the cleanup effect already tore down the listener/interval/timer
    // and resolved the promise with null. Close the blank tab we opened and
    // bail SILENTLY — no alert (the user is on a different page), no navigate,
    // no setBusy on the unmounted component. (Distinguished from the
    // still-mounted timeout case below, which DOES surface the alert.)
    if (!mountedRef.current) {
      win.close();
      return;
    }
    if (!invoice) {
      // requestFreshInvoice resolves null only on its 2s timeout (the iframe's
      // main thread was too saturated to reply) — see requestFreshInvoice. The
      // only safe fallback would be the stale prefill, which would silently drop
      // the user's scratch edits; refuse instead and close the blank tab we
      // opened, surfacing an in-app alert (mirroring warnIfHandoffTooLarge) so
      // the user knows to try again rather than landing on the original template
      // with no signal their work was dropped.
      win.close();
      alert('Your edits could not be carried over right now — the editor is busy. Please try again.');
      return;
    }

    // The ~400ms requestFreshInvoice await above is an async gap during which the
    // user (or a popup blocker racing the gesture) may have closed the blank
    // tab we opened. Navigating a closed window throws (Chrome: "Cannot read
    // properties of null" / Firefox: a SecurityError on win.location), surfacing
    // an unhandled rejection from this async handler. Bail before navigating.
    if (win.closed) return;

    // handoffUrl stashes the full invoice (which may include a large uploaded
    // logo) in same-origin localStorage and carries only a short token in the
    // URL, falling back to a logo-stripped ?invoice= + persist-flag, then to
    // '/app' if even that is too long. Shared with the in-embed download CTA in
    // app/page.tsx so the stash/fallback/too-long logic lives in one place. The
    // opened /app tab is top-level (no embed param) → HOST mode → the free-tier
    // cap and Pro paywall apply, so download goes through the monetization wall.
    const url = handoffUrl(invoice);
    // Check the too-large case BEFORE navigating the blank tab. handoffUrl
    // returns '/app' (no query) only when the invoice was too large to stash
    // (storage full + long URL); warnIfHandoffTooLarge surfaces the alert and
    // returns true, so close the blank tab we opened and bail — navigating to
    // '/app' first (the prior order) landed the user on an empty editor and only
    // warned after, defeating the guard. The blank tab is ours to close (opened
    // above within the click gesture).
    if (warnIfHandoffTooLarge(url)) {
      win.close();
      return;
    }
    win.location.href = url;
  };

  const handleFullScreen = () => {
    if (busy) return;
    setBusy(true);
    // Gate setBusy on mountedRef (R34 #4): if the component unmounted during
    // openFullScreen's await, the finally would otherwise setState on an
    // unmounted component (a React dev warning). The button is gone with the
    // component, so leaving busy=true in the unmounted last state is harmless.
    openFullScreen().finally(() => {
      if (mountedRef.current) setBusy(false);
    });
  };

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Live editor — {profession.name} invoice. No signup. Data stays in your browser.
        </p>
        <Button variant="outline" size="sm" onClick={handleFullScreen} disabled={!iframeSrc || busy}>
          <Maximize2 className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Edit in full-screen</span>
          <span className="sm:hidden">Full-screen</span>
        </Button>
      </div>
      {iframeSrc ? (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title={`${profession.name} invoice editor`}
          loading="lazy"
          className="w-full h-[800px] md:h-[1000px] block"
        />
      ) : (
        // Same dimensions as the iframe to avoid layout shift while the
        // client-only prefill is computed.
        <div
          className="w-full h-[800px] md:h-[1000px] block animate-pulse bg-muted/30"
          aria-busy="true"
          aria-label={`${profession.name} invoice editor loading`}
        />
      )}
    </div>
  );
}
