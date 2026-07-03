import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import { UserListViewModel } from './user-list.view-model';
import { Transport } from '../../transport';
import type { OperationName, Req, Res } from '../../contracts';
import type { AppError } from '../../transport';

/** A fake wire whose response (or failure) is supplied per test. */
class FakeTransport extends Transport {
  constructor(private readonly impl: () => Observable<unknown>) {
    super();
  }
  request<K extends OperationName>(_op: K, _payload: Req<K>): Observable<Res<K>> {
    return this.impl() as Observable<Res<K>>;
  }
}

function setup(impl: () => Observable<unknown>): UserListViewModel {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [UserListViewModel, { provide: Transport, useValue: new FakeTransport(impl) }],
  });
  return TestBed.inject(UserListViewModel);
}

describe('UserListViewModel', () => {
  it('load() populates the users signal and clears loading', () => {
    const users = [{ id: '1', name: 'Ada', email: 'ada@x.io' }];
    const vm = setup(() => of(users));

    vm.load();

    expect(vm.users()).toEqual(users);
    expect(vm.loading()).toBe(false);
    expect(vm.error()).toBeNull();
  });

  it('load() puts a failure on the error signal and clears loading', () => {
    const err: AppError = { kind: 'network', message: 'offline', operation: 'users.list' };
    const vm = setup(() => throwError(() => err));

    vm.load();

    expect(vm.error()).toEqual(err);
    expect(vm.loading()).toBe(false);
  });

  it('save() reloads the list on success', () => {
    const users = [{ id: '1', name: 'Ada', email: 'ada@x.io' }];
    const vm = setup(() => of(users));

    vm.save({ name: 'Ada', email: 'ada@x.io' });

    expect(vm.users()).toEqual(users);
  });
});
