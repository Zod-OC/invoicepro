import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { professions } from '@/data/professions';

/**
 * Crawlable "Browse by profession" grid. Used on the home, templates, and
 * pricing pages to spread PageRank into the 30 programmatic-SEO landing pages.
 */
export function BrowseProfessions({ limit = 12 }: { limit?: number }) {
  const shown = professions.slice(0, limit);

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Browse by profession</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shown.map((p) => (
            <Link key={p.slug} href={`/invoice-template-for/${p.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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