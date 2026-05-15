# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-regression.spec.ts >> Visual Regression — all pages >> [desktop] pricing renders correctly
- Location: tests/visual-regression.spec.ts:25:9

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /Billify/
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    14 × unexpected value ""

```

```yaml
- text: Bad Gateway
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { join } from 'path';
  3  | import { mkdirSync } from 'fs';
  4  | 
  5  | const SNAPSHOT_DIR = join(__dirname, '__screenshots__');
  6  | 
  7  | // Ensure snapshot directories exist for each test file
  8  | function ensureDir(file: string) {
  9  |   const dir = join(SNAPSHOT_DIR, file);
  10 |   try { mkdirSync(dir, { recursive: true }); } catch {}
  11 |   return dir;
  12 | }
  13 | 
  14 | test.describe('Visual Regression — all pages', () => {
  15 |   test.use({ viewport: { width: 1280, height: 720 } });
  16 | 
  17 |   const pages = [
  18 |     { path: '/', name: 'landing' },
  19 |     { path: '/templates', name: 'templates' },
  20 |     { path: '/pricing', name: 'pricing' },
  21 |     { path: '/app', name: 'app-page' },
  22 |   ];
  23 | 
  24 |   for (const p of pages) {
  25 |     test(`[desktop] ${p.name} renders correctly`, async ({ page }) => {
  26 |       await page.goto(p.path);
  27 |       // Wait for hydration / fonts
  28 |       await page.waitForLoadState('networkidle');
  29 |       const dir = ensureDir(`${p.name}-desktop`);
  30 |       await page.screenshot({
  31 |         path: join(dir, `${p.name}-chromium-${process.platform}.png`),
  32 |         fullPage: true,
  33 |       });
  34 |       // Basic asserts
> 35 |       await expect(page).toHaveTitle(/Billify/);
     |                          ^ Error: expect(page).toHaveTitle(expected) failed
  36 |     });
  37 |   }
  38 | 
  39 |   test('template gallery shows three distinct cards', async ({ page }) => {
  40 |     await page.goto('/templates');
  41 |     await page.waitForLoadState('networkidle');
  42 |     const cards = await page.locator('div.grid > div').count();
  43 |     expect(cards).toBe(3);
  44 | 
  45 |     // Verify distinct template names exist
  46 |     const names = await page.locator('h3').allTextContents();
  47 |     expect(names).toContain('Modern');
  48 |     expect(names).toContain('Classic');
  49 |     expect(names).toContain('Minimal');
  50 |   });
  51 | 
  52 |   test('landing page has brand "Billify" everywhere', async ({ page }) => {
  53 |     await page.goto('/');
  54 |     const html = await page.content();
  55 |     // Catch any lingering InvoicePro references
  56 |     const invoiceProMatches = (html.match(/InvoicePro/gi) || []).length;
  57 |     expect(invoiceProMatches).toBe(0);
  58 | 
  59 |     const billifyMatches = (html.match(/Billify/g) || []).length;
  60 |     expect(billifyMatches).toBeGreaterThanOrEqual(2);
  61 |   });
  62 | 
  63 |   test('pricing page shows three tiers', async ({ page }) => {
  64 |     await page.goto('/pricing');
  65 |     const cards = await page.locator('div.grid > div').count();
  66 |     expect(cards).toBeGreaterThanOrEqual(3);
  67 | 
  68 |     const prices = await page.locator('text=/\\$\\d+/').allTextContents();
  69 |     expect(prices.length).toBeGreaterThanOrEqual(3);
  70 |   });
  71 | });
  72 | 
```