'use client';

import { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Profession } from '@/data/professions';
import { Invoice, createEmptyInvoice, validateInvoice } from '@/types';
import { encodeInvoice, stashHandoff } from '@/lib/embed';

/**
 * The real Billify editor, embedded on a profession landing page via an
 * same-origin iframe to /app?embed=true&invoice=<base64url>. In embed mode the
 * editor is a throwaway scratch pad (no auto-save, namespaced storage, no
 * paywall) — see src/lib/embed.ts.
 *
 * Up-channel: the iframe posts its live invoice up (debounced in /app) so the
 * "Edit in full-screen" handoff can carry the user's scratch edits (from/to,
 * logo, notes, terms, dates, template) losslessly into the persistent /app.
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
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  // The live invoice mirrored up from the iframe; null until the mount effect
  // seeds it with the prefill. Only consumed by the full-screen handoff (a
  // click handler), never rendered into SSR HTML, so its non-deterministic init
  // is hydration-safe.
  const [live, setLive] = useState<Invoice | null>(null);

  useEffect(() => {
    const prefilled: Invoice = {
      ...createEmptyInvoice(),
      items: profession.defaultLineItems,
      taxRate: profession.defaultTaxRate,
      currency: profession.defaultCurrency,
    };
    setLive(prefilled);
    setIframeSrc(`/app?embed=true&invoice=${encodeInvoice(prefilled)}`);
  }, [profession]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const payload = e.data as { type?: string; invoice?: unknown } | null;
      if (!payload || payload.type !== 'billify-invoice') return;
      const validated = validateInvoice(payload.invoice);
      if (validated) setLive(validated);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const openFullScreen = () => {
    if (!live) return;
    // Stash the full invoice (which may include a large uploaded logo data URL)
    // in localStorage and carry only a short token in the URL — encoding the
    // whole invoice into ?invoice= exceeded browser/nginx URL caps and silently
    // lost the user's scratch edit. The host /app consumes the stash once via
    // takeHandoff() and persists it to billify_current.
    const token = stashHandoff(live);
    window.open(`/app?handoff=${token}`, '_blank', 'noopener');
  };

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Live editor — {profession.name} invoice. No signup. Data stays in your browser.
        </p>
        <Button variant="outline" size="sm" onClick={openFullScreen} disabled={!live}>
          <Maximize2 className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Edit in full-screen</span>
          <span className="sm:hidden">Full-screen</span>
        </Button>
      </div>
      {iframeSrc ? (
        <iframe
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