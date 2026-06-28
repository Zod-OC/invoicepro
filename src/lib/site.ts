/**
 * Canonical site origin. Single source of truth for absolute URLs across the
 * app (JSON-LD, sitemap, metadataBase, profession-page canonical/breadcrumbs).
 * Update here only — previously hardcoded in src/lib/seo.ts, src/app/sitemap.ts,
 * src/components/ProfessionPage.tsx, and src/app/layout.tsx.
 */
export const SITE_URL = 'https://billify.me';

/**
 * Host portion of SITE_URL with the scheme stripped (e.g. 'billify.me'), for
 * display copy like the clickjacking-refusal link. Co-located with SITE_URL so
 * the no-path/port assumption the strip relies on lives next to the constant it
 * parses, and any future caller (OG image label, email template, sitemap host
 * entry) reuses one derivation instead of re-rolling the regex inline.
 */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

/**
 * Absolute URL for a site-relative path (e.g. '/app', '/pricing', '/templates',
 * '/api/stripe'). The canonical-origin concatenation in one place, alongside
 * professionUrl, so a SITE_URL change (trailing slash, path prefix, scheme)
 * lands everywhere at once — previously `${SITE_URL}/<path>` was hand-rolled
 * across sitemap/pricing/templates/ProfessionPage/stripe-client, the exact
 * producer/consumer drift this module was created to prevent.
 */
export function staticUrl(path: string): string {
  return SITE_URL + path;
}

/**
 * Route prefix + URL helpers for the programmatic-SEO profession pages. The
 * literal `/invoice-template-for/<slug>` was hand-rolled in four places (the
 * page route, ProfessionPage canonical/breadcrumbs, sitemap, ProfessionCard
 * link), which drifts silently if the route ever changes. Route it through
 * here so a rename lands everywhere at once. `professionPath` is site-relative;
 * `professionUrl` is absolute (for canonical/sitemap/JSON-LD).
 */
export const PROFESSION_PATH_PREFIX = '/invoice-template-for/';
export function professionPath(slug: string): string {
  return PROFESSION_PATH_PREFIX + slug;
}
export function professionUrl(slug: string): string {
  // Route through staticUrl rather than re-rolling `SITE_URL + ...` — the
  // absolute-URL concatenation (trailing-slash/path-prefix/scheme handling)
  // already lives in staticUrl, and duplicating it here lets the two diverge:
  // a future SITE_URL with a trailing slash would double it here while
  // staticUrl stripped it. `professionPath` is the site-relative form, so the
  // composition is `staticUrl(professionPath(slug))`.
  return staticUrl(professionPath(slug));
}

/**
 * OG image path helpers. The profession route's generateMetadata references
 * the image by URL (`/og-images/invoice-template-<slug>.png`) and the
 * `scripts/generate-og-images.ts` generator writes the file under
 * `public/og-images/` with the same filename. The directory and filename
 * pattern are shared here so a rename on either side can't silently leave the
 * route pointing at a nonexistent image (broken social previews with no
 * build-time signal). `ogImageFilename` is the bare filename the generator
 * writes; `ogImagePath` is the site-relative URL the route serves.
 */
export const OG_IMAGE_DIR = '/og-images';
// OG canvas dimensions, in one place: the generator (scripts/generate-og-
// images.ts) draws the canvas at this size and the two metadata declarations
// (layout.tsx default OG + the profession route's generateMetadata) describe
// the image to social platforms at this size. Three hand-rolled 1200×630
// literals would drift silently if the canvas is ever regenerated at a
// different size (wrong crop/aspect hints, no build-time signal) — exactly the
// producer/consumer drift this module was created to prevent for paths/host.
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export function ogImageFilename(slug: string): string {
  return `invoice-template-${slug}.png`;
}
export function ogImagePath(slug: string): string {
  return `${OG_IMAGE_DIR}/${ogImageFilename(slug)}`;
}
