import { computed, inject } from '@angular/core';
import { provideAppInitializer, type EnvironmentProviders } from '@angular/core';
import { MenuService, navigateCommand, type Command } from '../../menu';
import { UserListViewModel } from './user-list.view-model';

/** The users slice's action command: opens the create form, disabled mid-save. */
export function newUserCommand(vm: UserListViewModel): Command {
  return {
    id: 'new-user',
    label: 'new user',
    icon: 'lucidePlus',
    canExecute: computed(() => !vm.saving()),
    execute: () => vm.openForm(),
  };
}

/**
 * Registers the users NAV command app-wide (it must be reachable from anywhere,
 * so it lives for the app's lifetime — provideAppInitializer runs in the root
 * injection context). The ACTION command is registered view-scoped in the view.
 */
export function provideUsersMenu(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(MenuService).register(
      'sidebar',
      navigateCommand({ id: 'nav-users', label: 'users', icon: 'lucideUsers', route: '/users' }),
    );
  });
}
