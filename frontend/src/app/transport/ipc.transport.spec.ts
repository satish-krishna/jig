import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { IpcTransport, INVOKE, type InvokeFn } from './ipc.transport';

function makeSut(invokeSpy: unknown): IpcTransport {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [IpcTransport, { provide: INVOKE, useValue: invokeSpy as InvokeFn }],
  });
  return TestBed.inject(IpcTransport);
}

describe('IpcTransport', () => {
  it('invokes the mapped command with the payload and returns its result', async () => {
    const invokeSpy = vi.fn().mockResolvedValue({ id: '7', name: 'A', email: 'a@x.io' });
    const sut = makeSut(invokeSpy);

    const res = await firstValueFrom(sut.request('users.get', { id: '7' }));

    expect(invokeSpy).toHaveBeenCalledWith('users_get', { id: '7' });
    expect(res.id).toBe('7');
  });

  it('maps save onto the save command', async () => {
    const invokeSpy = vi.fn().mockResolvedValue({ id: '2', name: 'B', email: 'b@x.io' });
    const sut = makeSut(invokeSpy);

    await firstValueFrom(sut.request('users.save', { name: 'B', email: 'b@x.io' }));

    expect(invokeSpy).toHaveBeenCalledWith('users_save', { name: 'B', email: 'b@x.io' });
  });
});
