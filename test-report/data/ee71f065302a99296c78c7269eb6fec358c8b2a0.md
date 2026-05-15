# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-app.spec.ts >> E2E — Invoice Builder >> auto-save persists to localStorage and survives page reload
- Location: tests/e2e-app.spec.ts:46:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Company name')

```

# Page snapshot

```yaml
- generic [ref=e2]: Bad Gateway
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('E2E — Invoice Builder', () => {
  4   |   test.use({ viewport: { width: 1280, height: 900 } });
  5   | 
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await page.goto('/');
  8   |     await page.evaluate(() => localStorage.clear());
  9   |   });
  10  | 
  11  |   test('creates invoice, fills all fields, and downloads PDF', async ({ page }) => {
  12  |     page.on('download', async (download) => {
  13  |       const path = await download.path();
  14  |       expect(path).toBeTruthy();
  15  |       expect(download.suggestedFilename()).toMatch(/Invoice-.*\.pdf/);
  16  |     });
  17  | 
  18  |     await page.goto('/app');
  19  |     await page.waitForSelector('input[placeholder="Company name"]', { state: 'visible' });
  20  | 
  21  |     // Fill "From" company using placeholder locators
  22  |     await page.getByPlaceholder('Company name').fill('Test Company Ltd');
  23  |     await page.getByPlaceholder('Email').first().fill('test@example.com');
  24  |     await page.getByPlaceholder('Phone').first().fill('+44 1234 567890');
  25  |     await page.getByPlaceholder('Address').first().fill('123 Test Street');
  26  | 
  27  |     // Fill "To" company
  28  |     await page.getByPlaceholder('Client name').fill('Client Corp');
  29  |     await page.getByPlaceholder('Email').nth(1).fill('client@client.com');
  30  |     await page.getByPlaceholder('Address').nth(1).fill('456 Client Road');
  31  | 
  32  |     // Switch currency
  33  |     await page.locator('select').first().selectOption('EUR');
  34  | 
  35  |     // Switch template
  36  |     await page.locator('select').nth(1).selectOption('classic');
  37  | 
  38  |     // Click download
  39  |     const [download] = await Promise.all([
  40  |       page.waitForEvent('download'),
  41  |       page.getByRole('button', { name: 'Download PDF' }).click(),
  42  |     ]);
  43  |     expect(download.suggestedFilename()).toMatch(/Invoice-.*\.pdf/);
  44  |   });
  45  | 
  46  |   test('auto-save persists to localStorage and survives page reload', async ({ page }) => {
  47  |     await page.goto('/app');
> 48  |     await page.getByPlaceholder('Company name').fill('Persistence Test Co');
      |                                                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  49  | 
  50  |     // Wait for auto-save debounce
  51  |     await page.waitForTimeout(800);
  52  | 
  53  |     // Verify in localStorage
  54  |     const stored = await page.evaluate(() => localStorage.getItem('billify_current'));
  55  |     expect(stored).toBeTruthy();
  56  |     const parsed = JSON.parse(stored!);
  57  |     expect(parsed.from.name).toBe('Persistence Test Co');
  58  | 
  59  |     // Reload and verify persistence
  60  |     await page.reload();
  61  |     await page.waitForSelector('input');
  62  |     const nameValue = await page.getByPlaceholder('Company name').inputValue();
  63  |     expect(nameValue).toBe('Persistence Test Co');
  64  |   });
  65  | 
  66  |   test('each template produces visually different preview', async ({ page }) => {
  67  |     await page.goto('/app');
  68  |     await page.waitForLoadState('networkidle');
  69  | 
  70  |     // Switch templates and capture preview HTML
  71  |     const previews: string[] = [];
  72  |     for (const tmpl of ['modern', 'classic', 'minimal']) {
  73  |       await page.locator('select').nth(1).selectOption(tmpl);
  74  |       await page.waitForTimeout(300);
  75  |       const previewHtml = await page.locator('.bg-white').first().innerHTML();
  76  |       previews.push(previewHtml);
  77  |       expect(previewHtml.length).toBeGreaterThan(50);
  78  |     }
  79  | 
  80  |     // Verify previews are different from each other
  81  |     expect(previews[0]).not.toBe(previews[1]);
  82  |     expect(previews[1]).not.toBe(previews[2]);
  83  |   });
  84  | 
  85  |   test('tax slider correctly adjusts totals', async ({ page }) => {
  86  |     await page.goto('/app');
  87  | 
  88  |     // Add a line item if possible
  89  |     const addItemBtn = page.getByRole('button', { name: /Add Item/i });
  90  |     if (await addItemBtn.isVisible()) {
  91  |       await addItemBtn.click();
  92  |       await page.getByPlaceholder('Description').first().fill('Consulting');
  93  |       const qtyInputs = page.locator('input[type="number"]');
  94  |       await qtyInputs.first().fill('1');
  95  |       await qtyInputs.nth(1).fill('100');
  96  |     }
  97  | 
  98  |     // Find and adjust tax slider
  99  |     const slider = page.locator('input[type="range"]');
  100 |     if (await slider.isVisible()) {
  101 |       await slider.fill('20');
  102 |       await page.waitForTimeout(300);
  103 |       const body = await page.content();
  104 |       // Subtotal $100 + 20% tax = $120 total
  105 |       expect(body).toMatch(/120\.00/);
  106 |     }
  107 |   });
  108 | 
  109 |   test('footer has correct branding', async ({ page }) => {
  110 |     await page.goto('/');
  111 |     const footerText = await page.locator('footer').innerText();
  112 |     expect(footerText).toContain('Billify');
  113 |     expect(footerText).toContain('2026');
  114 |   });
  115 | 
  116 |   test('landing page has no InvoicePro references', async ({ page }) => {
  117 |     await page.goto('/');
  118 |     const html = await page.content();
  119 |     expect(html).not.toMatch(/InvoicePro/i);
  120 |     expect(html).toMatch(/Billify/);
  121 |   });
  122 | });
  123 | 
  124 | /* ===============================================================
  125 |  *  Test execution helpers
  126 |  * ===============================================================
  127 |  *
  128 |  *  Run locally:
  129 |  *    cd ~/projects/invoicepro
  130 |  *    npm run build
  131 |  *    npx serve dist -l 3000 &
  132 |  *    npx playwright test tests/e2e-app.spec.ts --project chromium
  133 |  *
  134 |  *  Run against production:
  135 |  *    TEST_URL=https://billify.me npx playwright test tests/e2e-app.spec.ts --project chromium
  136 |  *
  137 |  *  Generate HTML report:
  138 |  *    npx playwright show-report test-report
  139 |  *
  140 |  * =============================================================== */
  141 | 
```