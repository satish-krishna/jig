import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { newUserCommand, registerUsersNav } from './users.commands';
import type { UserListViewModel } from './user-list.view-model';
import { MenuService } from '../../menu';

describe('newUserCommand', () => {
  it('opens the form on execute and is disabled while saving', () => {
    const saving = signal(false);
    const openForm = vi.fn();
    const vm = { saving, openForm } as unknown as UserListViewModel;
    const cmd = newUserCommand(vm);
    expect(cmd.id).toBe('new-user');
    expect(cmd.canExecute()).toBe(true);
    cmd.execute();
    expect(openForm).toHaveBeenCalled();
    saving.set(true);
    expect(cmd.canExecute()).toBe(false);
  });

  it('registerUsersNav registers the users nav command into the sidebar', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const menu = TestBed.inject(MenuService);
    TestBed.runInInjectionContext(() => registerUsersNav(menu));
    const items = menu.items('sidebar')();
    expect(items.map((c) => c.id)).toEqual(['nav-users']);
    expect(items[0].label).toBe('users');
  });
});
