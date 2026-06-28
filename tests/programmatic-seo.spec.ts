import { test, expect } from '@playwright/test';
import { professions } from '../src/data/professions';

const BASE = 'https://billify.me';

test.describe('Programmatic SEO — profession landing pages', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('every profession page is reachable and has correct SEO tags', async ({ page }) => {
    for (const p of professions) {
      const url = `/invoice-template-for/${p.slug}`;
      const resp = await page.goto(url);
      expect(resp?.status(), `${url} should return 200`).toBe(200);

      await expect(page).toHaveTitle(`${p.h1} | Billify`);
      await expect(page.locator('h1')).toHaveText(p.h1);

      const meta = page.locator('meta[name="description"]');
      await expect(meta).toHaveAttribute('content', p.metaDescription);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', `${BASE}${url}`);
    }
  });

  test('profession page embeds the editor with embed=true and a prefill', async ({ page }) => {
    const p = professions[0];
    await page.goto(`/invoice-template-for/${p.slug}`);

    const iframe = page.locator('iframe[title*="invoice editor"]');
    await expect(iframe).toBeVisible();

    const src = await iframe.getAttribute('src');
    expect(src).toContain('embed=true');
    expect(src).toMatch(/invoice=[A-Za-z0-9_-]+/);
  });

  test('sitemap.xml contains every profession URL', async ({ request }) => {
    const resp = await request.get('/sitemap.xml');
    expect(resp.status()).toBe(200);
    const body = await resp.text();

    for (const p of professions) {
      expect(body).toContain(`${BASE}/invoice-template-for/${p.slug}`);
    }
  });

  test('home page links to profession landing pages', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href^="/invoice-template-for/"]');
    await expect(links.first()).toBeVisible();

    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(12);

    // Verify at least the first 3 professions are linked.
    for (const p of professions.slice(0, 3)) {
      await expect(
        page.locator(`a[href="/invoice-template-for/${p.slug}"]`).first(),
      ).toBeVisible();
    }
  });
});
