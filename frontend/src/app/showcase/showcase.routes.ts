import type { Routes } from '@angular/router';
import { FIRST_COMPONENT } from './component-registry';
import { PAGE_ROUTES } from './page-loaders';

/** One lazily-loaded route per documented component; the rest hit the placeholder. */
export const SHOWCASE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./showcase-layout').then((m) => m.ShowcaseLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: FIRST_COMPONENT },
      ...PAGE_ROUTES,
      {
        path: ':slug',
        loadComponent: () => import('./pages/undocumented.page').then((m) => m.UndocumentedPage),
      },
    ],
  },
];
