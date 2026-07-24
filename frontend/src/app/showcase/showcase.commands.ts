import { inject, provideAppInitializer, type EnvironmentProviders } from '@angular/core';
import { MenuService, navigateCommand } from '../menu';

/**
 * Registers the showcase NAV command. Same shape as the users slice's nav
 * registration — a showcase nobody can reach is a showcase nobody maintains.
 */
export function registerShowcaseNav(menu: MenuService): void {
  menu.register(
    'sidebar',
    navigateCommand({
      id: 'nav-showcase',
      label: 'components',
      icon: 'lucideComponent',
      route: '/showcase',
    }),
  );
}

export function provideShowcaseMenu(): EnvironmentProviders {
  return provideAppInitializer(() => registerShowcaseNav(inject(MenuService)));
}
