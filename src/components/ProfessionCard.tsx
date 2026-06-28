import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Profession } from '@/data/professions';
import { professionPath } from '@/lib/site';

/**
 * Shared link card for a profession landing page. Used by BrowseProfessions
 * (dense 4-col grid) and CrossLinks (roomy 3-col grid) — the only differences
 * are padding/text size, controlled by `dense`. Both previously hand-rolled the
 * same Card+Link+h3+clamped-description markup; this is the single primitive.
 */
export function ProfessionCard({
  profession,
  dense = false,
}: {
  profession: Profession;
  dense?: boolean;
}) {
  return (
    <Link
      href={professionPath(profession.slug)}
      className="group"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className={dense ? 'p-4' : 'p-6'}>
          <h3
            className={`font-semibold group-hover:text-primary transition-colors ${
              dense ? '' : 'mb-1'
            }`}
          >
            {profession.name}
          </h3>
          <p
            className={`text-muted-foreground line-clamp-2 ${
              dense ? 'text-xs mt-1' : 'text-sm'
            }`}
          >
            {profession.metaDescription}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
