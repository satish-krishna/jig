import { test, expect } from '@playwright/test';

// Layout has no unit test: jsdom has no layout engine, so geometry can only be
// asserted in a real browser. These assertions are the shell contract —
// header and footer span the viewport, the sidebar occupies only the row
// between them, and the page itself never scrolls.
//
// Looped over two widths: 768 (the narrowest a desktop window is likely to be
// resized to) and 1280 (a typical desktop width). No 375: Jig is a Tauri
// desktop app, not a phone target, and a responsive auditor that goes flaky on
// a viewport nobody ships is worse than one never written.
for (const width of [768, 1280]) {
  test.describe(`app shell layout at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
    });

    test('header and footer span the full viewport width', async ({ page }) => {
      const viewport = page.viewportSize()!.width;

      const header = await page.locator('.hlm-shell__header').boundingBox();
      const footer = await page.locator('.hlm-shell__footer').boundingBox();

      expect(header!.x).toBe(0);
      expect(header!.width).toBe(viewport);
      expect(footer!.x).toBe(0);
      expect(footer!.width).toBe(viewport);
    });

    test('the sidebar occupies only the row between header and footer', async ({ page }) => {
      const header = (await page.locator('.hlm-shell__header').boundingBox())!;
      const footer = (await page.locator('.hlm-shell__footer').boundingBox())!;
      const sidebar = (await page.locator('.hlm-sidebar').boundingBox())!;

      // starts where the header ends, and stops where the footer begins
      expect(sidebar.y).toBeCloseTo(header.y + header.height, 0);
      expect(sidebar.y + sidebar.height).toBeCloseTo(footer.y, 0);
    });

    test('the shell is pinned to the viewport and the page never scrolls', async ({ page }) => {
      const { scrollHeight, clientHeight } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));

      expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
    });

    test('the brand sits in the header, not the sidebar', async ({ page }) => {
      const brand = page.locator('.hlm-shell__header .hlm-brand');
      await expect(brand).toBeVisible();
      await expect(page.locator('.hlm-sidebar .hlm-brand')).toHaveCount(0);

      // and it survives collapsing, because it no longer lives in the rail
      await page.locator('.hlm-sidebar__footer [aria-label="Toggle sidebar"]').click();
      await expect(brand).toBeVisible();
    });

    test('the collapse toggle is anchored in the sidebar footer', async ({ page }) => {
      const toggle = page.locator('.hlm-sidebar__footer [aria-label="Toggle sidebar"]');
      await expect(toggle).toBeVisible();
      await expect(page.locator('.hlm-shell__header [aria-label="Toggle sidebar"]')).toHaveCount(0);

      const shell = page.locator('.hlm-shell');
      await expect(shell).toHaveAttribute('data-collapsed', 'false');

      const sidebarWidth = async () => (await page.locator('.hlm-sidebar').boundingBox())!.width;

      const wide = await sidebarWidth();
      await toggle.click();
      await expect(shell).toHaveAttribute('data-collapsed', 'true');

      // the toggle stays reachable in the collapsed rail — a control that
      // collapses itself out of reach is a one-way door
      await expect(toggle).toBeVisible();

      // Polled, not sampled: the rail animates over .2s (grid-template-columns),
      // so measuring straight after the click reads a mid-transition width and
      // fails only under parallel load.
      await expect.poll(sidebarWidth).toBeLessThan(wide);
    });

    test('only the main content area scrolls', async ({ page }) => {
      // force overflow so there is something to scroll
      await page.evaluate(() => {
        const main = document.querySelector('.hlm-shell__main')!;
        const filler = document.createElement('div');
        filler.style.height = '4000px';
        filler.dataset['testFiller'] = 'true';
        main.appendChild(filler);
      });

      const mainScrolls = await page.evaluate(() => {
        const main = document.querySelector('.hlm-shell__main')!;
        main.scrollTop = 500;
        return main.scrollTop;
      });
      expect(mainScrolls).toBeGreaterThan(0);

      // the header must not have moved with it
      const headerAfter = (await page.locator('.hlm-shell__header').boundingBox())!;
      expect(headerAfter.y).toBe(0);

      const pageScrolled = await page.evaluate(() => window.scrollY);
      expect(pageScrolled).toBe(0);
    });
  });
}
