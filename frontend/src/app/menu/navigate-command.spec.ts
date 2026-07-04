import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { runInInjectionContext } from '@angular/core';
import { navigateCommand } from './navigate-command';

describe('navigateCommand', () => {
  it('navigates to the route on execute and is always executable', async () => {
    const navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { navigate } }],
    });
    const cmd = TestBed.runInInjectionContext(() =>
      navigateCommand({ id: 'nav-users', label: 'users', icon: 'lucideUsers', route: '/users' }),
    );
    expect(cmd.id).toBe('nav-users');
    expect(cmd.canExecute()).toBe(true);
    await cmd.execute();
    expect(navigate).toHaveBeenCalledWith(['/users']);
  });
});
