import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { bySlug } from '@/data/professions';
import type { Profession } from '@/data/professions';

/**
 * 2–3 crawlable internal links to related profession pages. Resolves slugs via
 * the data layer and silently drops any that don't resolve (defensive — the
 * authored `relatedSlugs` are validated to exist, but stay robust to edits).
 */
export function CrossLinks({ slugs }: { slugs: string[] }) {
  const related: Profession[] = slugs
    .map((s) => bySlug(s))
    .filter((p): p is Profession => Boolean(p));

  if (!related.length) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Other invoice templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((p) => (
            <Link
              key={p.slug}
              href={`/invoice-template-for/${p.slug}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.metaDescription}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}