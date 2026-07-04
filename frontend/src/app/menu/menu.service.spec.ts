import { TestBed } from '@angular/core/testing';
import { Component, signal, DestroyRef } from '@angular/core';
import { MenuService } from './menu.service';
import type { Command } from './command';

const cmd = (id: string): Command => ({ id, label: id, canExecute: signal(true), execute: () => {} });

describe('MenuService', () => {
  it('registers into a region and excludes other regions', () => {
    const svc = TestBed.inject(MenuService);
    TestBed.runInInjectionContext(() => {
      svc.register('sidebar', cmd('a'));
      svc.register('header', cmd('b'));
    });
    expect(svc.items('sidebar')().map((c) => c.id)).toEqual(['a']);
    expect(svc.items('header')().map((c) => c.id)).toEqual(['b']);
  });

  it('auto-unregisters when the caller DestroyRef fires', () => {
    const svc = TestBed.inject(MenuService);
    @Component({ standalone: true, template: '' })
    class Host {
      constructor() { svc.register('header', cmd('scoped')); }
    }
    const fixture = TestBed.createComponent(Host);
    expect(svc.items('header')().map((c) => c.id)).toEqual(['scoped']);
    fixture.destroy();
    expect(svc.items('header')()).toEqual([]);
  });
});
