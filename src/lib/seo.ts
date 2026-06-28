/**
 * JSON-LD builders for the programmatic-SEO profession pages. Each returns a
 * JSON string ready for `dangerouslySetInnerHTML` inside a
 * `<script type="application/ld+json">`. The SoftwareApplication block is also
 * the single source used by src/app/layout.tsx (so it is not duplicated on
 * profession pages).
 */

import type { Metadata } from 'next';
import { SITE_URL, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '@/lib/site';

interface FaqEntry {
  question: string;
  answer: string;
}

interface Crumb {
  name: string;
  url: string;
}

/**
 * JSON.stringify for `dangerouslySetInnerHTML` injection. Raw JSON.stringify
 * does not escape `<`, so an authored string containing `</script>` (or any
 * `<`) would close the JSON-LD <script> early and let the remainder be parsed
 * as page HTML. Escaping every `<` (and `>`, for symmetry) to a JSON `\uXXXX`
 * escape prevents the HTML5 script-data parser from ever leaving the plain
 * script-data state: the `<!--` and `-->` sequences can only trigger the
 * escaped states via a literal `<`, which no longer appears in the raw text,
 * so no separate `--` escape is needed. JSON consumers parse `<` back to
 * `<`, so schema validity is preserved.
 */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

export function faqJsonLd(faq: FaqEntry[]): string {
  return safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  });
}

export function breadcrumbJsonLd(items: Crumb[]): string {
  return safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/**
 * Shared openGraph + twitter + robots spine for page metadata. The default
 * metadata in src/app/layout.tsx and the profession route's generateMetadata
 * both build the same OG image-array shape ({ url, width: OG_IMAGE_WIDTH,
 * height: OG_IMAGE_HEIGHT, alt }), the same twitter card type
 * ('summary_large_image'), and the same robots default ({ index, follow }).
 * Those literals were copy-pasted between the two files, so a sitewide change
 * to the card type or robots policy landed in two places with no signal if one
 * was forgotten. Returns the three keys both spreads expect; the caller owns
 * title/description/url (and layout.tsx layers its sitewide siteName/locale on
 * top of openGraph). The OG image dimensions come from site.ts (shared with
 * the generator) so the metadata and the canvas stay in sync.
 */
export function ogImageMetadata({
  title,
  description,
  url,
  image,
  imageAlt,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
}): Pick<Metadata, 'openGraph' | 'twitter' | 'robots'> {
  return {
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function softwareApplicationJsonLd(): string {
  return safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Billify',
    applicationCategory: 'BusinessApplication',
    description:
      'Create professional PDF invoices in seconds. Free forever. No signup required.',
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with core invoice features',
    },
    operatingSystem: 'Web Browser',
    featureList:
      'PDF export, invoice templates, auto-save, logo upload, no signup required',
  });
}
