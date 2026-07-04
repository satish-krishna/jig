import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { SidebarNavItem } from './sidebar-nav-item';

// Fake Command: `route` is extra (Command has no such field) but harmless —
// the component only reads id/label/canExecute/execute; the router itself
// carries the url the `active` computed derives from.
function makeCommand() {
  return {
    id: 'nav-users',
    label: 'users',
    route: '/users',
    canExecute: signal(true),
    execute: () => {},
  };
}

describe('SidebarNavItem', () => {
  it('is data-active="true" when the router url matches the command route', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/users', events: EMPTY } }],
    });
    const fixture = TestBed.createComponent(SidebarNavItem);
    fixture.componentRef.setInput('command', makeCommand());
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.hlm-nav__item') as HTMLButtonElement;
    expect(btn.getAttribute('data-active')).toBe('true');
  });

  it('is NOT data-active="true" when the router url does not match the command route', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/settings', events: EMPTY } }],
    });
    const fixture = TestBed.createComponent(SidebarNavItem);
    fixture.componentRef.setInput('command', makeCommand());
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.hlm-nav__item') as HTMLButtonElement;
    expect(btn.getAttribute('data-active')).not.toBe('true');
  });
});
