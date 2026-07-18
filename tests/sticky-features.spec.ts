import { test, expect, type Page } from '@playwright/test';

// Set localStorage before the app initializes, so history/clients are pre-populated.
async function seedStorage(page: Page, data: { clients?: unknown[]; history?: unknown[]; snapshots?: Record<string, unknown> }) {
  await page.addInitScript((d) => {
    if (d.clients) localStorage.setItem('billify_clients', JSON.stringify(d.clients));
    if (d.history) localStorage.setItem('billify_history', JSON.stringify(d.history));
    if (d.snapshots) localStorage.setItem('billify_invoice_snapshots', JSON.stringify(d.snapshots));
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

  // Issue #12: on a GENUINE first visit (no saved invoice, no counter yet) the
  // editor must pre-fill the first sequential number (INV-1001) instead of
  // createEmptyInvoice()'s random INV-1XXX–INV-9XXX fallback. The "New" button
  // test above covers the manual path; this covers the first-load path.
  //
  // Why browser.newPage() instead of the { page } fixture: each call spawns a
  // NEW browser context, so localStorage starts genuinely empty — exactly the
  // "first visit" state the page.tsx mount gate keys off. We deliberately do
  // NOT add an init script that clears storage on every navigation: such a
  // script also runs on the reload below, wiping the counter before the app
  // boots and making the "no drift on reload" assertion meaningless (it would
  // always re-land on 1001 regardless of a consume-on-every-load bug). The
  // first assertion (INV-1001) doubles as a check that storage really was
  // empty at first mount — if it weren't, the gate wouldn't fire and the field
  // would show a random number instead.
  test('auto-numbering: first-ever visit pre-fills INV-1001, not a random number (#12)', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('/app');

    // Stable hook on the number input (data-testid), not a structure-dependent
    // label+sibling selector that breaks on minor markup tweaks.
    const numberInput = page.getByTestId('invoice-number');
    // toHaveValue auto-waits through the mount effect's setInvoice.
    await expect(numberInput).toHaveValue('INV-1001');

    // The counter was consumed exactly once for this first visit.
    const counter = await page.evaluate(() => localStorage.getItem('billify_invoice_counter'));
    expect(counter).toBe('1001');

    // Reload. The gate consumes a number ONLY when billify_invoice_counter is
    // null, so on reload (counter now "1001") it must NOT consume again. The
    // unchanged counter is the real guard against an "INV-1002 drift on every
    // load" regression — a consume-on-every-load bug would bump it to 1002 and
    // fail here. The first-visit invoice is never auto-saved (dirty stays
    // false, billify_current stays null), so reload shows createEmptyInvoice's
    // random number (e.g. INV-4231), NOT INV-1001; we therefore assert the
    // field still holds a well-formed invoice number rather than INV-1001.
    await page.reload();
    await expect(numberInput).toHaveValue(/^INV-\d+$/);
    const counterAfterReload = await page.evaluate(() => localStorage.getItem('billify_invoice_counter'));
    expect(counterAfterReload).toBe('1001');
    await page.close();
  });

  // Issue #12 acceptance: returning users with a saved invoice are NOT affected —
  // a restore must never clobber their number with a freshly-consumed one. Seeds
  // an already-advanced counter AND a saved current invoice, then asserts the
  // saved number is restored untouched and the counter is not incremented.
  test('auto-numbering: returning user with a saved invoice is unaffected (#12)', async ({ browser }) => {
    // browser.newPage() = fresh isolated context, so the addInitScript seed
    // below is the ONLY state present at mount (no leakage from other tests).
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.addInitScript(() => {
      localStorage.setItem('billify_invoice_counter', '1042');
      localStorage.setItem('billify_current', JSON.stringify({
        id: 'ret-1',
        number: 'RET-EXISTING-9',
        date: '2026-07-01',
        dueDate: '2026-07-15',
        from: { name: 'Returning Co', email: '', address: '', phone: '' },
        to: { name: 'Existing Client', email: '', address: '', phone: '' },
        items: [{ description: 'Prior work', quantity: 1, rate: 100 }],
        notes: '', terms: 'Net 14', taxRate: 0, currency: 'USD', template: 'modern',
        status: 'draft', createdAt: 1, updatedAt: 1,
      }));
    });
    await page.goto('/app');

    // The saved number is restored verbatim — not overwritten with INV-1043.
    const numberInput = page.getByTestId('invoice-number');
    await expect(numberInput).toHaveValue('RET-EXISTING-9');

    // The counter is untouched: no consume fires on the restore path.
    const counter = await page.evaluate(() => localStorage.getItem('billify_invoice_counter'));
    expect(counter).toBe('1042');
    await page.close();
  });

  test('history: downloading a PDF records the invoice as "sent" (#8)', async ({ page, browserName }) => {
    test.skip(browserName === 'chromium' && (page.viewportSize()?.width ?? 0) < 500, 'Mobile download events are flaky');
    await page.goto('/app');
    await page.waitForTimeout(3000);

    // Fill a minimal real invoice (empty invoices aren't recorded meaningfully).
    await page.getByPlaceholder('Company name').fill('History Test Co');
    await page.getByPlaceholder('Client name').fill('History Client');

    // Download — handleDownload now calls recordInvoice(inv, 'sent') on success.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Download PDF/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/Invoice-.*\.pdf/);
    await page.waitForTimeout(600);

    // Open the History panel and assert a 'sent' record now exists.
    await page.locator('nav').getByRole('button', { name: /History/ }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('table select').first()).toHaveValue('sent');
  });

  test('history: Load button reloads the invoice into the editor (#9)', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    // A full (logo-stripped) invoice snapshot keyed by the same id as the
    // history record — the Load button is enabled only when this exists.
    const snapshot = {
      id: 'load-1',
      number: 'INV-5555',
      date: '2026-07-01',
      dueDate: '2026-07-15',
      from: { name: 'Snapshot Sender LLC', email: 'bill@sender.test', address: '1 Sender St', phone: '555-0001' },
      to: { name: 'Loadable Client Co', email: 'ap@client.test', address: '2 Client Ave', phone: '555-0002' },
      items: [{ description: 'Snapshot Consulting', quantity: 5, rate: 120 }],
      notes: '',
      terms: 'Net 14',
      taxRate: 0,
      currency: 'USD',
      template: 'modern',
      status: 'draft',
      createdAt: 1750000000000,
      updatedAt: 1750000000000,
    };
    await seedStorage(page, {
      history: [
        { id: 'load-1', number: 'INV-5555', clientName: 'Loadable Client Co', amount: 600, currency: 'USD', date: '2026-07-01', dueDate: '2026-07-15', status: 'sent', createdAt: 1750000000000, updatedAt: 1750000000000 },
      ],
      snapshots: { 'load-1': snapshot },
    });

    await page.goto('/app');
    await page.waitForTimeout(4000);

    // Open the History panel — the row's Load button is enabled (snapshot present).
    await page.locator('nav').getByRole('button', { name: /History/ }).click();
    await page.waitForTimeout(500);
    const loadBtn = page.locator('[role="dialog"]').getByRole('button', { name: 'Load' });
    await expect(loadBtn).toBeEnabled();
    await loadBtn.click();

    // handleLoad closes the dialog; the editor now holds the loaded invoice.
    await expect(page.getByPlaceholder('Company name')).toHaveValue('Snapshot Sender LLC');
    await expect(page.getByPlaceholder('Client name')).toHaveValue('Loadable Client Co');
    await page.close();
  });

  test('history: Load button is disabled (with an honest tooltip) when no snapshot is saved (#3)', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    // A history record with NO matching snapshot — e.g. evicted by the 50-cap,
    // or a backup that predates snapshots. Load must be disabled, not a silent no-op.
    await seedStorage(page, {
      history: [
        { id: 'nosnap-1', number: 'INV-6666', clientName: 'No Snapshot Co', amount: 100, currency: 'USD', date: '2026-07-01', dueDate: '2026-07-15', status: 'sent', createdAt: 1750000000000, updatedAt: 1750000000000 },
      ],
    });

    await page.goto('/app');
    await page.waitForTimeout(4000);
    await page.locator('nav').getByRole('button', { name: /History/ }).click();
    await page.waitForTimeout(500);

    const loadBtn = page.locator('[role="dialog"]').getByRole('button', { name: 'Load' });
    await expect(loadBtn).toBeDisabled();
    // The tooltip explains WHY, so the disabled button reads as intentional, not broken.
    await expect(loadBtn).toHaveAttribute('title', /no longer saved/i);
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
    test.skip(browserName === 'chromium' && (page.viewportSize()?.width ?? 0) < 500, 'Mobile download events are flaky');
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
