import { test, expect } from '@playwright/test';

test.describe('capture screenshots', () => {
  test('templates-full', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/billify-screenshots/templates.png', fullPage: true });
  });
  test('landing-full', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/billify-screenshots/landing.png', fullPage: true });
  });
  test('pricing-full', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/billify-screenshots/pricing.png', fullPage: true });
  });
  test('app-full', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/billify-screenshots/app.png', fullPage: true });
  });
});
