import type { MetadataRoute } from 'next';
import { professions, PROFESSION_DATA_UPDATED_AT } from '@/data/professions';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://billify.me';

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/app`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/templates`, changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Stable lastModified from the data layer — not `new Date()` at build time,
  // which would mark every profession page as changed on every rebuild.
  const professionPages: MetadataRoute.Sitemap = professions.map((p) => ({
    url: `${base}/invoice-template-for/${p.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: new Date(PROFESSION_DATA_UPDATED_AT),
  }));

  return [...staticPages, ...professionPages];
}