import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Unified site navigation — issue #11 (highest UX priority).
 *
 * SiteNav is ONE component rendered across every content page (landing,
 * pricing, templates, the invoice-templates hub, the invoice-template format
 * pages, the 30 profession pages, privacy, security, authors, compare, guides).
 * These tests pin the four guarantees of the unification so a regression on any
 * single page is caught:
 *
 *   1. The same nav chrome (brand + Templates/Pricing links + Create Invoice
 *      CTA) is present on every page — the menu no longer shifts between pages.
 *   2. The menu is "fixed": pinned at the top of the viewport while scrolling.
 *   3. Active-state highlighting is correct per section: Pricing on /pricing,
 *      Templates across the whole templates funnel (incl. /invoice-template/[format]),
 *      and nothing on section-less pages.
 *   4. On mobile the nav collapses to a hamburger that toggles a dropdown.
 *
 * The /app editor intentionally keeps its own action toolbar (a tool UI, not a
 * marketing nav) and is out of scope here — see sticky-features.spec.ts for that.
 */

// Scope to the site <nav> by the "Billify home" brand mark it always contains.
// Pages also render breadcrumb <nav>s and the footer link <nav>; only the site
// nav holds the brand link, so this filter isolates it unambiguously.
function siteNav(page: Page) {
  return page
    .locator('nav')
    .filter({ has: page.getByRole('link', { name: 'Billify home', exact: true }) });
}

// Next.js dev mode hydrates shortly after first paint. A click that lands in
// the pre-hydration window is a no-op (the React onClick handler isn't wired
// yet — Playwright's actionability check doesn't wait for hydration). So for
// interactions that depend on client state (the mobile menu toggle), retry the
// click until it takes effect. Bounded so it can never loop forever.
async function clickUntilToggled(page: Page, toggle: Locator, value: 'true' | 'false') {
  for (let attempt = 0; attempt < 10; attempt++) {
    if ((await toggle.getAttribute('aria-expanded')) === value) return;
    await toggle.click();
    await page.waitForTimeout(200);
  }
  await expect(toggle).toHaveAttribute('aria-expanded', value);
}

// Representative content pages that must all carry the unified nav.
const PAGES_WITH_NAV = [
  '/',
  '/pricing',
  '/invoice-templates',
  '/templates',
  '/privacy',
  '/security',
];

// The chrome/active-state tests below assert the always-visible DESKTOP nav
// links — the `hidden sm:flex` container in SiteNav. Below the `sm`/640px
// breakpoint (the chromium-mobile / Pixel 5 project, ~412px) those links are
// correctly collapsed into the hamburger and absent from the accessibility
// tree, so the desktop assertions don't apply there. The mobile nav itself is
// covered by the dedicated "mobile: hamburger toggles..." test below. Skip the
// desktop-only tests on small viewports rather than opening the menu, because
// they pin the always-on desktop chrome specifically.
const isMobileViewport = (page: Page) => (page.viewportSize()?.width ?? 1280) < 640;

test.describe('Unified site navigation (issue #11)', () => {
  test('the shared nav chrome is present on every content page', async ({ page }) => {
    test.skip(isMobileViewport(page), 'desktop nav links are hidden below the sm breakpoint; mobile nav is covered by the hamburger test');
    for (const path of PAGES_WITH_NAV) {
      await page.goto(path);
      const nav = siteNav(page);
      await expect(nav, `${path}: site nav renders`).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Billify home', exact: true }), `${path}: brand`).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Templates', exact: true }), `${path}: Templates link`).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Pricing', exact: true }), `${path}: Pricing link`).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Create Invoice', exact: true }), `${path}: CTA`).toBeVisible();
    }
  });

  test('brand links home and CTA links to /app', async ({ page }) => {
    test.skip(isMobileViewport(page), 'desktop nav links are hidden below the sm breakpoint; mobile nav is covered by the hamburger test');
    await page.goto('/');
    const nav = siteNav(page);
    await expect(nav.getByRole('link', { name: 'Billify home', exact: true })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Create Invoice', exact: true })).toHaveAttribute('href', '/app');
  });

  test('fixed menu: nav stays pinned at the top while scrolling', async ({ page }) => {
    await page.goto('/');
    const nav = siteNav(page);
    // "fixed menu" — sticky/fixed positioning so the nav never scrolls away.
    const position = await nav.evaluate((el) => getComputedStyle(el).position);
    expect(['sticky', 'fixed']).toContain(position);

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(1); // pinned at the top of the viewport
  });

  test('active state: Pricing highlighted on /pricing, Templates not', async ({ page }) => {
    test.skip(isMobileViewport(page), 'desktop nav links are hidden below the sm breakpoint; mobile nav is covered by the hamburger test');
    await page.goto('/pricing');
    const nav = siteNav(page);
    await expect(nav.getByRole('link', { name: 'Pricing', exact: true })).toHaveClass(/font-medium/);
    await expect(nav.getByRole('link', { name: 'Templates', exact: true })).not.toHaveClass(/font-medium/);
  });

  test('active state: Templates highlighted across the templates funnel', async ({ page }) => {
    test.skip(isMobileViewport(page), 'desktop nav links are hidden below the sm breakpoint; mobile nav is covered by the hamburger test');
    for (const path of ['/invoice-templates', '/templates', '/invoice-template/pdf']) {
      await page.goto(path);
      const nav = siteNav(page);
      await expect(
        nav.getByRole('link', { name: 'Templates', exact: true }),
        `${path}: Templates should be active`,
      ).toHaveClass(/font-medium/);
      await expect(
        nav.getByRole('link', { name: 'Pricing', exact: true }),
        `${path}: Pricing should be inactive`,
      ).not.toHaveClass(/font-medium/);
    }
  });

  test('active state: nothing highlighted on section-less pages', async ({ page }) => {
    test.skip(isMobileViewport(page), 'desktop nav links are hidden below the sm breakpoint; mobile nav is covered by the hamburger test');
    for (const path of ['/', '/privacy', '/security']) {
      await page.goto(path);
      const nav = siteNav(page);
      await expect(nav.getByRole('link', { name: 'Templates', exact: true }), `${path}`).not.toHaveClass(/font-medium/);
      await expect(nav.getByRole('link', { name: 'Pricing', exact: true }), `${path}`).not.toHaveClass(/font-medium/);
    }
  });

  test('mobile: hamburger toggles the dropdown menu open/closed', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
    await page.goto('/pricing');
    const nav = siteNav(page);

    const toggle = nav.getByRole('button', { name: /menu/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Open the dropdown — the hamburger flips and a nav link becomes visible.
    await clickUntilToggled(page, toggle, 'true');
    await expect(nav.getByRole('link', { name: 'Templates', exact: true }).last()).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pricing', exact: true }).last()).toBeVisible();

    // Close it again — the hamburger flips back.
    await clickUntilToggled(page, toggle, 'false');
    await page.close();
  });
});
