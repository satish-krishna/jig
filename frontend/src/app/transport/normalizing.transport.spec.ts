import { describe, it, expect } from 'vitest';
import { type Observable, of, throwError, firstValueFrom } from 'rxjs';
import { NormalizingTransport } from './normalizing.transport';
import { Transport } from './transport.port';
import type { OperationName, Req, Res } from '../contracts';
import type { AppError } from './app-error';

/** A fake wire whose single behaviour is supplied per test. */
class FakeTransport extends Transport {
  constructor(private readonly impl: () => Observable<unknown>) {
    super();
  }
  request<K extends OperationName>(_op: K, _payload: Req<K>): Observable<Res<K>> {
    return this.impl() as Observable<Res<K>>;
  }
}

describe('NormalizingTransport', () => {
  it('passes a successful response through unchanged', async () => {
    const users = [{ id: '1', name: 'A', email: 'a@x.io' }];
    const sut = new NormalizingTransport(new FakeTransport(() => of(users)));

    const res = await firstValueFrom(sut.request('users.list', {}));

    expect(res).toEqual(users);
  });

  it('folds an HttpErrorResponse-shaped failure into an AppError', async () => {
    const sut = new NormalizingTransport(
      new FakeTransport(() => throwError(() => ({ status: 409, error: { detail: 'dup' } }))),
    );

    const err = (await firstValueFrom(sut.request('users.save', { name: 'a', email: 'a@x.io' })).catch(
      (e) => e,
    )) as AppError;

    expect(err.kind).toBe('conflict');
    expect(err.operation).toBe('users.save');
  });

  it('folds a raw invoke rejection into an AppError', async () => {
    const sut = new NormalizingTransport(new FakeTransport(() => throwError(() => 'rust exploded')));

    const err = (await firstValueFrom(sut.request('users.get', { id: '1' })).catch((e) => e)) as AppError;

    expect(err.kind).toBe('unexpected');
    expect(err.message).toBe('rust exploded');
  });
});
