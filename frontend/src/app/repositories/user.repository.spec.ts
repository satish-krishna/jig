import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, firstValueFrom } from 'rxjs';
import { UserRepository } from './user.repository';
import { Transport } from '../transport';
import type { OperationName, Req, Res } from '../contracts';

/** Records which operations the repository asks the transport for. */
class RecordingTransport extends Transport {
  readonly calls: Array<{ op: string; payload: unknown }> = [];
  request<K extends OperationName>(op: K, payload: Req<K>): Observable<Res<K>> {
    this.calls.push({ op, payload });
    return of(undefined as unknown as Res<K>);
  }
}

function setup() {
  const transport = new RecordingTransport();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: Transport, useValue: transport }] });
  return { transport, repo: TestBed.inject(UserRepository) };
}

describe('UserRepository', () => {
  it('list() asks for the users.list operation', async () => {
    const { transport, repo } = setup();
    await firstValueFrom(repo.list());
    expect(transport.calls).toEqual([{ op: 'users.list', payload: {} }]);
  });

  it('get() asks for users.get with the id', async () => {
    const { transport, repo } = setup();
    await firstValueFrom(repo.get('abc'));
    expect(transport.calls).toEqual([{ op: 'users.get', payload: { id: 'abc' } }]);
  });

  it('save() asks for users.save with the user body', async () => {
    const { transport, repo } = setup();
    await firstValueFrom(repo.save({ name: 'A', email: 'a@x.io' }));
    expect(transport.calls).toEqual([{ op: 'users.save', payload: { name: 'A', email: 'a@x.io' } }]);
  });
});
