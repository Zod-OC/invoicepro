import Link from 'next/link';
import { BrandMark } from '@/components/SiteNav';

/**
 * The site-wide footer. Shared by the landing page and the programmatic-SEO
 * profession pages so a brand/copy change lands everywhere at once. Uses the
 * shared BrandMark (sm size) so the footer's mark can't drift from the nav's.
 */
const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/invoice-templates', label: 'Invoice Templates' },
  { href: '/guides/invoice-tax-compliance-guide', label: 'Tax Guide' },
  { href: '/templates', label: 'Templates' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/security', label: 'Security' },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <BrandMark size="sm" />
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">{l.label}</Link>
          ))}
        </nav>
        <p className="text-sm text-muted-foreground">© 2026 Billify. Built for freelancers.</p>
      </div>
    </footer>
  );
}
