import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UserFormViewModel } from './user-form.view-model';

function setup(): UserFormViewModel {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [UserFormViewModel] });
  return TestBed.inject(UserFormViewModel);
}

describe('UserFormViewModel', () => {
  it('submit() resolves to null and leaves the fields touched when the model is invalid', async () => {
    const vm = setup();

    const result = await vm.submit();

    expect(result).toBeNull();
    expect(vm.form.name().touched()).toBe(true);
    expect(vm.form.email().touched()).toBe(true);
  });

  it('submit() resolves to the model when it is valid', async () => {
    const vm = setup();
    vm.model.set({ name: 'Ada', email: 'ada@example.io' });

    const result = await vm.submit();

    expect(result).toEqual({ name: 'Ada', email: 'ada@example.io' });
  });
});
