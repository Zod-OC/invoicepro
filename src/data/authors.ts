/**
 * E-E-A-T publisher/author identity for the programmatic-SEO pages.
 *
 * Google's Sept-2025 rater guidelines require content-creator identification.
 * Billify's content is published by KSP Labs (the software studio behind
 * Billify) rather than a named individual, so the schema uses Organization
 * (not Person). KSP Labs has a real, verifiable website (ksplabs.dev) in
 * sameAs, which is honest and satisfies E-E-A-T without exposing any
 * individual's personal identity.
 */
export interface Author {
  /** Stable id used in the bio route (/authors/<id>) and generateStaticParams. */
  id: string;
  /** Display name of the publishing entity. */
  name: string;
  /** Short descriptor shown as a subtitle on bio pages and bylines. */
  role: string;
  /** Site-relative bio page path, e.g. '/authors/ksp-labs'. */
  bioPath: string;
  /** 1–3 sentence factual bio. */
  bio: string;
  /** Verifiable profile URLs. */
  sameAs: string[];
}

export const AUTHORS: Record<string, Author> = {
  'ksp-labs': {
    id: 'ksp-labs',
    name: 'KSP Labs',
    role: 'Software Studio behind Billify',
    bioPath: '/authors/ksp-labs',
    bio:
      'KSP Labs builds practical, privacy-first tools for freelancers and small businesses. Billify — a browser-native invoice generator with no signup and no server-side storage — is its flagship product. These profession guides accompany the same editor they describe.',
    sameAs: ['https://ksplabs.dev'],
  },
};

export const DEFAULT_AUTHOR_ID = 'ksp-labs';
export const DEFAULT_AUTHOR = AUTHORS[DEFAULT_AUTHOR_ID];
