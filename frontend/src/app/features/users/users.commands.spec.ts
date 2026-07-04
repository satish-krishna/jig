import { signal } from '@angular/core';
import { newUserCommand } from './users.commands';
import type { UserListViewModel } from './user-list.view-model';

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
});
