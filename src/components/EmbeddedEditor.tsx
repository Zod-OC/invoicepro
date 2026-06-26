'use client';

import { useEffect, useMemo, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Profession } from '@/data/professions';
import { Invoice, createEmptyInvoice, validateInvoice } from '@/types';
import { encodeInvoice } from '@/lib/embed';

/**
 * The real Billify editor, embedded on a profession landing page via an
 * same-origin iframe to /app?embed=true&invoice=<base64url>. In embed mode the
 * editor is a throwaway scratch pad (no auto-save, namespaced storage, no
 * paywall) — see src/lib/embed.ts.
 *
 * Up-channel: the iframe posts its live invoice up on every change so the
 * "Edit in full-screen" handoff can carry the user's scratch edits (from/to,
 * logo, notes, terms, dates, template) losslessly into the persistent /app.
 */
export function EmbeddedEditor({ profession }: { profession: Profession }) {
  const prefilled = useMemo<Invoice>(
    () => ({
      ...createEmptyInvoice(),
      items: profession.defaultLineItems,
      taxRate: profession.defaultTaxRate,
      currency: profession.defaultCurrency,
    }),
    [profession],
  );

  const iframeSrc = useMemo(
    () => `/app?embed=true&invoice=${encodeInvoice(prefilled)}`,
    [prefilled],
  );

  // The live invoice mirrored up from the iframe; starts as the prefill.
  const [live, setLive] = useState<Invoice>(prefilled);

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
    // No embed flag → the host /app loads the handed-off invoice from ?invoice=
    // and persists it to billify_current (the user's real working invoice).
    window.open(`/app?invoice=${encodeInvoice(live)}`, '_blank', 'noopener');
  };

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Live editor — {profession.name} invoice. No signup. Data stays in your browser.
        </p>
        <Button variant="outline" size="sm" onClick={openFullScreen}>
          <Maximize2 className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Edit in full-screen</span>
          <span className="sm:hidden">Full-screen</span>
        </Button>
      </div>
      <iframe
        src={iframeSrc}
        title={`${profession.name} invoice editor`}
        loading="lazy"
        className="w-full h-[800px] md:h-[1000px] block"
      />
    </div>
  );
}