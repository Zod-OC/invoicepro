import { test, expect } from '@playwright/test';

// One-off verification for R18-7 (separate logo localStorage key). Confirms:
//  - uploading a logo writes billify_logo_from and a text-only billify_current
//    (no data:image/png embedded in current)
//  - after reload, the logo is reassembled from the side-key and still rendered
// Not part of the standing suite (logo upload has no fixture elsewhere); delete
// after the loop converges.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

test('logo persists across reload via dedicated side-key, current stays text-only', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');

  const fileInput = page.locator('input[type=file]').first();
  await fileInput.setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG });

  // Logo preview img appears in the From card.
  await expect(page.locator('img[alt="Logo"]')).toBeVisible({ timeout: 5000 });

  // Debounced save (500ms) writes the side-key + text-only current.
  await page.waitForTimeout(1200);
  const logoFrom = await page.evaluate(() => localStorage.getItem('billify_logo_from'));
  const current = await page.evaluate(() => localStorage.getItem('billify_current'));
  expect(logoFrom).not.toBeNull();
  expect(logoFrom!.startsWith('data:image/png')).toBeTruthy();
  // current must be text-only: no embedded logo data URL.
  expect(current).not.toBeNull();
  expect(current!.includes('data:image/png')).toBeFalsy();

  // Reload — logo must reassemble from the side-key and re-render.
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('img[alt="Logo"]')).toBeVisible({ timeout: 5000 });
  const logoFromAfter = await page.evaluate(() => localStorage.getItem('billify_logo_from'));
  expect(logoFromAfter).not.toBeNull();
  expect(logoFromAfter!.startsWith('data:image/png')).toBeTruthy();
});

test('pre-migration embedded logo reassembles from current and migrates on first save', async ({ page }) => {
  // Simulate an old-build save: logo embedded in `current`, no side-keys.
  const dataUrl = `data:image/png;base64,${PNG.toString('base64')}`;
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.evaluate((url) => {
    const inv = {
      id: 'm', number: 'INV-M', date: '', dueDate: '',
      from: { name: 'Migration', email: '', address: '', phone: '', logo: url },
      to: { name: '', email: '', address: '', phone: '' },
      items: [{ description: '', quantity: 1, rate: 0 }],
      notes: '', terms: '', taxRate: 0, currency: 'USD', template: 'modern',
      status: 'draft', createdAt: 0, updatedAt: 0,
    };
    localStorage.setItem('billify_current', JSON.stringify(inv));
    localStorage.removeItem('billify_logo_from');
    localStorage.removeItem('billify_logo_to');
  }, dataUrl);

  // Reload: load path falls back to the embedded logo (side-keys empty).
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('img[alt="Logo"]')).toBeVisible({ timeout: 5000 });

  // Trigger a debounced save by editing a text field (company name).
  await page.locator('input').first().fill('Migration Co');
  await page.waitForTimeout(1200);

  // First save migrates the logo out to the side-key and strips it from current.
  const logoFrom = await page.evaluate(() => localStorage.getItem('billify_logo_from'));
  const current = await page.evaluate(() => localStorage.getItem('billify_current'));
  expect(logoFrom).not.toBeNull();
  expect(logoFrom!.startsWith('data:image/png')).toBeTruthy();
  expect(current!.includes('data:image/png')).toBeFalsy();
});

test('handoff sweep rate-limit marker survives the scan (not self-deleted)', async ({ page }) => {
  // Regression for R19-3: the last-sweep marker key used to nest under
  // HANDOFF_PREFIX, so the scan visited it, parsed its bare timestamp as NaN,
  // marked it stale, and deleted it — defeating the 60s throttle. With the key
  // moved outside the prefix, the scan must leave the marker intact AND a full
  // sweep (no prior marker) must still reap a stale orphan.
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  // Clear the marker the first mount set, then plant a stale orphan so the
  // next mount runs a FULL sweep (no marker → no throttle skip) that both reaps
  // the orphan and re-sets the marker. If the bug were present, the scan would
  // visit + delete the marker key it just shares the prefix with.
  await page.evaluate(() => {
    localStorage.removeItem('billify_last_handoff_sweep');
    const stale = Date.now() - 20 * 60 * 1000; // 20 min ago, past the 10-min TTL
    localStorage.setItem('billify_handoff_reaporphan', `${stale};{}`);
  });
  await page.reload(); // re-mount runs a full sweep (marker was cleared)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  const marker = await page.evaluate(() => localStorage.getItem('billify_last_handoff_sweep'));
  const orphan = await page.evaluate(() => localStorage.getItem('billify_handoff_reaporphan'));
  expect(marker).not.toBeNull(); // marker survives — the bug would have nulled it
  expect(orphan).toBeNull(); // the stale orphan was reaped by the full sweep
});

test('handoff with persist flag writes billify_current synchronously on mount', async ({ page }) => {
  // Regression for R19-4: the handoff stash + persist flag are one-time tokens
  // consumed eagerly in the mount effect. If the persist were left to the 500ms
  // debounced save, a tab close in that window would burn the tokens without
  // writing billify_current. The fix persists synchronously in the mount tick.
  const dataUrl = `data:image/png;base64,${PNG.toString('base64')}`;
  const token = 'synctesttoken123';
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.evaluate(({ token, dataUrl }) => {
    const inv = {
      id: 's', number: 'S-1', date: '', dueDate: '',
      from: { name: 'Sync Persist', email: '', address: '', phone: '', logo: dataUrl },
      to: { name: '', email: '', address: '', phone: '' },
      items: [{ description: '', quantity: 1, rate: 0 }], notes: '', terms: '',
      taxRate: 0, currency: 'USD', template: 'modern', status: 'draft', createdAt: 0, updatedAt: 0,
    };
    localStorage.setItem(`billify_handoff_${token}`, `${Date.now()};${JSON.stringify(inv)}`);
    localStorage.setItem(`billify_handoff_persist_${token}`, `${Date.now()};1`);
  }, { token, dataUrl });
  await page.goto(`/app?handoff=${token}&persist=${token}`);
  await page.waitForLoadState('networkidle');
  // Give the mount effect a tick to run, but NOT the 500ms debounce window —
  // a written current at 250ms proves the persist was synchronous, not debounced.
  await page.waitForTimeout(250);
  const current = await page.evaluate(() => localStorage.getItem('billify_current'));
  const logoFrom = await page.evaluate(() => localStorage.getItem('billify_logo_from'));
  const handoffKey = await page.evaluate(({ token }) => localStorage.getItem(`billify_handoff_${token}`), { token });
  expect(current).not.toBeNull();
  expect(JSON.parse(current!).from.name).toBe('Sync Persist');
  expect(current!.includes('data:image/png')).toBeFalsy(); // text-only
  expect(logoFrom).not.toBeNull();
  expect(logoFrom!.startsWith('data:image/png')).toBeTruthy();
  expect(handoffKey).toBeNull(); // one-time token consumed
});