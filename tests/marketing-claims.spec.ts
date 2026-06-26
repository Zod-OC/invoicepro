import { test, expect } from '@playwright/test';

/**
 * Regression tests for marketing claims on the landing page.
 * If you add/remove templates in src/types/index.ts, update these
 * expected counts and names — or refactor the landing page to read
 * directly from the templates array (preferred).
 */

const EXPECTED_TEMPLATE_NAMES = ['Modern', 'Classic', 'Minimal', 'Clean', 'Bold', 'Corporate', 'Startup', 'Freelancer', 'Executive', 'Agency', 'Consulting', 'Creative'];
const EXPECTED_TEMPLATE_COUNT = EXPECTED_TEMPLATE_NAMES.length;

test.describe('Marketing claims — no lying', () => {
  test('landing page advertises correct template count and names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Pull the feature card with the FileText icon — it has the template claim
    const featureCard = page.locator('h3', { hasText: /Stunning Templates/i });
    await expect(featureCard).toBeVisible();

    const title = await featureCard.textContent();
    const titleNumbers = title?.match(/\d+/);
    expect(titleNumbers, 'Template count should be a number').not.toBeNull();
    expect(parseInt(titleNumbers![0])).toBe(EXPECTED_TEMPLATE_COUNT);

    // Description must mention all template names
    const card = featureCard.locator('..').locator('..');
    const desc = await card.textContent();
    for (const name of EXPECTED_TEMPLATE_NAMES) {
      expect(desc, `Template "${name}" should be mentioned in feature card`).toContain(name);
    }
  });

  test('templates page metadata does not overstate count', async ({ page }) => {
    await page.goto('/templates');
    const meta = await page.locator('meta[name="description"]').getAttribute('content');
    expect(meta).toBeTruthy();
    // Should NOT contain inflated claims like "10+"
    expect(meta).not.toMatch(/\b10\+/);
    // Should mention a realistic count or all template names
    const mentionsAll = EXPECTED_TEMPLATE_NAMES.every((n) => meta!.includes(n));
    expect(mentionsAll || /choose.*from \d+/i.test(meta!)).toBe(true);
  });

  test('pricing page Pro card claims a non-zero template count', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    // Find the card containing the Pro subscribe button
    const proCard = page.locator('div', { has: page.getByRole('button', { name: /Subscribe to Pro/i }) }).first();
    await expect(proCard).toBeVisible();
    const proText = await proCard.textContent();
    // Pro should advertise at least 3 templates (we have 4 pro-tier)
    const proMatch = proText?.match(/(\d+)\s*(?:premium\s*)?templates?/i);
    expect(proMatch, 'Pro card should mention a template count').not.toBeNull();
    expect(parseInt(proMatch![1])).toBeGreaterThanOrEqual(3);
  });
});
