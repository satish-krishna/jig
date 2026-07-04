import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { SidebarNavItem } from './sidebar-nav-item';

// Fake Command. Active state derives from the router url vs the command's
// id-segment (id 'nav-users' -> '/users'), so the id is what matters here;
// Command has no `route` field.
function makeCommand() {
  return {
    id: 'nav-users',
    label: 'users',
    canExecute: signal(true),
    execute: () => {},
  };
}

describe('SidebarNavItem', () => {
  it('is data-active="true" when the router url matches the nav id segment', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/users', events: EMPTY } }],
    });
    const fixture = TestBed.createComponent(SidebarNavItem);
    fixture.componentRef.setInput('command', makeCommand());
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.hlm-nav__item') as HTMLButtonElement;
    expect(btn.getAttribute('data-active')).toBe('true');
  });

  it('is NOT data-active="true" when the router url does not match the nav id segment', () => {
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
