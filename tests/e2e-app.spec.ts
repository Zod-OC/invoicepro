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

    // Switch between free templates and capture preview HTML
    // Note: 'minimal' is a Pro-only template; we test only free-accessible ones here
    const previews: string[] = [];
    for (const tmpl of ['modern', 'classic']) {
      await page.getByTestId('template-select').selectOption(tmpl);
      await page.waitForTimeout(300);
      const previewHtml = await page.locator('.bg-white').first().innerHTML();
      previews.push(previewHtml);
      expect(previewHtml.length).toBeGreaterThan(50);
    }

    // Verify previews are different from each other
    expect(previews[0]).not.toBe(previews[1]);
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

  // Regression for the template-clamp data-loss race: a logged-in Pro user with
  // a saved Pro template must NOT be downgraded to 'modern' while plan is still
  // its synchronous initial 'free' (before /api/stripe/validate-token resolves).
  test('logged-in Pro user keeps saved Pro template after plan resolves', async ({ page }) => {
    const proInvoice = {
      id: 'test-pro-1',
      number: 'INV-EXEC-1',
      date: '2026-06-26',
      dueDate: '2026-07-10',
      from: { name: 'Pro Co', email: 'pro@x.com', address: '1 Pro St', phone: '555-0100' },
      to: { name: 'Client', email: 'c@x.com', address: '2 Client St', phone: '555-0101' },
      items: [{ description: 'Consulting', quantity: 2, rate: 250 }],
      notes: '',
      terms: 'Net 14',
      taxRate: 0,
      currency: 'USD',
      template: 'executive',
      status: 'draft',
      createdAt: 1,
      updatedAt: 1,
    };

    // Seed a Pro subscription token + a saved invoice using a Pro template.
    await page.evaluate((inv) => {
      localStorage.setItem('billify_sub_token', 'fake-pro-token');
      localStorage.setItem('billify_current', JSON.stringify(inv));
    }, proInvoice);

    // Mock the token-validation endpoint to return Pro.
    await page.route('**/api/stripe/validate-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ plan: 'pro', limits: { invoicesPerMonth: Infinity, templates: 'all' } }),
      })
    );

    const validateResponse = page.waitForResponse((r) => r.url().includes('/api/stripe/validate-token'));
    await page.goto('/app');
    await validateResponse; // plan has now resolved to 'pro'
    await page.waitForSelector('input[placeholder="Company name"]', { state: 'visible' });

    // The Pro template must be preserved — not clamped down to 'modern'.
    await expect(page.getByTestId('template-select')).toHaveValue('executive');

    // Wait for the debounced auto-save and confirm the Pro template is persisted
    // (the bug would have overwritten it with 'modern').
    await page.waitForTimeout(800);
    const stored = await page.evaluate(() => localStorage.getItem('billify_current'));
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).template).toBe('executive');
  });

  // The clamp must still fire for a FREE user who loads a Pro template via a
  // crafted ?invoice= URL (the tier-leak defense the clamp exists for).
  test('free user loading a crafted Pro template via ?invoice= is clamped to modern', async ({ page }) => {
    const crafted = {
      id: 'test-craft-1',
      number: 'INV-CRAFT-1',
      date: '2026-06-26',
      dueDate: '2026-07-10',
      from: { name: 'From Co', email: 'f@x.com', address: '1 St', phone: '555-0001' },
      to: { name: 'To Co', email: 't@x.com', address: '2 St', phone: '555-0002' },
      items: [{ description: 'Work', quantity: 1, rate: 100 }],
      notes: '',
      terms: 'Net 14',
      taxRate: 0,
      currency: 'USD',
      template: 'creative', // Pro-only
      status: 'draft',
      createdAt: 1,
      updatedAt: 1,
    };
    const b64url = Buffer.from(JSON.stringify(crafted))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // No subscription token seeded → free tier. Navigate with the crafted invoice.
    await page.goto(`/app?invoice=${b64url}`);
    await page.waitForSelector('input[placeholder="Company name"]', { state: 'visible' });

    // Once plan resolves (no token → 'free'), the Pro template is clamped to 'modern'.
    await expect(page.getByTestId('template-select')).toHaveValue('modern');
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
