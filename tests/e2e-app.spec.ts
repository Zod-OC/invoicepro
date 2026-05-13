import { test, expect } from '@playwright/test';

test.describe('E2E — Invoice Builder', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('creates invoice, fills all fields, and downloads PDF', async ({ page }) => {
    page.on('download', async (download) => {
      const path = await download.path();
      expect(path).toBeTruthy();
      expect(download.suggestedFilename()).toMatch(/Invoice-.*\.pdf/);
    });

    await page.goto('/app');
    await page.waitForSelector('input[placeholder="Company name"]', { state: 'visible' });

    // Fill "From" company using placeholder locators
    await page.getByPlaceholder('Company name').fill('Test Company Ltd');
    await page.getByPlaceholder('Email').first().fill('test@example.com');
    await page.getByPlaceholder('Phone').first().fill('+44 1234 567890');
    await page.getByPlaceholder('Address').first().fill('123 Test Street');

    // Fill "To" company
    await page.getByPlaceholder('Client name').fill('Client Corp');
    await page.getByPlaceholder('Email').nth(1).fill('client@client.com');
    await page.getByPlaceholder('Address').nth(1).fill('456 Client Road');

    // Switch currency
    await page.locator('select').first().selectOption('EUR');

    // Switch template
    await page.locator('select').nth(1).selectOption('classic');

    // Click download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PDF' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/Invoice-.*\.pdf/);
  });

  test('auto-save persists to localStorage and survives page reload', async ({ page }) => {
    await page.goto('/app');
    await page.getByPlaceholder('Company name').fill('Persistence Test Co');

    // Wait for auto-save debounce
    await page.waitForTimeout(800);

    // Verify in localStorage
    const stored = await page.evaluate(() => localStorage.getItem('billify_current'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.from.name).toBe('Persistence Test Co');

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector('input');
    const nameValue = await page.getByPlaceholder('Company name').inputValue();
    expect(nameValue).toBe('Persistence Test Co');
  });

  test('each template produces visually different preview', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Switch templates and capture preview HTML
    const previews: string[] = [];
    for (const tmpl of ['modern', 'classic', 'minimal']) {
      await page.locator('select').nth(1).selectOption(tmpl);
      await page.waitForTimeout(300);
      const previewHtml = await page.locator('.bg-white').first().innerHTML();
      previews.push(previewHtml);
      expect(previewHtml.length).toBeGreaterThan(50);
    }

    // Verify previews are different from each other
    expect(previews[0]).not.toBe(previews[1]);
    expect(previews[1]).not.toBe(previews[2]);
  });

  test('tax slider correctly adjusts totals', async ({ page }) => {
    await page.goto('/app');

    // Add a line item if possible
    const addItemBtn = page.getByRole('button', { name: /Add Item/i });
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();
      await page.getByPlaceholder('Description').first().fill('Consulting');
      const qtyInputs = page.locator('input[type="number"]');
      await qtyInputs.first().fill('1');
      await qtyInputs.nth(1).fill('100');
    }

    // Find and adjust tax slider
    const slider = page.locator('input[type="range"]');
    if (await slider.isVisible()) {
      await slider.fill('20');
      await page.waitForTimeout(300);
      const body = await page.content();
      // Subtotal $100 + 20% tax = $120 total
      expect(body).toMatch(/120\.00/);
    }
  });

  test('footer has correct branding', async ({ page }) => {
    await page.goto('/');
    const footerText = await page.locator('footer').innerText();
    expect(footerText).toContain('Billify');
    expect(footerText).toContain('2026');
  });

  test('landing page has no InvoicePro references', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).not.toMatch(/InvoicePro/i);
    expect(html).toMatch(/Billify/);
  });
});

/* ===============================================================
 *  Test execution helpers
 * ===============================================================
 *
 *  Run locally:
 *    cd ~/projects/invoicepro
 *    npm run build
 *    npx serve dist -l 3000 &
 *    npx playwright test tests/e2e-app.spec.ts --project chromium
 *
 *  Run against production:
 *    TEST_URL=https://billify.me npx playwright test tests/e2e-app.spec.ts --project chromium
 *
 *  Generate HTML report:
 *    npx playwright show-report test-report
 *
 * =============================================================== */
