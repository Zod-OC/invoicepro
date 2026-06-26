import type { MetadataRoute } from 'next';
import { professions } from '@/data/professions';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://billify.me';
  const today = new Date().toISOString().split('T')[0];

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/app`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/templates`, changeFrequency: 'monthly', priority: 0.8 },
  ];

  const professionPages: MetadataRoute.Sitemap = professions.map((p) => ({
    url: `${base}/invoice-template-for/${p.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: today,
  }));

  return [...staticPages, ...professionPages];
}