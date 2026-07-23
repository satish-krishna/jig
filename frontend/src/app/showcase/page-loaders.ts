import type { Routes } from '@angular/router';

/**
 * Explicit slug -> lazy page map. Deliberately not a template-literal dynamic
 * import: the Angular builder resolves lazy chunks statically, so
 * `import('./pages/' + slug)` yields no chunk and fails at runtime.
 *
 * Adding a component page is one line here plus `documented: true` in
 * component-registry.ts. Anything absent falls through to the placeholder page,
 * so the nav can list all 56 from day one without linking into a void.
 */
export const PAGE_ROUTES: Routes = [
  { path: 'checkbox', loadComponent: () => import('./pages/checkbox.page').then((m) => m.CheckboxPage) },
];
