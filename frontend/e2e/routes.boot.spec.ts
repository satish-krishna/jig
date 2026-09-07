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

/**
 * A selector that only ever exists once the routed component itself has
 * rendered. `.hlm-shell__main` is NOT such a selector: the shell — header,
 * sidebar, footer and the `<main class="hlm-shell__main">` that wraps
 * `<router-outlet>` — lives in AppShell, outside the outlet (see
 * app-shell.ts), and renders identically whether the routed component threw
 * or not. Waiting on shell chrome proves the shell loaded, not the route.
 *
 * Every showcase page composes `<app-component-page>` around its usages
 * (verified across all page.ts files); `/users` renders `<app-user-list>`.
 */
function outletMarker(route: string): string {
  return route === '/users' ? 'app-user-list' : 'app-component-page';
}

for (const route of routes) {
  test(`${route} boots without a runtime error`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;

      // /users fetches its list over the real HTTP transport on init. This
      // suite runs `ng serve` with no API behind it — deliberately, so the
      // client-side zod validation it exercises stays hermetic (see this
      // route's own comment in playwright.config.ts) — so the browser's
      // network stack logs the refused connection as a console error even
      // though the route renders fine and the repository handles the
      // failure. Excluded only for this exact route and this exact message,
      // not as a blanket filter: any other console error, on any route,
      // still fails the test.
      if (route === '/users' && m.text() === 'Failed to load resource: net::ERR_CONNECTION_REFUSED') return;

      errors.push(m.text());
    });

    // networkidle gives lazy chunks and any async DI resolution room to settle
    // before the assertions below run — a supplementary timing cushion, not
    // the fix: the outlet-content poll right after is what actually proves
    // (or disproves) that the route rendered.
    await page.goto(route, { waitUntil: 'networkidle' });

    // Poll for the routed content to appear OR for an error to land, instead
    // of reading `errors` at one instant. A DI failure or a thrown lifecycle
    // hook is asynchronous relative to navigation — under parallel load, a
    // plain `expect(errors).toEqual([])` can run before the failure has been
    // reported to the listeners above, which is a coin flip, not a check.
    // Polling either condition also means a genuine failure ends the wait
    // immediately rather than always burning the full timeout.
    await expect
      .poll(async () => (await page.locator(outletMarker(route)).count()) > 0 || errors.length > 0, {
        timeout: 10_000,
        message: `${route}: neither did the routed content render inside the outlet, nor was an error observed`,
      })
      .toBe(true);

    // A wrong or drifted route does not 404 here: the showcase's catch-all
    // (`:slug`) renders UndocumentedPage instead, whose "known" branch also
    // composes `<app-component-page>` — so that alone would not distinguish
    // the placeholder from a real page. UndocumentedPage's own host selector,
    // `app-undocumented-page`, is present regardless of which of its branches
    // rendered, so check it separately. Since the route list above is derived
    // from PAGE_ROUTES, every one of these routes should match a static path
    // and never fall through to the wildcard — assert that directly so a
    // future derivation bug fails loudly instead of quietly checking nothing.
    await expect(page.locator('app-undocumented-page')).toHaveCount(0);

    // Whichever condition ended the poll above, name the real error text: a
    // route that never rendered but also never logged anything still fails
    // here with an empty list, which is its own signal worth seeing.
    expect(errors, `${route} logged: ${errors.join(' | ')}`).toEqual([]);
  });
}
