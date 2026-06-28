import { BrandMark } from '@/components/SiteNav';

/**
 * The site-wide footer. Shared by the landing page and the programmatic-SEO
 * profession pages so a brand/copy change lands everywhere at once. Uses the
 * shared BrandMark (sm size) so the footer's mark can't drift from the nav's.
 */
export function SiteFooter() {
  return (
    <footer className="w-full border-t py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <BrandMark size="sm" />
        <p className="text-sm text-muted-foreground">© 2026 Billify. Built for freelancers.</p>
      </div>
    </footer>
  );
}