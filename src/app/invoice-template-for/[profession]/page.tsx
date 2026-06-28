import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { professions, bySlug } from '@/data/professions';
import { ProfessionPage } from '@/components/ProfessionPage';
import { professionPath, professionUrl, ogImagePath } from '@/lib/site';
import { ogImageMetadata } from '@/lib/seo';

// Pre-render one page per profession under output:'export'.
export function generateStaticParams() {
  return professions.map((p) => ({ profession: p.slug }));
}

// Next 14.2.15: params is a plain synchronous object (the Promise<params>
// form is Next 15). Keep it sync.
export function generateMetadata({
  params,
}: {
  params: { profession: string };
}): Metadata {
  const p = bySlug(params.profession);
  if (!p) return { title: 'Invoice template — Billify' };

  const slug = p.slug;
  const canonical = professionPath(slug);
  const ogImage = ogImagePath(slug);

  return {
    title: p.h1,
    description: p.metaDescription,
    alternates: { canonical },
    ...ogImageMetadata({
      title: p.h1,
      description: p.metaDescription,
      // ogImageMetadata's `url` feeds openGraph.url, which the OG spec requires
      // to be absolute (and layout.tsx passes an absolute SITE_URL for the same
      // contract) — so reuse professionUrl (absolute), NOT the relative
      // professionPath used for alternates.canonical above (which Next resolves
      // against metadataBase).
      url: professionUrl(slug),
      image: ogImage,
      imageAlt: p.h1,
    }),
  };
}

export default function ProfessionRoutePage({
  params,
}: {
  params: { profession: string };
}) {
  const profession = bySlug(params.profession);
  if (!profession) notFound();
  return <ProfessionPage profession={profession} />;
}
