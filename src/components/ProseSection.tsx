import type { ReactNode } from 'react';

/**
 * Titled prose section for the static legal/info pages (privacy, security).
 * Shared so a restyle lands on both pages at once instead of drifting between
 * two copies — the same "defined once, can't drift" pattern as SiteFooter.
 */
export function ProseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
