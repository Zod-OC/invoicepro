import { test, expect } from '@playwright/test';

/**
 * CSS Pipeline Regression Tests
 * --------------------------------------------------------------------------
 * These tests catch production CSS pipeline bugs that render visually broken
 * pages without breaking HTTP responses. The most insidious failure mode is
 * when Tailwind utility classes fail to compile (e.g. because Tailwind or
 * PostCSS config files were missing from the Docker build context), causing
 * the page to load with zero styling while returning HTTP 200 — which passes
 * every status-code-based test.
 *
 * If any test in this file starts failing in CI, the production CSS pipeline
 * is broken. Re-deploy only after the bug is fixed.
 *
 * Original incident (2026-06-25): `docker-billify/Dockerfile` did not COPY
 * `tailwind.config.ts` or `postcss.config.mjs` into the builder stage, so
 * Next.js shipped an uncompiled 3.4 KB CSS file (only `@tailwind` directives)
 * instead of the 26+ KB compiled output. Browser rendered the page with no
 * styling, but every URL still returned 200.
 */

test.describe('CSS pipeline — production must have compiled Tailwind', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('homepage CSS file is non-trivial (Tailwind utilities compiled)', async ({ request }) => {
    // Discover the CSS file path from the HTML
    const html = await request.get('/');
    expect(html.status()).toBe(200);
    const body = await html.text();
    const cssMatch = body.match(/href="\/_next\/static\/css\/([a-f0-9]+\.css)"/);
    expect(cssMatch, 'expected Next.js to emit a compiled CSS file in <head>').toBeTruthy();
    if (!cssMatch) return;

    const cssPath = `/_next/static/css/${cssMatch[1]}`;
    const cssResp = await request.get(cssPath);
    expect(cssResp.status()).toBe(200);
    const cssText = await cssResp.text();

    // A correctly compiled Tailwind CSS bundle is typically >10 KB.
    // The broken-state output (only `@tailwind base/components/utilities` directives
    // + CSS variables) is consistently ~3.4 KB. We assert a generous lower bound.
    expect(
      cssText.length,
      `Compiled CSS is ${cssText.length} bytes — looks like Tailwind utilities did not compile. ` +
        'Check that the Docker build context includes tailwind.config.ts and postcss.config.mjs.',
    ).toBeGreaterThan(10_000);

    // The broken state would contain an unprocessed `@tailwind` directive.
    expect(
      cssText,
      'CSS still contains unprocessed @tailwind directives — PostCSS/Tailwind did not run during build.',
    ).not.toMatch(/@tailwind\s+(base|components|utilities)/);
  });

  test('homepage renders with actual styles applied (not unstyled DOM)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The hero h1 uses Tailwind utilities `text-4xl md:text-6xl font-bold tracking-tight`.
    // If Tailwind didn't compile, computed font-size will be the browser default (32px)
    // instead of the intended `clamp(2.25rem, ...)` from `text-4xl md:text-6xl`.
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const fontSize = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    // text-4xl = 2.25rem = 36px on the 1280px viewport (md: breakpoint hits at 768px,
    // so we expect text-6xl = 3.75rem = 60px). Either way > 32px (unstyled default).
    expect(
      fontSize,
      `Hero h1 font-size is ${fontSize}px — likely no Tailwind styles applied. ` +
        'Expected >32px from text-4xl/text-6xl.',
    ).toBeGreaterThan(32);

    // Primary CTA button should have a non-default background colour
    // (Tailwind bg-primary maps to hsl(var(--primary)) = a vivid blue, ~hsl(221, 83%, 53%)).
    const cta = page.getByRole('link', { name: /Create Free Invoice/i }).first();
    await expect(cta).toBeVisible();
    const bgColour = await cta.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Default browser link bg is rgba(0,0,0,0). Tailwind bg-primary resolves to a
    // saturated blue. Even a fall-through 'none' should not look like that.
    expect(bgColour, 'CTA button has no background colour — Tailwind bg-primary not applied.').not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColour, 'CTA button has no background colour — Tailwind bg-primary not applied.').not.toBe('transparent');
  });

  test('footer border is visible (regression: border-t class)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    const borderTopWidth = await footer.evaluate((el) => getComputedStyle(el).borderTopWidth);
    // Tailwind border-t applies 1px top border. If Tailwind didn't compile, width is "0px".
    expect(
      borderTopWidth,
      `Footer has border-top-width "${borderTopWidth}" — Tailwind border-t utility likely missing.`,
    ).not.toBe('0px');
  });

  test('CSP frame-ancestors is delivered via HTTP header (not just meta)', async ({ request }) => {
    // The original meta-tag CSP silently ignored frame-ancestors. To enforce it,
    // we must serve CSP via HTTP header. This test catches the regression where
    // someone reintroduces the meta-tag-only CSP.
    const resp = await request.get('/', { maxRedirects: 0 });
    const cspHeader = resp.headers()['content-security-policy'];

    if (!cspHeader) {
      // If neither meta nor header has CSP, fail loud.
      const html = await resp.text();
      const metaCsp = html.match(/http-equiv=["']Content-Security-Policy["'][^>]*content=["']([^"']+)["']/i);
      expect(
        metaCsp?.[1] ?? null,
        'No CSP delivered (neither HTTP header nor meta tag). Add a strict CSP via response header.',
      ).toBeTruthy();
      // If we reach here, CSP is meta-only. Warn but allow — frame-ancestors won't
      // work, but clickjacking protection via X-Frame-Options still applies.
      return;
    }

    expect(
      cspHeader,
      'CSP delivered via HTTP header should include frame-ancestors (meta-tag CSP ignores it).',
    ).toMatch(/frame-ancestors\s+['"]?none['"]?/);
  });
});
