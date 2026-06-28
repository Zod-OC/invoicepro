import Link from 'next/link';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The Billify brand mark — the clickable Sparkles + "Billify" wordmark linking
 * home. Extracted so the nav (SiteNav/SiteNavShell) and the footer (SiteFooter)
 * render one identical mark, and a restyle (icon size, weight) lands everywhere
 * at once instead of drifting across the four sites that previously inlined
 * their own copy. `size` picks the tuned icon+text classes per context: the
 * nav uses the larger lg mark, the footer the smaller sm mark.
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

/**
 * The sticky top-bar shell shared by every marketing page's nav: the brand mark
 * on the left and a `children` cluster on the right. Pages pass their own
 * right-hand links/CTAs (Templates/Pricing/Create Invoice on the landing + SEO
 * pages, a Back button on /templates, App/Get Started on /pricing) so the nav
 * chrome — the border, backdrop blur, sticky positioning, max width, and brand
 * mark — is defined once and can't drift across the four sites. The /app editor
 * has a bespoke toolbar and does not use this.
 */
export function SiteNavShell({ children }: { children?: ReactNode }) {
  return (
    <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <BrandMark />
        {children && <div className="flex items-center gap-4">{children}</div>}
      </div>
    </nav>
  );
}

/**
 * The default site nav: brand mark + Templates / Pricing links + a "Create
 * Invoice" CTA. Shared by the landing page and the programmatic-SEO profession
 * pages so the 30 SEO pages can't drift out of sync with the rest of the site.
 * Built on SiteNavShell so its chrome stays identical to /templates and
 * /pricing, which pass their own right-hand children.
 */
export function SiteNav() {
  return (
    <SiteNavShell>
      <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
      <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
      <Button asChild size="sm">
        <Link href="/app">Create Invoice</Link>
      </Button>
    </SiteNavShell>
  );
}