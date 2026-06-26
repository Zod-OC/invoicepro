/**
 * JSON-LD builders for the programmatic-SEO profession pages. Each returns a
 * JSON string ready for `dangerouslySetInnerHTML` inside a
 * `<script type="application/ld+json">`. The SoftwareApplication block is also
 * the single source used by src/app/layout.tsx (so it is not duplicated on
 * profession pages).
 */

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
 * does not escape `</script>`, so an authored string containing that literal
 * would close the JSON-LD <script> early and let the remainder be parsed as
 * page HTML. Escape `<`, `>`, and `--` (to defuse `<!--`/`-->`). JSON consumers
 * parse `<` back to `<`, so schema validity is preserved.
 */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/--/g, '\\u002d\\u002d');
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

export function softwareApplicationJsonLd(): string {
  return safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Billify',
    applicationCategory: 'BusinessApplication',
    description:
      'Create professional PDF invoices in seconds. Free forever. No signup required.',
    url: 'https://billify.me',
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