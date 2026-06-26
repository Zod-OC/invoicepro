import { professions } from '@/data/professions';
import { ProfessionCard } from '@/components/ProfessionCard';

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
            <ProfessionCard key={p.slug} profession={p} dense />
          ))}
        </div>
      </div>
    </section>
  );
}