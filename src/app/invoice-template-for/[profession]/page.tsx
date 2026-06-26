import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { professions, bySlug } from '@/data/professions';
import { ProfessionPage } from '@/components/ProfessionPage';

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
  const canonical = `/invoice-template-for/${slug}`;
  const ogImage = `/og-images/invoice-template-${slug}.png`;

  return {
    title: p.h1,
    description: p.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: p.h1,
      description: p.metaDescription,
      url: canonical,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: p.h1,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: p.h1,
      description: p.metaDescription,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
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