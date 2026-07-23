import { Routes } from '@angular/router';
import { UserListView } from './features/users/user-list.view';

export const routes: Routes = [
  { path: 'users', component: UserListView },
  {
    path: 'showcase',
    loadChildren: () => import('./showcase/showcase.routes').then((m) => m.SHOWCASE_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
];
