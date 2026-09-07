import { test, expect } from '@playwright/test';
import { PAGE_ROUTES } from '../src/app/showcase/page-loaders';

// Boot every route and fail on an uncaught runtime error. A DI failure throws at
// runtime; the AOT build and Vitest both pass. The route list is derived from
// PAGE_ROUTES — the showcase's own single source of truth for which pages exist
// (see its header comment) — so a route added tomorrow is covered without
// editing this file.
//
// PAGE_ROUTES is used for its `path` strings only: its sole top-level import is
// `import type { Routes }`, which erases at compile time, and every
// `loadComponent` entry is a lazy arrow that Playwright never invokes here.
const routes = ['/users', ...PAGE_ROUTES.map((route) => `/showcase/${route.path}`)];

for (const route of routes) {
  test(`${route} boots without a runtime error`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto(route);
    await expect(page.locator('.hlm-shell__main')).toBeVisible();

    // A wrong or drifted route does not 404 here: the showcase's catch-all
    // (`:slug`) renders UndocumentedPage instead. Since the route list above is
    // derived from PAGE_ROUTES, every one of these routes should match a static
    // path and never fall through to the wildcard — assert that directly so a
    // future derivation bug fails loudly instead of quietly checking nothing.
    await expect(page.locator('app-undocumented-page')).toHaveCount(0);

    expect(errors, `${route} logged: ${errors.join(' | ')}`).toEqual([]);
  });
}
