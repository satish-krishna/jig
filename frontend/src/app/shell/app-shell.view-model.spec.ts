import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AppShellViewModel } from './app-shell.view-model';

function setup(): AppShellViewModel {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [AppShellViewModel] });
  return TestBed.inject(AppShellViewModel);
}

describe('AppShellViewModel', () => {
  it('starts expanded', () => {
    const vm = setup();

    expect(vm.collapsed()).toBe(false);
  });

  it('toggle() flips collapsed', () => {
    const vm = setup();

    vm.toggle();
    expect(vm.collapsed()).toBe(true);

    vm.toggle();
    expect(vm.collapsed()).toBe(false);
  });
});
