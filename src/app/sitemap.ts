import type { MetadataRoute } from 'next';
import { professions, PROFESSION_DATA_UPDATED_AT } from '@/data/professions';
import { AUTHORS } from '@/data/authors';
import { SITE_URL, staticUrl, professionUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: staticUrl('/app'), changeFrequency: 'weekly', priority: 0.9 },
    { url: staticUrl('/invoice-templates'), changeFrequency: 'weekly', priority: 0.9 },
    { url: staticUrl('/pricing'), changeFrequency: 'monthly', priority: 0.8 },
    { url: staticUrl('/templates'), changeFrequency: 'monthly', priority: 0.8 },
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
  const professionPages: MetadataRoute.Sitemap = professions.map((p) => ({
    url: professionUrl(p.slug),
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: new Date(PROFESSION_DATA_UPDATED_AT),
  }));

  return [...staticPages, ...authorPages, ...professionPages];
}
