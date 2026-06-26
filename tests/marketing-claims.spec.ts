import { test, expect } from '@playwright/test';

/**
 * Regression tests for marketing claims across the site.
 *
 * If you change a claim on the landing, pricing, or templates page, update these
 * tests to match. Better yet: refactor the page to read from a single source
 * of truth (e.g. PLAN_LIMITS, templates array) so the copy can't drift.
 *
 * These tests deliberately assert what is NOT in the copy as well as what is —
 * to catch any new false claims (priority support, history, CSV export, etc.)
 * sneaking back in.
 */

const EXPECTED_TEMPLATE_NAMES = ['Modern', 'Classic', 'Minimal', 'Clean', 'Bold', 'Corporate', 'Startup', 'Freelancer', 'Executive', 'Agency', 'Consulting', 'Creative'];
const EXPECTED_TEMPLATE_COUNT = EXPECTED_TEMPLATE_NAMES.length;
const EXPECTED_PRO_TEMPLATE_COUNT = 10; // 12 total - 2 free (modern, classic)
const FORBIDDEN_CLAIMS = [
  'Priority support',
  '24/7 support',
  'Custom branding',
  'Custom branding colors',
  'Invoice history',
  'CSV/Excel export',
  'CSV export',
  'Excel export',
  '30-day money-back',
  'money-back guarantee',
  'No watermark',
  'Public API',
  'Team seats',
  'White label',
  'Custom domain',
  'Recurring invoices',
  'Multi-currency',
  'Tax compliance',
  'SOC 2',
  'GDPR compliant',
  'HIPAA',
];

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
    // Pro should advertise the correct number of paid templates (10 currently)
    const proMatch = proText?.match(/(\d+)\s*(?:premium\s*)?templates?/i);
    expect(proMatch, 'Pro card should mention a template count').not.toBeNull();
    expect(parseInt(proMatch![1])).toBe(EXPECTED_PRO_TEMPLATE_COUNT);
  });

  test('no false or unsupported marketing claims on the landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(body, `Landing page must not advertise unsupported feature: "${claim}"`).not.toContain(claim);
    }
  });

  test('no false or unsupported marketing claims on the pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(body, `Pricing page must not advertise unsupported feature: "${claim}"`).not.toContain(claim);
    }
  });

  test('schema.org featureList only advertises delivered features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Find the schema.org JSON-LD script
    const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ldJson).toBeTruthy();
    // Pull out featureList value (if present)
    const featureListMatch = ldJson!.match(/"featureList"\s*:\s*"([^"]*)"/);
    if (featureListMatch) {
      const features = featureListMatch[1].toLowerCase();
      for (const claim of FORBIDDEN_CLAIMS) {
        expect(features, `schema.org featureList must not advertise "${claim}"`).not.toContain(claim.toLowerCase());
      }
    }
  });
});
