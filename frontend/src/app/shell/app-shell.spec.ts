import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { AppShell } from './app-shell';
import { MenuService } from '../menu';
import { provideIcons } from '@ng-icons/core';
import { lucideUsers, lucidePlus, lucidePanelLeft } from '@ng-icons/lucide';

describe('AppShell', () => {
  it('renders header commands as buttons and sidebar commands as nav items', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideIcons({ lucideUsers, lucidePlus, lucidePanelLeft })],
    });
    const svc = TestBed.inject(MenuService);
    const injector = TestBed.inject(EnvironmentInjector);
    const executed: string[] = [];
    runInInjectionContext(injector, () => {
      svc.register('sidebar', { id: 'nav-users', label: 'users', icon: 'lucideUsers', canExecute: signal(true), execute: () => { executed.push('nav'); } });
      svc.register('header', { id: 'new-user', label: 'new user', icon: 'lucidePlus', canExecute: signal(false), execute: () => { executed.push('new'); } });
    });
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('users');
    expect(text).toContain('new user');
    const headerBtn = fixture.nativeElement.querySelector('[data-region="header"] button') as HTMLButtonElement;
    expect(headerBtn.disabled).toBe(true); // canExecute() === false
  });
});
