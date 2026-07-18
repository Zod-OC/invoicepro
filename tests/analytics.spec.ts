import { test, expect } from '@playwright/test';
import { join } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

/**
 * Source-consistency tests for the analytics event contract (issue #5).
 *
 * src/lib/analytics.ts exports `track(name, props)`, a cookieless, same-origin
 * Umami wrapper whose docblock IS the documented contract: a small, fixed,
 * NAMED set of events — no autocapture, no PII. Issue #5 was that
 * `upgrade_click` (fired by PaywallModal's "Upgrade to Pro" link) was missing
 * from that list, so the docblock understated what we collect. The one-line fix
 * (shipped in b143a00) added it.
 *
 * These tests pin that fix and, more usefully, close off the whole class of
 * regression in BOTH directions: every event actually fired via track() must
 * appear in the docblock, and the docblock must not name an event nothing fires.
 * Pure source analysis — no browser, same shape as unit-types.spec.ts.
 */

const REPO_ROOT = join(__dirname, '..');
const ANALYTICS_PATH = join(REPO_ROOT, 'src', 'lib', 'analytics.ts');
const SRC_DIR = join(REPO_ROOT, 'src');

const analyticsSrc = readFileSync(ANALYTICS_PATH, 'utf8');

/** Event names enumerated in the analytics.ts docblock's contract sentence. */
function documentedEvents(): Set<string> {
  // The contract sentence reads, across newlines:
  //   "fixed set of NAMED events (page views are automatic): checkout_click,
  //    upgrade_click, editor_open, pseo_view, cap_hit."
  // [^.]* spans the newlines (negated classes match \n). Then keep only the
  // snake_case tokens — prose like "page views", "automatic" has no underscore
  // and is naturally excluded.
  const m = analyticsSrc.match(/fixed set of NAMED events[^.]*\./);
  if (!m) return new Set();
  return new Set([...m[0].matchAll(/\b[a-z]+_[a-z_]+\b/g)].map((x) => x[0]));
}

/** Event names actually fired via track('<name>', ...) anywhere under src/. */
function trackedEvents(): Set<string> {
  const events = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      const src = readFileSync(full, 'utf8');
      // Matches the analytics wrapper's call sites only. The internal
      // `umami.track(name, props)` passes a variable (not a string literal) and
      // the `export function track(name: string)` definition has no opening
      // paren-quote, so neither is captured.
      for (const m of src.matchAll(/\btrack\(\s*['"]([^'"]+)['"]/g)) {
        events.add(m[1]);
      }
    }
  };
  walk(SRC_DIR);
  return events;
}

test.describe('Analytics docblock — issue #5 (list upgrade_click)', () => {
  test('docblock lists upgrade_click', () => {
    // The literal issue #5 regression: upgrade_click must be documented.
    expect(analyticsSrc).toContain('upgrade_click');
    expect(documentedEvents().has('upgrade_click')).toBe(true);
  });

  test('every event fired via track() is named in the docblock', () => {
    // Prevents the issue #5 bug generally: adding a track('foo') call without
    // documenting it makes the docblock silently lie about what we collect.
    const missing = [...trackedEvents()].filter((e) => !documentedEvents().has(e));
    expect(
      missing,
      `fired by track() but missing from the docblock: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  test('the docblock names no event that is never fired (no phantoms)', () => {
    // The mirror regression: removing the last track('foo') call but leaving it
    // in the docblock overstates what we collect.
    const phantom = [...documentedEvents()].filter((e) => !trackedEvents().has(e));
    expect(
      phantom,
      `named in the docblock but nothing fires it: ${phantom.join(', ')}`,
    ).toEqual([]);
  });
});
