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

  // Layout
  {
    path: 'separator',
    loadComponent: () => import('./pages/separator.page').then((m) => m.SeparatorPage),
  },
  {
    path: 'accordion',
    loadComponent: () => import('./pages/accordion.page').then((m) => m.AccordionPage),
  },
  {
    path: 'collapsible',
    loadComponent: () => import('./pages/collapsible.page').then((m) => m.CollapsiblePage),
  },
  {
    path: 'carousel',
    loadComponent: () => import('./pages/carousel.page').then((m) => m.CarouselPage),
  },
  {
    path: 'resizable',
    loadComponent: () => import('./pages/resizable.page').then((m) => m.ResizablePage),
  },
  {
    path: 'scroll-area',
    loadComponent: () => import('./pages/scroll-area.page').then((m) => m.ScrollAreaPage),
  },

  // Data display
  { path: 'table', loadComponent: () => import('./pages/table.page').then((m) => m.TablePage) },
  { path: 'card', loadComponent: () => import('./pages/card.page').then((m) => m.CardPage) },
  { path: 'badge', loadComponent: () => import('./pages/badge.page').then((m) => m.BadgePage) },
  { path: 'avatar', loadComponent: () => import('./pages/avatar.page').then((m) => m.AvatarPage) },
  { path: 'kbd', loadComponent: () => import('./pages/kbd.page').then((m) => m.KbdPage) },
  { path: 'item', loadComponent: () => import('./pages/item.page').then((m) => m.ItemPage) },
  { path: 'empty', loadComponent: () => import('./pages/empty.page').then((m) => m.EmptyPage) },
  {
    path: 'typography',
    loadComponent: () => import('./pages/typography.page').then((m) => m.TypographyPage),
  },
  {
    path: 'aspect-ratio',
    loadComponent: () => import('./pages/aspect-ratio.page').then((m) => m.AspectRatioPage),
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
