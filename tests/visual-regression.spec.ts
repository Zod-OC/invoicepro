import { test, expect } from '@playwright/test';
import { join } from 'path';
import { mkdirSync } from 'fs';

const SNAPSHOT_DIR = join(__dirname, '__screenshots__');

// Ensure snapshot directories exist for each test file
function ensureDir(file: string) {
  const dir = join(SNAPSHOT_DIR, file);
  try { mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}

test.describe('Visual Regression — all pages', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  const pages = [
    { path: '/', name: 'landing' },
    { path: '/templates', name: 'templates' },
    { path: '/pricing', name: 'pricing' },
    { path: '/app', name: 'app-page' },
  ];

  for (const p of pages) {
    test(`[desktop] ${p.name} renders correctly`, async ({ page }) => {
      await page.goto(p.path);
      // Wait for hydration / fonts
      await page.waitForLoadState('networkidle');
      const dir = ensureDir(`${p.name}-desktop`);
      await page.screenshot({
        path: join(dir, `${p.name}-chromium-${process.platform}.png`),
        fullPage: true,
      });
      // Basic asserts
      await expect(page).toHaveTitle(/Billify/);
    });
  }

  test('template gallery shows all 12 templates with distinct names', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
    // The grid contains all 12 template cards
    const cards = await page.locator('div.grid > div').count();
    expect(cards).toBeGreaterThanOrEqual(12);

    // Verify distinct template names exist
    const names = await page.locator('h3').allTextContents();
    const expected = ['Modern', 'Classic', 'Minimal', 'Clean', 'Bold', 'Corporate', 'Startup', 'Freelancer', 'Executive', 'Agency', 'Consulting', 'Creative'];
    for (const name of expected) {
      expect(names.some(n => n.includes(name)), `Template ${name} should be in gallery`).toBe(true);
    }
  });

  test('landing page has brand "Billify" everywhere', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    // Catch any lingering InvoicePro references
    const invoiceProMatches = (html.match(/InvoicePro/gi) || []).length;
    expect(invoiceProMatches).toBe(0);

    const billifyMatches = (html.match(/Billify/g) || []).length;
    expect(billifyMatches).toBeGreaterThanOrEqual(2);
  });

  test('pricing page shows three tiers', async ({ page }) => {
    await page.goto('/pricing');
    const cards = await page.locator('div.grid > div').count();
    expect(cards).toBeGreaterThanOrEqual(3);

    const prices = await page.locator('text=/€\\d+/').allTextContents();
    expect(prices.length).toBeGreaterThanOrEqual(3);
  });
});
