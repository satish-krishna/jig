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
  // Actions
  { path: 'button', loadComponent: () => import('./pages/button.page').then((m) => m.ButtonPage) },
  {
    path: 'button-group',
    loadComponent: () => import('./pages/button-group.page').then((m) => m.ButtonGroupPage),
  },
  { path: 'toggle', loadComponent: () => import('./pages/toggle.page').then((m) => m.TogglePage) },
  {
    path: 'toggle-group',
    loadComponent: () => import('./pages/toggle-group.page').then((m) => m.ToggleGroupPage),
  },

  // Forms
  {
    path: 'checkbox',
    loadComponent: () => import('./pages/checkbox.page').then((m) => m.CheckboxPage),
  },

  // Feedback
  { path: 'alert', loadComponent: () => import('./pages/alert.page').then((m) => m.AlertPage) },
  {
    path: 'progress',
    loadComponent: () => import('./pages/progress.page').then((m) => m.ProgressPage),
  },
  {
    path: 'skeleton',
    loadComponent: () => import('./pages/skeleton.page').then((m) => m.SkeletonPage),
  },
  { path: 'spinner', loadComponent: () => import('./pages/spinner.page').then((m) => m.SpinnerPage) },
  { path: 'sonner', loadComponent: () => import('./pages/sonner.page').then((m) => m.SonnerPage) },
];
