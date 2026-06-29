/**
 * E-E-A-T authorship for the programmatic-SEO pages.
 *
 * Google's Sept-2025 rater guidelines require content-creator identification,
 * and the growth audit flags its ABSENCE as the single biggest residual SEO
 * risk on the 30 profession pages. A NAMED author (even thin) outranks anonymous;
 * a VERIFIED one (sameAs populated with real LinkedIn/GitHub) is the goal.
 *
 * IMPORTANT: this MUST be a real person. The audit is explicit that a FABRICATED
 * author is a Lowest-rating trigger — worse than anonymous. The default below is
 * the repo's owner/operator; before relying on it for ranking, replace `name`
 * with the real founder identity and populate `sameAs` with verifiable profile
 * URLs (LinkedIn, GitHub, etc.). A Person schema with empty sameAs is weak-but-
 * honest; do NOT invent credentials or profile URLs to fill it.
 */
export interface Author {
  /** Stable id used in the bio route (/authors/<id>) and generateStaticParams. */
  id: string;
  /** Real, full display name. */
  name: string;
  /** Honest role, e.g. 'Founder, Billify'. Do not inflate. */
  jobTitle: string;
  /** Site-relative bio page path, e.g. '/authors/founder'. */
  bioPath: string;
  /** 1–3 sentence factual bio. */
  bio: string;
  /** Verifiable profile URLs (LinkedIn, GitHub, …). Leave empty rather than fake. */
  sameAs: string[];
}

export const AUTHORS: Record<string, Author> = {
  founder: {
    id: 'founder',
    name: 'Zodric',
    jobTitle: 'Founder, Billify',
    bioPath: '/authors/founder',
    bio:
      'Zodric maintains Billify, a privacy-first invoice generator that runs entirely in your browser — no signup, no server-side invoice storage. These profession guides accompany the same editor they describe.',
    sameAs: [], // TODO(operator): add real LinkedIn/GitHub URLs — a verified author is the E-E-A-T goal.
  },
};

export const DEFAULT_AUTHOR_ID = 'founder';
export const DEFAULT_AUTHOR = AUTHORS[DEFAULT_AUTHOR_ID];
