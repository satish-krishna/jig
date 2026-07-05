import { Injectable, InjectionToken, inject } from '@angular/core';
import { invoke, type InvokeArgs } from '@tauri-apps/api/core';
import { from, type Observable } from 'rxjs';
import { COMMANDS, type OperationName, type Req, type Res } from '../contracts';
import { Transport } from './transport.port';

export type InvokeFn = <T>(cmd: string, args?: InvokeArgs) => Promise<T>;

/** The invoke function, behind a token so tests can supply a fake wire. */
export const INVOKE = new InjectionToken<InvokeFn>('INVOKE', { factory: () => invoke });

/**
 * The IPC wire: maps each operation onto its Tauri command from the registry and
 * calls the Rust core through invoke. There is no auth token here; the local
 * origin is trusted and the Rust core holds the real credentials.
 *
 * @capability transport.ipc
 * @intent The thick-client wire; command knowledge lives in the registry, not in callers.
 * @reuse Selected by provideTransport under Tauri. Do not call directly.
 */
@Injectable()
export class IpcTransport extends Transport {
  private readonly invokeFn = inject(INVOKE);

  request<K extends OperationName>(op: K, payload: Req<K>): Observable<Res<K>> {
    return from(this.invokeFn<Res<K>>(COMMANDS[op], payload as InvokeArgs));
  }
}
