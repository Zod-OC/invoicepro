import type { MetadataRoute } from 'next';
import { professions, PROFESSION_DATA_UPDATED_AT } from '@/data/professions';
import { AUTHORS } from '@/data/authors';
import { INVOICE_FORMATS, FORMAT_DATA_UPDATED_AT } from '@/data/formats';
import { COMPARISONS, COMPARISON_DATA_UPDATED_AT } from '@/data/comparisons';
import { SITE_URL, staticUrl, professionUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: staticUrl('/app'), changeFrequency: 'weekly', priority: 0.9 },
    { url: staticUrl('/invoice-templates'), changeFrequency: 'weekly', priority: 0.9 },
    { url: staticUrl('/pricing'), changeFrequency: 'monthly', priority: 0.8 },
    { url: staticUrl('/templates'), changeFrequency: 'monthly', priority: 0.8 },
    { url: staticUrl('/guides/invoice-tax-compliance-guide'), changeFrequency: 'monthly', priority: 0.8 },
    { url: staticUrl('/privacy'), changeFrequency: 'yearly', priority: 0.4 },
    { url: staticUrl('/security'), changeFrequency: 'yearly', priority: 0.4 },
  ];

  const authorPages: MetadataRoute.Sitemap = Object.values(AUTHORS).map((a) => ({
    url: staticUrl(a.bioPath),
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  // Stable lastModified from the data layer — not `new Date()` at build time,
  // which would mark every profession page as changed on every rebuild.
  const formatPages: MetadataRoute.Sitemap = INVOICE_FORMATS.map((f) => ({
    url: staticUrl(`/invoice-template/${f.slug}`),
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: new Date(FORMAT_DATA_UPDATED_AT),
  }));

  const comparisonPages: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: staticUrl(`/compare/${c.slug}`),
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: new Date(COMPARISON_DATA_UPDATED_AT),
  }));

  const professionPages: MetadataRoute.Sitemap = professions.map((p) => ({
    url: professionUrl(p.slug),
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: new Date(PROFESSION_DATA_UPDATED_AT),
  }));

  return [...staticPages, ...authorPages, ...formatPages, ...comparisonPages, ...professionPages];
}
