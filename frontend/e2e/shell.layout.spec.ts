import { test, expect } from '@playwright/test';

// Layout has no unit test: jsdom has no layout engine, so geometry can only be
// asserted in a real browser. These four assertions are the shell contract —
// header and footer span the viewport, the sidebar occupies only the row
// between them, and the page itself never scrolls.
test.describe('app shell layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
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
