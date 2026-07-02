'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The Billify brand mark — the clickable Sparkles + "Billify" wordmark linking
 * home. Extracted so the nav (SiteNav) and the footer (SiteFooter) render one
 * identical mark, and a restyle lands everywhere at once. `size` picks the tuned
 * icon+text classes per context: the nav uses the larger lg mark, the footer the
 * smaller sm mark.
 */
export function BrandMark({
  size = 'lg',
  className,
}: {
  size?: 'lg' | 'sm';
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2', className)}
      aria-label="Billify home"
    >
      <Sparkles
        className={cn('text-primary', size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')}
        aria-hidden
      />
      <span className={size === 'lg' ? 'font-bold text-lg' : 'font-semibold'}>
        Billify
      </span>
    </Link>
  );
}

export type NavSection = 'home' | 'templates' | 'pricing';

const NAV_LINKS: { href: string; label: string; section: NavSection }[] = [
  { href: '/invoice-templates', label: 'Templates', section: 'templates' },
  { href: '/pricing', label: 'Pricing', section: 'pricing' },
];

/**
 * The unified site nav — ONE component across every page (landing, the 30
 * profession pages, pricing, templates, the invoice-templates hub, privacy,
 * security, authors). Brand mark left; Templates + Pricing links with
 * active-state highlighting + a "Create Invoice" CTA right; collapses to a
 * hamburger menu on mobile. Previously each page passed its own different
 * right-hand children to SiteNavShell, so the menu shifted between pages —
 * unprofessional for a first-visit product. The /app editor keeps its own
 * action toolbar (a tool UI) but reuses BrandMark for brand consistency.
 *
 * Client component because the mobile menu needs open/close state.
 */
export function SiteNav({ active }: { active?: NavSection }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <BrandMark />
        {/* Desktop links + CTA */}
        <div className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm transition-colors',
                active === l.section
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/app">Create Invoice</Link>
          </Button>
        </div>
        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center w-9 h-9 -mr-2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t bg-background">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'text-sm py-2',
                  active === l.section ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {l.label}
              </Link>
            ))}
            <Button asChild size="sm" className="mt-2">
              <Link href="/app" onClick={() => setOpen(false)}>Create Invoice</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
