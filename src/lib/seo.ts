/**
 * JSON-LD builders for the programmatic-SEO profession pages. Each returns a
 * JSON string ready for `dangerouslySetInnerHTML` inside a
 * `<script type="application/ld+json">`. Shapes match the existing
 * SoftwareApplication block in src/app/layout.tsx.
 */

interface FaqEntry {
  question: string;
  answer: string;
}

interface Crumb {
  name: string;
  url: string;
}

export function faqJsonLd(faq: FaqEntry[]): string {
  return JSON.stringify({
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
  return JSON.stringify({
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
  return JSON.stringify({
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