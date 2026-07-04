import { Routes } from '@angular/router';
import { UserListView } from './features/users/user-list.view';

export const routes: Routes = [
  { path: 'users', component: UserListView },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
];
