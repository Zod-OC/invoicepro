import { bySlug } from '@/data/professions';
import type { Profession } from '@/data/professions';
import { ProfessionCard } from '@/components/ProfessionCard';

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
            <ProfessionCard key={p.slug} profession={p} />
          ))}
        </div>
      </div>
    </section>
  );
}