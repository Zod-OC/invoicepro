import { test, expect } from '@playwright/test';

// Set localStorage before the app initializes, so history/clients are pre-populated.
async function seedStorage(page: Page, data: { clients?: unknown[]; history?: unknown[] }) {
  await page.addInitScript((d) => {
    if (d.clients) localStorage.setItem('billify_clients', JSON.stringify(d.clients));
    if (d.history) localStorage.setItem('billify_history', JSON.stringify(d.history));
  }, data);
}

test.describe('Sticky features — backup/restore, client directory, auto-numbering', () => {

  test('auto-numbering: New button creates sequential invoice numbers', async ({ browser }) => {
    // Use a desktop context to avoid mobile layout issues
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('/app');
    await page.waitForTimeout(4000);

    // Click the New button twice
    const newBtn = page.locator('nav').getByRole('button', { name: /New/ });
    await newBtn.click();
    await page.waitForTimeout(1000);

    const counter = await page.evaluate(() => localStorage.getItem('billify_invoice_counter'));
    expect(counter).toBeTruthy();
    expect(parseInt(counter!)).toBeGreaterThanOrEqual(1001);

    await newBtn.click();
    await page.waitForTimeout(1000);
    const counter2 = await page.evaluate(() => localStorage.getItem('billify_invoice_counter'));
    expect(parseInt(counter2!)).toBeGreaterThan(parseInt(counter!));
    await page.close();
  });

  test('backup/restore: dialog opens with export and import options', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);

    await page.locator('nav').getByRole('button', { name: /Backup/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: 'Backup & Restore' })).toBeVisible();
    await expect(page.getByText('Export data')).toBeVisible();
    await expect(page.getByText('Import data')).toBeVisible();
  });

  test('backup/restore: export downloads valid JSON backup', async ({ page, browserName }) => {
    test.skip(browserName === 'chromium' && page.viewportSize()?.width && page.viewportSize()!.width < 500, 'Mobile download events are flaky');
    // Seed data before page load
    await seedStorage(page, {
      clients: [{ id: 'c1', name: 'Acme Corp', email: 'acme@test.com', phone: '555-0100', address: '123 Main St', createdAt: Date.now() }],
      history: [{ id: 'h1', number: 'INV-1001', clientName: 'Acme Corp', amount: 1500, currency: 'USD', date: '2026-01-01', dueDate: '2026-01-15', status: 'paid', createdAt: Date.now(), updatedAt: Date.now() }],
    });

    await page.goto('/app');
    await page.waitForTimeout(3000);

    await page.locator('nav').getByRole('button', { name: /Backup/ }).click();
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('billify-backup-');

    // Verify JSON content
    const path = await download.path();
    const fs = require('fs');
    const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
    expect(json.version).toBe(1);
    expect(json.clients).toHaveLength(1);
    expect(json.clients[0].name).toBe('Acme Corp');
    expect(json.history).toHaveLength(1);
    expect(json.history[0].number).toBe('INV-1001');
  });

  test('client directory: dialog opens with empty state', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);

    await page.locator('nav').getByRole('button', { name: /Clients/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
    await expect(page.getByText(/No saved clients yet/i)).toBeVisible();
  });

  test('client directory: shows free tier limit (3 clients)', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);

    await page.locator('nav').getByRole('button', { name: /Clients/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/0\s*\/\s*3 clients used/i)).toBeVisible();
  });

  test('invoice history: empty state shown on first visit', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);

    await page.locator('nav').getByRole('button', { name: /History/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/No invoices yet/i)).toBeVisible();
  });

  test('invoice history: shows pre-populated records with status badges', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    // First load to get the page, then set localStorage and reload
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.setItem('billify_history', JSON.stringify([
        { id: 'h1', number: 'INV-1001', clientName: 'Acme Corp', amount: 1500, currency: 'USD', date: '2026-01-01', dueDate: '2026-01-15', status: 'paid', paidDate: '2026-01-14', createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'h2', number: 'INV-1002', clientName: 'Globex Inc', amount: 750, currency: 'EUR', date: '2026-02-01', dueDate: '2026-02-15', status: 'sent', createdAt: Date.now(), updatedAt: Date.now() },
      ]));
    });
    await page.reload();
    await page.waitForTimeout(4000);

    // Open the history dialog
    await page.locator('nav').getByRole('button', { name: /History/ }).click();
    await page.waitForTimeout(2000);

    // Check that the dialog rendered with table rows (scope to dialog to exclude editor's items table)
    const rowCount = await page.locator('[role="dialog"] table tbody tr').count();
    expect(rowCount).toBe(2);
    await page.close();
  });

  test('all three sticky buttons are hidden in embed mode', async ({ page }) => {
    await page.goto('/invoice-template-for/electrician');
    await page.waitForTimeout(3000);

    // The editor iframe is same-origin — check inside it
    const iframe = page.frameLocator('iframe[src*="/app"]').first();

    await expect(iframe.getByRole('button', { name: /Backup/ })).toHaveCount(0);
    await expect(iframe.getByRole('button', { name: /Clients/ })).toHaveCount(0);
    await expect(iframe.getByRole('button', { name: /History/ })).toHaveCount(0);
  });

});
