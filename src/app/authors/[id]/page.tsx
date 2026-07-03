import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { AUTHORS } from '@/data/authors';
import { staticUrl } from '@/lib/site';
import { organizationJsonLd } from '@/lib/seo';

// E-E-A-T publisher bio pages. One static page per publisher (generateStaticParams),
// linked from the profession-page byline + Organization schema, so the publisher is
// verifiable rather than a string in a JSON-LD blob.
export function generateStaticParams() {
  return Object.keys(AUTHORS).map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const author = AUTHORS[params.id];
  if (!author) return {};
  return {
    title: `${author.name} — ${author.role}`,
    description: author.bio,
    alternates: { canonical: author.bioPath },
    openGraph: {
      title: `${author.name}, ${author.role}`,
      description: author.bio,
      url: staticUrl(author.bioPath),
      type: 'profile',
    },
  };
}

export default function AuthorPage({ params }: { params: { id: string } }) {
  const author = AUTHORS[params.id];
  if (!author) notFound();
  return (
    <div className="min-h-full flex flex-col">
      <SiteNav />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-2">Published by</p>
          <h1 className="text-3xl font-bold">{author.name}</h1>
          <p className="text-lg text-muted-foreground mt-1">{author.role}</p>
          <p className="mt-6 text-foreground leading-relaxed">{author.bio}</p>

          {author.sameAs.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              {author.sameAs.map((url) => (
                <a key={url} href={url} rel="noopener noreferrer me" className="text-primary underline">
                  {new URL(url).hostname.replace(/^www\./, '')}
                </a>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Link href="/invoice-templates" className="text-sm text-primary underline">Browse invoice templates →</Link>
          </div>
        </div>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: organizationJsonLd({
            name: author.name,
            description: author.role,
            url: staticUrl(author.bioPath),
            sameAs: author.sameAs,
          }),
        }}
      />
    </div>
  );
}
